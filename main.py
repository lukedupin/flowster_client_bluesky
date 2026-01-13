import os, django

from asgiref.sync import sync_to_async
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pysite.settings')
django.setup()

from website.models.chat_session import ChatSession
from website.models.prompt import Prompt

import uuid
import sys
import re
import aiohttp

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body, Request
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware

from flowster import FlowSheet, FlowProfile, flowster_node, FlowExclude, \
    FlowsterChunk
from flowster.stdlib import media
from flowster.stdlib.ai.llm import chat_stream, chat_result, list_models
import asyncio
import json
import requests
from datetime import datetime

from flowster.stdlib.storage import cache, filesystem
from settings import FLOW_SHEET, SKIP

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def stream_safe( js:dict, bs=32768 ):
    s = json.dumps(js)
    if len(s) <= bs:
        yield f"data: {s}\n\n"
        return

    for i in range(0, len(s), bs):
        payload = {"data": s[i:i+bs], "is_start": i == 0, "is_done": i + bs >= len(s)}
        yield f"partial: {json.dumps(payload)}\n\n"


async def sse_stream( stream, conversation, callback=None ):
    if callback is None:
        async def callback( chunk ):
            pass

    bs = 4096  # Stream in 4KB chunks
    async for chunk in stream:
        await callback(chunk)

        if chunk.type == 'content':
            js = {"type": "content", "text": chunk.text}

        elif chunk.type == 'thinking':
            js = {"type": "thinking", "text": chunk.text}

        elif chunk.type == 'conversation':
            conversation.append( chunk.metadata )
            continue

        else:
            continue

        # Stream safely
        async for packet in stream_safe( js, bs ):
            yield packet

    # Finally send the full conversation
    js = {"type": "conversation", "conversation": conversation}
    async for packet in stream_safe(js, bs):
        yield packet

    await callback( None )


def context_to_kwargs( contexts: list[dict] ):
    kwargs = {}
    for ctx in contexts:
        if not all(k in ctx for k in ('name', 'content')):
            continue
        name, content = ctx['name'], ctx['content']

        if name.lower() == 'system':
            kwargs['system'] = content
        else:
            if 'contexts' not in kwargs:
                kwargs['contexts'] = {}
            kwargs['contexts'][name] = content
    return kwargs


@app.post("/api/chat")
async def chat(request:Request):#question: str=Body(...), conversation: list[dict]=Body(...)):
    body = await request.json()
    chat_session_uid: str = body.get('chat_session_uid', None)
    question: str = body.get('question', '')
    conversation: list[dict] = body.get('conversation', [])
    contexts: list[dict] = body.get('contexts', [])
    model: str = body.get('model', None)

    images = [x['content'] for x in contexts if x['file_type'] == 'image']
    contexts = [x for x in contexts if x['file_type'] != 'image']

    # Add variable params
    kwargs = context_to_kwargs( contexts )

    # Store the model if its changed
    if model is not None and model != "":
        await filesystem.write(FLOW_SHEET, f"model", model)

    # Get or create the chat session
    chat_sess = await ChatSession.getOrCreateByUid(chat_session_uid, question[:64] )

    # Add the user's question
    await Prompt.create( type=Prompt.TYPE_USER, chat_session=chat_sess, content=question )

    # Endpoint that returns a single response
    if (_stream := await chat_stream(
        FLOW_SHEET,
        question,
        conversation=conversation,
        tools=[],
        images=images,
        model=model,
        **kwargs
    )).is_err():
        return {"error": _stream.err_value}
    stream = _stream.ok_value

    # Create the streamer
    if (ret := await chat_result( FLOW_SHEET, stream )).is_err():
        return {"error": ret.err_value}

    await sync_to_async( Prompt.objects.create )(
        chat_session=chat_sess,
        type=Prompt.TYPE_USER,
        content=question,
    )

    # Create my system prompt
    assistant = Prompt(chat_session=chat_sess, type=Prompt.TYPE_ASSISTANT)

    async def save_chat( chunk ):
        if chunk is None:
            await sync_to_async(assistant.save)()

        elif chunk.type == 'full_content':
            assistant.content = chunk.text

        elif chunk.type == 'full_thinking':
            assistant.extra['thinking'] = chunk.text


    """Endpoint that streams events using SSE"""
    return StreamingResponse(
        sse_stream( ret.ok_value, conversation, save_chat ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/api/model")
async def _model(request:Request):
    body = await request.json()
    model: str = body.get('model', None)

    if model is None or model == '':
        model = None
        if (_model := await filesystem.read(FLOW_SHEET, f"model")).is_ok():
            if _model.ok_value is not None and _model.ok_value != '':
                model = _model.ok_value

    else:
        if (ret := await filesystem.write(FLOW_SHEET, f"model", model)).is_err():
            return {"successful": False, "reason": ret.err_value}

    return {"successful": True, "model": model}


@app.get("/api/tags")
async def get_tags():
    if (_ret := await list_models(FLOW_SHEET)).is_err():
        return {"error": _ret.err_value}
    models = _ret.ok_value

    return {"models": models, 'successful': True}


@app.post("/api/agent_create")
async def agent_create(request:Request):#question: str=Body(...), conversation: list[dict]=Body(...)):
    body = await request.json()
    conversation: list[dict] = body.get('conversation', [])
    contexts: list[dict] = body.get('contexts', [])

    agent_uid = str(uuid.uuid4())

    ctx = context_to_kwargs( contexts )
    my_ctx = {'AGENT': ctx.get('system', '')}

    if (ret := await chat_stream(FLOW_SHEET, 'Create 1-2 words to identify this agent.', contexts=my_ctx)).is_err():
        return {"error": ret.err_value}
    stream = ret.ok_value

    if (ret := await chat_result( FLOW_SHEET, stream )).is_err():
        return {"error": ret.err_value}
    result = ret.ok_value

    agent_name = "Agent"
    async for packet in result:
        if packet.type == 'full_content':
            agent_name = packet.text.strip().replace(' ', '_')[:32]
            break

    payload = {
        "agent_uid": agent_uid,
        "name": agent_name,
        "contexts": contexts,
        "conversation": conversation
    }
    if (ret := await filesystem.write(FLOW_SHEET, f"agent:{agent_uid}", payload)).is_err():
        return {"error": ret.err_value}

    print(f"Created agent {agent_uid} -> {agent_name}")
    return {"agent_uid": agent_uid, "name": agent_name, 'successful': True}


@app.post("/api/agent_chat")
async def agent_chat(request:Request):#question: str=Body(...), conversation: list[dict]=Body(...)):
    body = await request.json()
    question: str = body.get('question', '')
    agent_uid: str = body.get('agent_uid', '')
    chat_uid: str = body.get('chat_uid', '')

    # Load the agent data
    if (ret := await cache.read(FLOW_SHEET, f"agent:{agent_uid}:chat:{chat_uid}")).is_err():
        if (ret := await filesystem.read(FLOW_SHEET, f"agent:{agent_uid}")).is_err():
            return {"error": ret.err_value}

    # Load the chat history
    agent_data = ret.ok_value
    contexts, conversation = agent_data['contexts'], agent_data['conversation']

    # Add variable params
    kwargs = context_to_kwargs(contexts)

    # Endpoint that returns a single response
    if (_stream := await chat_stream(
        FLOW_SHEET,
        question,
        conversation=conversation,
        tools=[],
        **kwargs
    )).is_err():
        return {"error": _stream.err_value}
    stream = _stream.ok_value

    # Create the streamer
    if (ret := await chat_result( FLOW_SHEET, stream )).is_err():
        return {"error": ret.err_value}

    async def save_chat():
        payload = {
            "name": agent_data.get('name', 'Agent'),
            "contexts": contexts,
            "conversation": conversation,
            "agent_uid": agent_uid,
            "chat_uid": chat_uid,
        }
        await cache.write(FLOW_SHEET, f"agent:{agent_uid}:chat:{chat_uid}", payload)

    """Endpoint that streams events using SSE"""
    return StreamingResponse(
        sse_stream( ret.ok_value, conversation, callback=save_chat ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/api/agent_list")
async def agent_list(request:Request):#question: str=Body(...), conversation: list[dict]=Body(...)):
    body = await request.json()

    if (ret := await filesystem.list_keys(FLOW_SHEET, f"agent:")).is_err():
        return {"error": ret.err_value}

    agents = []
    for key in ret.ok_value:
        if (ret := await filesystem.read(FLOW_SHEET, key)).is_err():
            continue
        agent_data = ret.ok_value
        if 'agent_uid' not in agent_data:
            continue

        agents.append({
            "agent_uid": agent_data.get('agent_uid'),
            "name": agent_data.get('name', 'Agent'),
        })
    return {"agents": agents, 'successful': True}


@app.post("/api/agent_to_agent_chat")
async def agent_to_agent_chat(request:Request):#question: str=Body(...), conversation: list[dict]=Body(...)):
    body = await request.json()
    question: str = body.get('question', '')
    agent_uid: str = body.get('agent_uid', '')
    chat_uid = str(uuid.uuid4())

    target_agent_uid: str = body.get('target_agent_uid', '')
    target_chat_uid = str(uuid.uuid4())

    # Load the chat history
    async def ping_pong_chat(question):
        yield "\n\n--- Ping Pong ---\n"
        yield question + "\n"

        async with aiohttp.ClientSession() as session:
            for i in range(5):
                payload = {
                    "question": question,
                    "agent_uid": target_agent_uid,
                    "chat_uid": target_chat_uid
                }
                try:
                    async with session.post('http://localhost:8000/api/agent_chat', json=payload) as response:
                        async for line in response.content:
                            yield '.'
                            #yield line.decode().strip()
                except Exception as e:
                    pass

                # Hacky, get the last response from the target agent
                if (ret := await cache.read(FLOW_SHEET, f"agent:{target_agent_uid}:chat:{target_chat_uid}")).is_err():
                    print( ret.err_value )
                    return
                responses = [x['content'] for x in ret.ok_value['conversation'] if x['role'] == 'assistant']
                question = re.sub(r'<thinking>.*?</thinking>', '', responses[-1], flags=re.DOTALL)

                yield "\n\n--- Ping Pong ---\n"
                yield question + "\n"

                # Ask the original agent again
                payload = {
                    "question": question,
                    "agent_uid": agent_uid,
                    "chat_uid": chat_uid
                }
                try:
                    async with session.post('http://localhost:8000/api/agent_chat', json=payload) as response:
                        async for line in response.content:
                            yield '.'
                            #yield line.decode().strip()
                except Exception as e:
                    pass

                # Hacky, get the last response from the target agent
                if (ret := await cache.read(FLOW_SHEET, f"agent:{agent_uid}:chat:{chat_uid}")).is_err():
                    print( ret.err_value )
                    return
                responses = [x['content'] for x in ret.ok_value['conversation'] if x['role'] == 'assistant']
                question = re.sub(r'<thinking>.*?</thinking>', '', responses[-1], flags=re.DOTALL)

                yield "\n\n--- Ping Pong ---\n"
                yield question + "\n"

    """Endpoint that streams events using SSE"""
    return StreamingResponse(
        ping_pong_chat(question),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.websocket("/ws/speech_to_text")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    if SKIP.get('AUDIO_INPUT'):
        await websocket.send_json({"error": "Speech to text is disabled in settings."})
        await websocket.close()
        return

    try:
        async def read_audio():
            while True:
                yield await websocket.receive_bytes()

        # Setup teh audio to text
        if (ret := await media.audio.speech_to_text(
            FLOW_SHEET,
            audio_stream=read_audio(),
        )).is_err():
            print("error", ret.err_value)
            return {"error": ret.err_value}

        async for msg in ret.ok_value:
            print(msg)
            await websocket.send_json(msg)

    except WebSocketDisconnect:
        print("WebSocket disconnected")


@app.get("/")
async def root():
    return {
        "message": "Flowster Server",
        "endpoint": "/stream",
        "info": "Connect to /stream to receive server-sent events"
    }


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

    print(f"Using port {port}")
    import uvicorn
    uvicorn.run('main:app', host="0.0.0.0", port=port, reload=True)#, log_level="debug")

    if False:
        import asyncio

        # Async generator that yields "doug"
        async def yield_doug():
            yield "doug"

        # Async function that returns "dog"
        async def return_dog():
            return "dog"

        # Run both functions
        async def main():
            # Get value from generator
            ret = yield_doug()

            # Get return value
            result = return_dog()

            print(f"Returned: {result}")

        # Execute
        asyncio.run(main())
