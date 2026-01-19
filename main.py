import os, django

from asgiref.sync import sync_to_async
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pysite.settings')
django.setup()

import uuid
import sys
import re
import aiohttp
import mistune
import re
from typing import List, Dict, Any

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


# Helper to concatenate all text children of a node
def text_from_children(node: Dict[str, Any]) -> str:
    return "".join(
        child["raw"] for child in node.get("children", []) if
        child["type"] == "text"
    )

def parse_variables(text: str):
    BRACE = re.compile(r'\{([^}]+)\}')
    BRACKET = re.compile(r'\[([^\]]+)\]')
    NAME = re.compile(r'([^:]+):')
    PAREN = re.compile(r'\(([^\)]+)\)')

    if not (m := NAME.search(text)):
        return None

    desc = re.sub(r'^[^:]*:', '', text).strip()
    label = m.group(1).strip().capitalize()
    name = label.lower().replace(' ', '_')
    col_span, col_end, data_type, flags = 6, 0, 'string', []
    if (m := BRACE.search(text)):
        desc = desc.replace(m.group(0), '')
        props = m.group(1).split(',')
        col_span = props[0].strip() if len(props) > 0 else 6
        col_end = props[1].strip() if len(props) > 1 else 0
    if (m := BRACKET.search(text)):
        desc = desc.replace(m.group(0), '')
        data_type = m.group(1).strip()
    if (m := PAREN.search(text)):
        desc = desc.replace(m.group(0), '')
        flags = [f.strip() for f in m.group(1).split(',')]

    return {'name': name, 'label': label, 'col_span': col_span, 'col_end': col_end,
            'data_type': data_type, 'flags': flags, 'description': desc.strip()}


@app.post("/api/configure_section")
async def configure_section(request:Request):
    body = await request.json()
    md_text: str = body.get('markdown', '')

    # 1. Create a Mistune instance that returns an AST
    md = mistune.create_markdown(renderer="ast")
    ast = md(md_text)  # → list of node dicts

    features: List[Dict[str, Any]] = []

    title = None
    intro = None
    structure = []

    # Parse the data into "features"
    for node in ast:
        node_type = node["type"]

        if node_type == "heading":
            title = text_from_children(node)
            features.append(
                {
                    "type": "heading",
                    "level": node["attrs"]["level"],
                    "text": text_from_children(node),
                }
            )

        elif node_type == "paragraph":
            intro = text_from_children(node)
            features.append(
                {
                    "type": "paragraph",
                    "text": text_from_children(node),
                }
            )

        elif node_type == "list":
            # Each child of a list is a list_item
            items = []
            for li in node.get("children", []):
                # A list_item contains a paragraph (or several paragraphs)
                # Grab all text from that paragraph
                for child in li.get("children", []):
                    if child["type"] == "paragraph" or child["type"] == "block_text":
                        if (vars := parse_variables(text_from_children(child))):
                            structure.append( vars )
                        items.append(text_from_children(child))
            features.append(
                {
                    "type": "list",
                    "ordered": node["attrs"]["ordered"],
                    "items": items,
                }
            )

    return {
        "features": features,
        "title": title,
        "intro": intro,
        "structure": structure,
        'successful': True
    }

@app.post("/api/chat")
async def chat(request:Request):#question: str=Body(...), conversation: list[dict]=Body(...)):
    body = await request.json()
    question: str = body.get('question', '')
    conversation: list[dict] = body.get('conversation', [])
    contexts: list[dict] = body.get('contexts', [])
    model: str = body.get('model', None)

    if len([x for x in contexts if x.get('name') == 'system']) <= 0:
        contexts.append({
            'name': 'system',
            'content': '''Based on STRUCTURE, update PROFILE. Only output JSON data.''',
            'file_type': 'text',
        })


    if len([x for x in contexts if x.get('name') == 'system_text']) <= 0:
        system_text = {
            'name': 'system_text',
            'content': '''Request for the missing data from PROFILE based on STRUCTURE. Be friendly and concise.''',
            'file_type': 'text',
        }
    else:
        system_text = [x for x in contexts if x.get('name') == 'system_text'][0]
        contexts = [x for x in contexts if x.get('name') != 'system_text']

    images = [x['content'] for x in contexts if x['file_type'] == 'image']
    contexts = [x for x in contexts if x['file_type'] != 'image']

    # Add variable params
    kwargs = context_to_kwargs( contexts )

    # Store the model if its changed
    if model is not None and model != "":
        await filesystem.write(FLOW_SHEET, f"model", model)

    async def _sse_stream():
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
        data_stream = _stream.ok_value

        # Create the streamer
        if (data_only := await chat_result( FLOW_SHEET, data_stream )).is_err():
            return {"error": data_only.err_value}


        kwargs['system'] = system_text['content']

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
        if (stream_ret := await chat_result( FLOW_SHEET, stream )).is_err():
            return {"error": stream_ret.err_value}

        if callback is None:
            async def callback(chunk):
                pass

        bs = 4096  # Stream in 4KB chunks
        async for chunk in data_only:
            if chunk.type == 'full_content':
                js = {"type": "profile", "profile": chunk.text}
                async for packet in stream_safe(js, 4096):
                    yield packet

        async for chunk in stream:
            await callback(chunk)

            if chunk.type == 'content':
                js = {"type": "content", "text": chunk.text}

            elif chunk.type == 'thinking':
                js = {"type": "thinking", "text": chunk.text}

            elif chunk.type == 'conversation':
                conversation.append(chunk.metadata)
                continue

            else:
                continue

            # Stream safely
            async for packet in stream_safe(js, bs):
                yield packet

        # Finally send the full conversation
        js = {"type": "conversation", "conversation": conversation}
        async for packet in stream_safe(js, bs):
            yield packet

        await callback(None)

    """Endpoint that streams events using SSE"""
    return StreamingResponse(
        _sse_stream( data_only.ok_value, stream_ret.ok_value, conversation ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/api/tags")
async def get_tags():
    if (_ret := await list_models(FLOW_SHEET)).is_err():
        return {"error": _ret.err_value}
    models = _ret.ok_value

    return {"models": models, 'successful': True}


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

