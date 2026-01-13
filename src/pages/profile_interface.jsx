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
import {
    BarsArrowDownIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline/index";
import {ImportFileModal} from "../modals/import_file_modal.jsx";
import { NameField } from "../components/name_field.jsx";
import { Microphone } from "../components/microphone.jsx";
import {WEB_URL, WS_URL} from "../settings";
import { ChatTextArea } from "../components/chat_text_area.jsx";
import {
    MarkdownViewer,
    saveAsMarkdown
} from "../components/markdown_viewer.jsx";
import {Conversation} from "../components/conversation.jsx";
const wsUrl = `${WS_URL}/api/speech_to_text`;



export const ProfileInterface = props => {
    const {showToast} = props
    const [contexts, setContexts] = useState([])
    const [scrollLock, setScrollLock] = useState(false)

    const [profile_markdown, setProfileMarkdown] = useState(`# User Profile

This profile contains information about the user that can be used to personalize interactions.

    {
        "name": "John Doe",
        "age": 30,
        "location": "New York, USA",
        "interests": ["technology", "travel", "music"],
        "profession": "Software Engineer",
        "goals": ["learn new programming languages", "travel to 10 countries", "improve guitar skills"]
    }

Feel free to update this profile to better reflect your preferences and background!
`);

    const [state, setState] = useState({
        importFileModalOpen: false,
    })
    const { importFileModalOpen } = state

    const messagesEndRef = useRef(null)
    const chatTextAreaRef = useRef(null)
    const conversationRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleMessageChange = () => {
        if ( scrollLock ) {
            scrollToBottom()
        }
    }
    
    const prevScrollYRef = useRef(0);
    useEffect(() => {
        //if (!scrollLock) {
            //return
        //}

        const onScroll = () => {
            const currentScrollY = window.scrollY ?? window.pageYOffset;
            const prevScrollY   = prevScrollYRef.current;

            if (currentScrollY > prevScrollY) {
                //
            } else if (currentScrollY < prevScrollY) {
                setScrollLock(false)
            }

            prevScrollYRef.current = currentScrollY;
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, [])

    const handleAttachment = () => {
        if ( contexts.filter(x => x.name.toLowerCase() === 'system').length === 0 ) {
            setContexts(prev => ([...prev, {name: 'system', text: ''}]))
        }
        else {
            setState(prev => ({...prev, importFileModalOpen: true}))
        }
    }
    
    const handleAttachmentUpload = ( content, file_type ) => {
        console.log(content)
        let name = null
        if ( file_type === 'image' ) {
            name = contexts.filter(x => x.name.toLowerCase() === 'image').length === 0? 'IMAGE': `IMAGE_${contexts.length}`
        }
        else {
            name = contexts.filter(x => x.name.toLowerCase() === 'context').length === 0? 'CONTEXT': `CONTEXT_${contexts.length}`
        }
        setContexts(prev => {
            const updated = [...prev]
            updated.push({ name, content, file_type })
            return updated
        })
    }

    const handleCreateAgent = () => {

        // Create the agent
        Util.post_js('/api/agent_create', {conversation, contexts},
            (js) => {
                showToast("Agent created successfully! "+ js.agent_uid, "success")
            },
            err => {
                showToast(err)
            })

    }

    const handleRetry = (content) => {
        chatTextAreaRef.current.setMessage(content)
    }

    const handleSend = (message, model) => {
        conversationRef.current.handleSend(message, model, contexts)
    }

    return (
        <div className="grid grid-cols-2" >
            <div className="col-span-1 flex-1 flex flex-col h-full bg-gray-50 border">
                <Conversation
                    ref={conversationRef}
                    onMessageChange={handleMessageChange}
                    onRetry={handleRetry}
                    onStreamEnd={() => setScrollLock(false)}
                    showToast={showToast}
                />

                <ImportFileModal
                    open={importFileModalOpen}
                    onClose={() => setState(prev => ({...prev, importFileModalOpen: false}))}
                    onUpload={handleAttachmentUpload}
                    title="Import context"
                    accept=".csv,.txt,.md,.jpg,.jpeg,.png,.pdf"
                    />

                {/* Single input field for name, label of context size, trash can at end, stack theses up with flex  */}
                {contexts.length > 0 &&
                <div className="flex flex-row flex-wrap w-full sm:pl-12 sm:pr-6 bg-white">
                    {contexts.map((ctx, idx) => (
                        <NameField
                            key={idx}
                            solo={contexts.length === 1}
                            name={ctx.name}
                            content={ctx.content}
                            file_type={ctx.file_type}
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
                            onContentAppend={(content) => {
                                setContexts(prev => {
                                    const updated = [...prev]
                                    console.log(updated[idx].content, content)
                                    updated[idx].content += content
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
                            showToast={showToast}
                            />
                    ))}
                </div>
                }

                <ChatTextArea
                    ref={chatTextAreaRef}
                    className="border-t"
                    content_count={contexts.length}
                    onSend={handleSend}
                    onAttachment={handleAttachment}
                    onCreateAgent={handleCreateAgent}
                    showToast={showToast}
                />
            </div>

            <div className="col-span-1 border bg-white h-full p-4">
                <h2 className="text-lg font-medium mb-4">User Profile</h2>
                <div className="mb-6">
                    <div className="markdown-body max-h-48 p-2 rounded bg-gray-50">
                        <MarkdownViewer content={profile_markdown} />
                    </div>
                </div>
            </div>
        </div>
    )
}
