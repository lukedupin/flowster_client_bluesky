import React, {useState, useRef, useEffect, forwardRef} from 'react'
import {
    Send,
    Paperclip,
    Mic,
    EditIcon,
    PlusIcon,
    BrainIcon,
    PlusCircleIcon, DownloadIcon
} from 'lucide-react'
import * as Util from "../helpers/util.js"
import { TypingIndicator } from "../components/typing_indicator.jsx";
import { marked } from 'marked';
//import 'github-markdown-css/github-markdown.css';
import 'github-markdown-css/github-markdown-light.css';
import { XMarkIcon } from "@heroicons/react/20/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline/index";
import {ImportFileModal} from "../modals/import_file_modal.jsx";
import { NameField } from "../components/name_field.jsx";
import { Microphone } from "../components/microphone.jsx";
import {WEB_URL, WS_URL} from "../settings";
import { ChatTextArea } from "../components/chat_text_area.jsx";
import {
    MarkdownViewer,
    saveAsMarkdown
} from "../components/markdown_viewer.jsx";
import {toUuid} from "../helpers/types.js";
import {useParams} from "react-router-dom";
const wsUrl = `${WS_URL}/api/speech_to_text`;


export const AgentInterface = props => {
    const {showToast} = props
    const [message, setMessage] = useState('')
    const [conversation, setConversation] = useState([])
    const [messages, setMessages] = useState([])
    const [edit_convo, setEditConvo] = useState(null)
    const [contexts, setContexts] = useState([])
    const [agentContext, setAgentContext] = useState({})

    const {agentUid} = useParams()

    const [state, setState] = useState({
        importFileModalOpen: false,
    })
    const { importFileModalOpen } = state

    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        setAgentContext({
            agent_uid: agentUid,
            chat_uid: crypto.randomUUID(),
        })
    }, [agentUid])

    const handleSend = (message) => {
        if ( !message.trim() ) {
            return
        }

        const newMessage = {
            id: messages.length + 1,
            text: message,
            sender: 'me',
            timestamp: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            })
        }
        const newResp = {
            id: messages.length + 2,
            text: '',
            thinking: '',
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            })
        }
        setMessages(prev => [...prev, newMessage, newResp])
        setMessage('')

        Util.fetch_stream('/api/agent_chat', {question:message, conversation, contexts, ...agentContext},
            (chunk) => {
                if ( chunk.type === 'content' ) {
                    setMessages(prev => {
                        const updated = [...prev]
                        updated[updated.length - 1].text += chunk.text
                        return updated
                    })
                }
                else if ( chunk.type === 'thinking' ) {
                    setMessages(prev => {
                        const updated = [...prev]
                        updated[updated.length - 1].thinking += chunk.text
                        return updated
                    })
                }
                else if ( chunk.type === 'conversation' ) {
                    console.log(chunk.conversation)
                    setConversation(chunk.conversation)
                }
                else {
                    console.log(chunk.type)
                }
            },
            err => {
                showToast(err)
            })

    }

    const handleRemoveMessage = (idx) => {
        setMessages(prev => {
            const updated = [...prev]
            updated.splice(idx, 1)
            return updated
        })
    }

    const handleResend = (idx) => {
        const msg = messages[idx]
        setMessages(prev => { return prev.slice(0, idx)})
        handleSend(msg.text)
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
        setConversation(prev => {
            const updated = [...prev]

            const content = (edit_convo.mode === 'text') ? edit_convo.value: messages[edit_convo.idx].content
            const thinking = (edit_convo.mode === 'thinking') ? edit_convo.value: messages[edit_convo.idx].thinking

            if ( thinking ) {
                updated[edit_convo.idx].content = `<thinking>${thinking}</thinking>\n${content}`
            }
            else {
                updated[edit_convo.idx].content = content
            }

            return updated
        })

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

    const handleAttachment = () => {
        if ( contexts.filter(x => x.name.toLowerCase() === 'system').length === 0 ) {
            setContexts(prev => ([...prev, {name: 'system', text: ''}]))
        }
        else {
            setState(prev => ({...prev, importFileModalOpen: true}))
        }
    }
    
    const handleAttachmentUpload = ( content ) => {
        console.log(content)
        const name = contexts.filter(x => x.name.toLowerCase() === 'context').length === 0? 'CONTEXT': `CONTEXT_${contexts.length}`
        setContexts(prev => {
            const updated = [...prev]
            updated.push({ name, content })
            return updated
        })
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50">
            {messages.length > 0 &&
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={msg.id}
                        className={Util.classNames('flex', "group",
                                    msg.sender === 'me' ? 'justify-end pl-12' : 'justify-start pr-12')}>
                        <div className={Util.classNames('w-full',
                                msg.sender === 'me'
                                    ? 'bg-blue-500 text-white rounded-2xl rounded-br-sm'
                                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200',
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

                            {msg.sender === 'me' && (edit_convo === null || edit_convo.idx !== idx || edit_convo.mode !== 'text') &&
                                <div>
                                    {msg.text}
                                </div>
                            }

                            {msg.sender === 'assistant' && (edit_convo === null || edit_convo.idx !== idx || edit_convo.mode !== 'text') &&
                                <MarkdownViewer
                                    content={msg.text}
                                />
                            }

                            {!msg.text && !msg.thinking && msg.sender === 'assistant' &&
                                <TypingIndicator />
                            }
                            {msg.text &&
                            <span
                                className={Util.classNames('text-xs mt-1 block inline-flex',
                                    msg.sender === 'me' ? 'text-blue-100' : 'text-gray-400'
                                )}>
                                {msg.timestamp}
                                <EditIcon className="cursor-pointer hidden group-hover:block ml-3 size-4 text-gray-400 shrink-0 hover:text-blue-600"
                                          onClick={(e) => handleConvoChange(e, 'text', idx) }
                                />
                                {msg.thinking &&
                                <BrainIcon className="cursor-pointer hidden group-hover:block ml-3 size-4 text-gray-400 shrink-0 hover:text-blue-600"
                                            onClick={() => handleConvoChange(null, 'thinking', idx)}
                                />
                                }

                                <DownloadIcon className="cursor-pointer hidden group-hover:block ml-3 size-4 text-gray-400 shrink-0 hover:text-blue-600"
                                                onClick={() => saveAsMarkdown(msg.text)}
                                              />

                                {msg.sender === 'me' &&
                                <Send className="cursor-pointer hidden group-hover:block ml-3 size-4 text-gray-400 shrink-0 hover:text-blue-600"
                                          onClick={() => handleResend(idx)}
                                />
                                }
                            </span>
                            }
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            }

            <ImportFileModal
                open={importFileModalOpen}
                onClose={() => setState(prev => ({...prev, importFileModalOpen: false}))}
                onUpload={handleAttachmentUpload}
                title="Import context"
                accept=".csv,.txt,.md"
                />

            <ChatTextArea
                className={messages.length > 0 ? 'border-t' : ''}
                content_count={contexts.length}
                onSend={handleSend}
                onAttachment={handleAttachment}
                showToast={showToast}
            />

            {/* Single input field for name, label of context size, trash can at end, stack theses up with flex  */}
            {contexts.length > 0 &&
            <div className="flex flex-row flex-wrap w-full px-6 bg-white">
                {contexts.map((ctx, idx) => (
                    <NameField
                        key={idx}
                        solo={contexts.length === 1}
                        name={ctx.name}
                        content={ctx.content}
                        onNameChange={(name) => {
                            setContexts(prev => {
                                const updated = [...prev]
                                updated[idx].name = name
                                return updated
                            })
                        }}
                        onContentChange={(content) => {
                            setContexts(prev => {
                                const updated = [...prev]
                                updated[idx].content = content
                                return updated
                            })
                        }}
                        onDelete={() => {
                            setContexts(prev => {
                                const updated = [...prev]
                                updated.splice(idx, 1)
                                return updated
                            })
                        }}
                        />
                ))}
            </div>
            }

        </div>
    )
}
