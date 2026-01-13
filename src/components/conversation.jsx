import React, {useState, useRef, useEffect, forwardRef} from 'react'
import {
    EditIcon,
    BrainIcon,
    DownloadIcon
} from 'lucide-react'
import * as Util from "../helpers/util.js"
import { TypingIndicator } from "../components/typing_indicator.jsx";
import 'github-markdown-css/github-markdown-light.css';
import { XMarkIcon } from "@heroicons/react/20/solid";
import {
    BarsArrowDownIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline/index";
import {
    MarkdownViewer,
    saveAsMarkdown
} from "../components/markdown_viewer.jsx";


// Forward declare the handle send function
export const Conversation = forwardRef((props, ref) => {
    const {showToast} = props
    const [messages, setMessages] = useState([])
    const [edit_convo, setEditConvo] = useState(null)

    const readerStreamRef = useRef(null)

    const onMessageChange = props.onMessageChange || (() => {})
    const onRetry = props.onRetry || (() => {})
    const onStreamEnd = props.onStreamEnd || (() => {})

    React.useImperativeHandle(ref, () => ({
        handleSend,
    }))

    useEffect(() => {
        onMessageChange(messages)
    }, [messages])
    
    const handleSend = async (message, model, contexts) => {
        if ( !message.trim() ) {
            return
        }

        const newMessage = {
            id: messages.length + 1,
            content: message,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            })
        }
        const newResp = {
            id: messages.length + 2,
            content: '',
            thinking: '',
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            })
        }

        setMessages(prev => [...prev, newMessage, newResp])

        const conversation = messages.map(msg => {
            return {
                role: msg.sender,
                content: msg.thinking ? `<thinking>${msg.thinking}</thinking>\n${msg.content}` : msg.content
            }
        })

        const payload = {question:message, conversation}
        if ( model ) {
            payload.model = model
        }
        payload.contexts = contexts.map( ctx => {
            if ( ctx.file_type === 'image' ) {
                const binary = new Uint8Array(ctx.content).reduce((data, byte) => data + String.fromCharCode(byte), '');
                return {
                    name: ctx.name,
                    content: window.btoa(binary),
                    file_type: 'image'
                }
            }
            else {
                return {
                    name: ctx.name,
                    content: ctx.content,
                    file_type: 'text'
                }
            }
        })
        console.log(payload)

        const stream_resp = await Util.fetch_stream_build('/api/chat', payload )
        if ( stream_resp.err !== null ) {
            showToast(stream_resp.err)
            return
        }

        readerStreamRef.current = stream_resp.reader
        await Util.fetch_stream_consume( readerStreamRef.current,
            (chunk) => {
                if ( chunk.type === 'content' ) {
                    setMessages(prev => {
                        if ( prev.length === 0 ) {
                            return prev
                        }
                        const updated = [...prev]
                        updated[updated.length - 1].content += chunk.text
                        return updated
                    })
                }
                else if ( chunk.type === 'thinking' ) {
                    setMessages(prev => {
                        if ( prev.length === 0 ) {
                            return prev
                        }
                        const updated = [...prev]
                        updated[updated.length - 1].thinking += chunk.text
                        return updated
                    })
                }
                else if ( chunk.type === 'conversation' ) {
                    //console.log(chunk.conversation)
                    //setConversation(chunk.conversation)
                    onStreamEnd()
                }
                else {
                    console.log(chunk.type)
                }
            },
            err => {
                showToast(err)
            })

        // Clear the reader stream ref
        readerStreamRef.current = null
    }

    const handleRemoveMessage = (idx) => {
        if ( readerStreamRef.current !== null ) {
            //Cancel the current stream
            readerStreamRef.current.cancel()
            readerStreamRef.current = null
            return
        }

        setMessages(prev => {
            const updated = [...prev]
            updated.splice(idx, 1)
            return updated
        })
    }

    const handleConvoChange = (e, mode, idx) => {
        if ( e !== null ) {
            e.preventDefault()
        }

        setEditConvo({
            idx,
            mode,
            value: messages[idx][mode]
        })
    }

    const handleUpdate = () => {
        setMessages(prev => {
            const updated = [...prev]
            updated[edit_convo.idx][edit_convo.mode] = edit_convo.value
            return updated
        })

        setEditConvo(null)
    }

    const handleCancel = () => {
        setEditConvo(null)
    }

    const handleRetry = (content, idx) => {
        //Delete all the messages (include this one) to the end
        if ( idx + 2 >= messages.length ) {
            if ( readerStreamRef.current !== null ) {
                //Cancel the current stream
                readerStreamRef.current.cancel()
                readerStreamRef.current = null
            }

            setMessages(prev => {
                const updated = [...prev]
                updated.splice(idx, 2)
                return updated
            })
        }

        onRetry(content)
    }

    // DO nothing
    if ( messages.length === 0 ) {
        return (<></>)
    }

    return (
        <div className="flex-1 overflow-y-auto py-4 space-y-1 sm:px-6 sm:space-y-4">
            {messages.map((msg, idx) => (
                <div key={msg.id}
                    className={Util.classNames('flex', "group",
                                msg.sender === 'user' ? 'justify-end sm:pl-12' : 'justify-start sm:pr-12')}>
                    <div className={Util.classNames('w-full',
                            msg.sender === 'user'
                                ? 'bg-blue-500 text-white rounded-2xl rounded-bl-sm'
                                : 'bg-white text-gray-900 rounded-2xl rounded-tr-sm border border-gray-200',
                        'px-4 py-2 shadow-sm')}>
                        <div className="relative w-full">
                            <XMarkIcon
                                className={'absolute top-0 right-0 w-5 h-5 mt-1 mr-2 cursor-pointer text-gray-400 hover:text-red-600 hidden group-hover:block'}
                                onClick={() => handleRemoveMessage(idx)}
                            />
                        </div>
                        {msg.thinking && (edit_convo === null || edit_convo.idx !== idx || edit_convo.mode !== 'thinking') &&
                            <p className="italic text-sm mb-3 text-yellow-600">
                                {msg.thinking}
                            </p>
                        }

                        {edit_convo && edit_convo.idx === idx &&
                            <div className="w-full">
                                <textarea
                                    className="text-sm text-gray-800 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                                    value={edit_convo.value}
                                    rows={10}
                                    onChange={(e) => setEditConvo(prev => ({...prev, value: e.target.value }))}
                                />

                                <div className="inline-flex gap-3">
                                    <button
                                        onClick={handleUpdate}
                                        className="w-32 flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors shadow-sm font-medium">
                                        <CheckCircleIcon className="size-8 text-green-500 shrink-0" />
                                        Update
                                    </button>

                                    <button
                                        onClick={handleCancel}
                                        className="w-32 flex-1 flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors shadow-sm font-medium" >
                                        <XMarkIcon className="size-8 text-red-500 shrink-0" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        }

                        {msg.sender === 'user' && (edit_convo === null || edit_convo.idx !== idx || edit_convo.mode !== 'content') &&
                            <div>
                                {msg.content}
                            </div>
                        }

                        {msg.sender === 'assistant' && (edit_convo === null || edit_convo.idx !== idx || edit_convo.mode !== 'content') &&
                            <MarkdownViewer
                                content={msg.content}
                                showToast={showToast}
                            />
                        }

                        {!msg.content && !msg.thinking && msg.sender === 'assistant' &&
                            <TypingIndicator />
                        }
                        {msg.content &&
                        <span
                            className={Util.classNames('text-xs mt-1 block inline-flex',
                                msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                            )}>
                            {msg.timestamp}
                            <EditIcon className={Util.classNames("cursor-pointer hidden group-hover:block ml-3 size-4 text-gray-400 shrink-0",
                                                msg.sender === 'user'? "hover:text-white": "hover:text-blue-600")}
                                      onClick={(e) => handleConvoChange(e, 'content', idx) }
                            />
                            {msg.thinking &&
                            <BrainIcon className={Util.classNames("cursor-pointer hidden group-hover:block ml-3 size-4 text-gray-400 shrink-0",
                                                  msg.sender === 'user'? "hover:text-white": "hover:text-blue-600")}
                                        onClick={() => handleConvoChange(null, 'thinking', idx)}
                            />
                            }

                            <DownloadIcon className={Util.classNames("cursor-pointer hidden group-hover:block ml-3 size-4 text-gray-400 shrink-0",
                                                     msg.sender === 'user'? "hover:text-white": "hover:text-blue-600")}
                                            onClick={() => saveAsMarkdown(msg.content)}
                                          />
                            {msg.sender === 'user' &&
                            <BarsArrowDownIcon className={Util.classNames("cursor-pointer hidden group-hover:block ml-3 size-4 text-gray-400 shrink-0",
                                                          msg.sender === 'user'? "hover:text-white": "hover:text-blue-600")}
                                       onClick={() => handleRetry(msg.content, idx)}
                                       />
                            }
                        </span>
                        }
                    </div>
                </div>
            ))}
        </div>
    )
})