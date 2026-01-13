import React, { useState } from "react"
import { TrashIcon } from "@heroicons/react/20/solid"
import * as Util from "../helpers/util.js";
import { Mic, Paperclip, Send } from "lucide-react";
import {Microphone} from "./microphone.jsx";

export const NameField = props => {
    const { name, content, file_type, solo, className, showToast } = props
    const onNameChange = props.onNameChange || (() => {})
    const onContentChange = props.onContentChange || (() => {})
    const onContentAppend = props.onContentAppend || (() => {})
    const onDelete = props.onDelete || (() => {})

    const [isRecording, setIsRecording] = useState(false);
    const [partial, setPartial] = useState('')

    const textareaRef = React.useRef(null)

    const handleTextareaChange = (e) => {
        if ( partial !== '' ) {
            setPartial('')
            return
        }

        onContentChange(e.target.value)

        const max_height = (solo? 10 : 5) * 24 // ~5 lines max

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px'
            const scrollHeight = textareaRef.current.scrollHeight
            textareaRef.current.style.height = Math.min(scrollHeight, max_height) + 'px' // ~5 lines max
        }
    }

    const handleNameChange = (e) => {
        if ( name === 'system') {
            return
        }

        onNameChange(e.target.value)
    }

    const handleToggleRecording = () => {
        setIsRecording(prev => !prev)
    }

    const handleStop = () => {
        if ( partial ) {
            onContentAppend( ' '+ partial )
            setPartial('')
        }

        setIsRecording(false)
    }

    const handleMessageChunk = ( chunk ) => {
        if ( chunk.event === 'final' ) {
            onContentAppend( ' '+ chunk.text )
            setPartial('')
        }
        else if ( chunk.event === 'partial' ) {
            setPartial( chunk.text )
        }
    }

    const w_set = (name === 'system') ? "w-96" : ""
    const set_size = (name !== 'system') ? "w-64 md:w-72": ""
    const content_partial = partial? (content + ' ' + partial).trim(): content

    return (
        <div className={Util.classNames("bg-white border-gray-200 mx-6 my-4", w_set, set_size, className)}>
            <div className={Util.classNames("flex flex-col gap-0.5", w_set)}>
                <div className={Util.classNames("inline-flex", w_set,
                                "w-full bg-gray-50 border border-gray-200 rounded-t-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-hidden"
                    )}>
                    <button className={Util.classNames("p-1 transition-colors sm:mr-2",
                        isRecording ? 'text-green-600 hover:text-red-600' : 'text-gray-400 hover:text-blue-600')}
                            onClick={handleToggleRecording}>
                        <Mic className="ml-1 w-5 h-5 flex-shrink-0" />
                    </button>

                    <input
                        value={name}
                        onChange={handleNameChange}
                        className="bg-transparent border-0 ring-0 text-sm resize-none focus:outline-none focus:ring-0 focus:border-transparent overflow-hidden"
                        disabled={name === 'system'}
                        style={{ minHeight: '44px' }}
                    />

                    {(name !== 'system' || solo) &&
                    <button className="ml-auto mr-2 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <TrashIcon
                            className="w-5 h-5 hover:text-red-600"
                            onClick={onDelete}
                        />
                    </button>
                    }
                </div>

                {file_type !== 'image' &&
                    <textarea
                        ref={textareaRef}
                        value={content_partial}
                        onChange={handleTextareaChange}
                        placeholder="Type a message..."
                        rows="1"
                        className={Util.classNames("px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-b-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-hidden", w_set)}
                        style={{ minHeight: '44px' }}
                    />
                }

                {file_type === 'image' &&
                    <div className="bg-gray-50 border border-gray-200 rounded-b-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-hidden">
                        <img src={URL.createObjectURL(new Blob([content], { type: 'image/png' }))}
                            className="h-32 mx-auto py-2 bg-gray-50 resize-none"
                        />
                    </div>
                }
            </div>

            <Microphone
                stealth={true}
                isRecording={isRecording}
                onStop={handleStop}
                onMessageChunk={handleMessageChunk}
                showToast={showToast}
            />
        </div>
    )
}
