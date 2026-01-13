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
import { XMarkIcon } from "@heroicons/react/20/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline/index";
import {ImportFileModal} from "../modals/import_file_modal.jsx";
import { NameField } from "../components/name_field.jsx";
import { Microphone } from "../components/microphone.jsx";
import {ButtonOptions} from "./button_options.jsx";
import {ToggleIcons} from "./toggle_icons.jsx";
import {Dropdown} from "./dropdown.jsx";
import { SelectModelModal } from "../modals/select_model_modal.jsx";


//Forward ref so I can have calls into the textarea
export const ChatTextArea = React.forwardRef((props, ref) => {
    const {className, content_count, showToast} = props
    const onSend = props.onSend || (() => {})
    const onCreateAgent = props.onCreateAgent || (() => {})
    const onAttachment = props.onAttachment || (() => {})

    const [message, setMessage] = useState('')
    const [lastMessage, setLastMessage] = useState('')
    const [isRecording, setIsRecording] = useState(false);
    const [partial, setPartial] = useState('')

    const [pendingSend, setPendingSend] = useState(false);

    const [selectedModel, setSelectedModel] = useState(null)
    const [selectModelModalOpen, setSelectModelModalOpen] = useState(false)

    const textareaRef = useRef(null)

    //Setup ref methods to set or append to the textarea
    React.useImperativeHandle(ref, () => ({
        setMessage: ( text ) => {
            setMessage( text )
        },
        appendMessage: ( text ) => {
            setMessage( prev => (prev + ' ' + text).trim() )
        }
    }))

    useEffect(() => {
        //Fetch agents
        Util.post_js('/api/model', {},
            (js) => {
                if ( js.model ) {
                    setSelectedModel(js.model)
                }
            },
            err => {})
    },[])

    useEffect(() => {
        if ( pendingSend ) {
            onSend( message, selectedModel )
            setPendingSend(false)
            setMessage('')
            setLastMessage( message )
        }
    }, [pendingSend])

    useEffect(() => {
        // Auto-resize textarea
        if (!textareaRef.current) {
            return
        }

        textareaRef.current.style.height = '44px'
        const scrollHeight = textareaRef.current.scrollHeight
        textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px' // ~5 lines max
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;

    }, [message, partial])

    const handleTextareaChange = (e) => {
        if ( partial !== '' ) {
            setPartial('')
        }
        else {
            setMessage( e.target.value )
        }
    }

    const handleAddText = ( text ) => {
        setMessage( prev => (prev + ' ' + text).trim() )
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !(e.shiftKey || e.ctrlKey)) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleKeyDown = (e) => {
        //If the up arrow and the textarea is empty, we could load the last message
        if (e.key === 'ArrowUp' && message.trim() === '') {
            e.preventDefault()

            setMessage( lastMessage )
        }
    }

    const handleSend = (idx) => {
        if ( isRecording ) {
            if ( idx === 1 ) {
                showToast('Please stop recording before sending.')
            }
            else {
                handleStop()
                setPendingSend(true)
            }
        }
        else {
            if ( idx === 1 ) {
                onCreateAgent()
            }
            else {
                onSend(message, selectedModel)
                setMessage('')
                setLastMessage( message )
            }
        }
    }

    const handleToggleRecording = () => {
        if ( !isRecording ) {
            setIsRecording(true)
        }
        else {
            handleStop()
        }
    }

    const handleStop = () => {
        if ( partial ) {
            handleAddText(partial)
            setPartial('')
        }

        setIsRecording(false)
    }

    const handleMessageChunk = ( chunk ) => {
        if ( chunk.event === 'final' ) {
            handleAddText( chunk.text )
            setPartial('')
        }
        else if ( chunk.event === 'partial' ) {
            setPartial( chunk.text )
        }
    }

    const handleListModels = () => {
        setSelectModelModalOpen(true)
    }

    const handleCloseModel = model => {
        setSelectModelModalOpen(false)

        if ( model ) {
            //Fetch agents
            Util.post_js('/api/model', { model },
                (js) => {},
                showToast)
            setSelectedModel(model)
        }
    }
    
    const handleMicKeyDown = event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSend()
        }
    }

    const textarea_text = message + ( isRecording && partial ? ' ' + partial : '' )

    return (
        <div className={Util.classNames(
            "bg-white border-gray-200 pb-4 pt-4 sm:px-6 sm:pt-10", className)}>
            <div className="flex items-center sm:gap-2">
                <div className="mt-auto cursor-pointer p-2 pl-1 sm:pl-2 pb-4 text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0">
                    {content_count <= 0 &&
                        <PlusCircleIcon className="w-6 h-6"
                                  onClick={onAttachment}
                        />
                    }

                    {content_count > 0 &&
                    <Paperclip className="w-5 h-5"
                               onClick={onAttachment}
                    />
                    }
                </div>

                <div className="flex flex-col w-full border border-gray-200 rounded-2xl bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <div className="inline-flex bg-transparent focus-within:ring-0 focus-within:ring-transparent focus-within:border-transparent">
                        <textarea
                            ref={textareaRef}
                            value={textarea_text}
                            onChange={handleTextareaChange}
                            onKeyPress={handleKeyPress}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            rows="1"
                            className="w-full px-4 py-3 pr-12 text-sm border-none bg-transparent resize-none focus:ring-0 overflow-hidden ring-0 outline-0"
                            style={{ minHeight: '44px' }}
                        />
                        <button className={Util.classNames("right-3 bottom-3 p-1 transition-colors sm:mr-2",
                                           isRecording ? 'text-green-600 hover:text-red-600' : 'text-gray-400 hover:text-blue-600')}
                                onKeyDown={handleMicKeyDown}
                                onClick={handleToggleRecording}>
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>
                    {content_count > 0 &&
                        <div className="inline-flex w-min mt-4 ml-2 mb-2 items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-gray-400 dark:bg-blue-400/10 dark:text-gray-400 cursor-pointer hover:text-blue-600 hover:bg-blue-100"
                             onClick={handleListModels}>
                            <BotIcon className="w-5 h-5 mx-2 my-1 flex-shrink-0"/>
                            <div className="whitespace-nowrap mr-2">
                                {selectedModel}
                            </div>
                        </div>
                    }
                </div>

                {content_count > 0 &&
                    <ButtonOptions
                        className="mt-auto mb-2 ml-2 mr-1 flex-shrink-0"
                        buttonClassName="disabled:opacity-50 disabled:cursor-not-allowed"
                        theme="blue"
                        options={['Prompt', 'Create Agent']}
                        onClick={handleSend}
                        disabled={!message.trim()}>
                        <Send className="w-4 h-4" />
                    </ButtonOptions>
                }

                {content_count <= 0 &&
                <button
                    onClick={handleSend}
                    className="mt-2 pt-3 p-2.5 mb-3 mx-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    disabled={!message.trim()}>
                    <Send className="w-4 h-4" />
                </button>
                }
            </div>

            <Microphone
                isRecording={isRecording}
                onStop={handleStop}
                onMessageChunk={handleMessageChunk}
                showToast={showToast}
            />

            <SelectModelModal
                open={selectModelModalOpen}
                onClose={handleCloseModel}
            />
        </div>
    )
})
