import React, {useState, useRef, useEffect, forwardRef} from 'react'
import {
    Send,
    Paperclip,
    Mic,
    EditIcon,
    PlusIcon,
    BrainIcon,
    PlusCircleIcon, DownloadIcon, BotIcon
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
import {FormUI} from "../components/form_ui.jsx";
const wsUrl = `${WS_URL}/api/speech_to_text`;



export const ProfileInterface = props => {
    const {showToast} = props
    const [contexts, setContexts] = useState([
    ])
    const [scrollLock, setScrollLock] = useState(false)
    const [configuration, setConfiguration] = useState('')
    const [section, setSection] = useState({
        title: '',
        intro: '',
        structure: [],
    })

    const [profile, setProfile] = useState('{}')

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

As the user continues to chat with the bot, the profile will be updated.
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

    const handleProfile = ( profile ) => {
        setProfile( profile )
        setProfileMarkdown(`# User Profile
This profile contains information about the user that can be used to personalize interactions.

${'```json\n' + JSON.stringify(profile, null, 2) + '\n```'}

Feel free to update this profile to better reflect your preferences and background!
`)
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

    const handleConfigurationChange = (e) => {
        setConfiguration(e.target.value)

        Util.fetch_js('/api/configure_section', { markdown: e.target.value },
            (js) => {
                console.log(js)
                setSection(js)
            },
            err => showToast)
    }

    const handleRestart = () => {
        Util.fetch_js('/api/configure_section', { markdown: configuration },
            (js) => {
                console.log(js)
                setSection(js)
                setProfile({})

                conversationRef.current.setMessages([{
                    id: 0,
                    content: js.intro,
                    sender: 'assistant',
                    timestamp: new Date().toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                    })
                }])
            },
            err => showToast)
    }

    return (
        <div className="grid grid-cols-2" >
            <FormUI
                className="col-span-1 border bg-white h-full p-4"
                fields={section.structure}
                title={section.title || "Section"}
                profile={profile}
                onContentChange={handleProfile}
                showToast={showToast}
            />

            <div className="col-span-1 border bg-white w-full h-full px-4">
                <div className="markdown-body p-2 rounded bg-gray-50">
                    <MarkdownViewer content={profile_markdown} />
                </div>
            </div>

            <div className="col-span-1 border bg-white w-full h-full p-4">
                <h2 className="text-xl font-bold mb-4">Section Configuration</h2>
                <div className="flex flex-col w-full border border-gray-200 rounded-2xl bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <div className="inline-flex bg-transparent focus-within:ring-0 focus-within:ring-transparent focus-within:border-transparent">
                        <textarea
                            value={configuration}
                            onChange={handleConfigurationChange}
                            placeholder={`# Example section name\n\nExample introduction.\n\n - name: {3} The users name\n - age: {1} [integer] The users age`}
                            rows="20"
                            className="w-full px-4 py-3 pr-12 text-sm border-none bg-transparent resize-none focus:ring-0 overflow-hidden ring-0 outline-0"
                        />
                    </div>
                </div>
                <button
                    className="mt-2 p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    onClick={handleRestart}>
                    Restart
                </button>
            </div>

            <div className="col-span-1 flex-1 flex flex-col h-full bg-gray-50 border">
                <h2 className="text-2xl font-bold p-4">User Conversation</h2>
                <Conversation
                    ref={conversationRef}
                    section={section}
                    profile={profile}
                    onProfile={handleProfile}
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

        </div>
    )
}
