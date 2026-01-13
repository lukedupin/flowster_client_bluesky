import React, {useState, useRef, useEffect, Fragment} from "react"
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { AtSymbolIcon, CodeBracketIcon, LinkIcon } from '@heroicons/react/20/solid'
import * as Util from "../helpers/util.js"
import {
    PaperClipIcon,
} from '@heroicons/react/20/solid'
import { ChartFlow } from "../components/chart_flow";
import {GenericNode} from "../nodes/generic_node";
import { ReactFlowProvider } from "@xyflow/react";
import {
    BeakerIcon, ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline/index";
import {
    ArrowsRightLeftIcon, DocumentArrowDownIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";

#

export const VibeChat = props => {
    const { convo_exists, in_progress, error, onRemoveContext, onVibe, onFlowsterChat, onDownload, showToast } = props
    const className = props.className || ({})
    const contexts = props.contexts || []

    const [state, setState] = useState( {
        query: '',
    } )
    const { query } = state

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleVibe(e)
        }
    }

    const handleVibe = e => {
        e.preventDefault()
        onVibe( query, contexts )

        setState(prev => ({ ...prev, query: '' }))
    }

    const placeholder = contexts.length === 0? "Describe your workflow" : "Exclusively chat with these nodes";

    return (
        <div className={className}>
            {!convo_exists &&
            <label htmlFor="comment"
                   className="block text-sm/6 font-medium text-gray-900">
                Describe your workflow
            </label>
            }
            <div className="mt-2 pr-2 rounded-md outline outline-1 outline-offset-1 outline-gray-300 focus-within:outline-0 focus-within:ring-2 focus-within:ring-indigo-600">
                {contexts.length > 0 &&
                <div className="inline-flex pt-2 pl-3 gap-x-2">
                    {contexts.map((context, c_idx) => (
                    <div key={`context_key_${c_idx}`} className="text-green-700 bg-green-50 ring-green-600/20 rounded-md pl-2 pr-1 py-1 text-xs font-medium ring-1 ring-inset inline-flex items-center cursor-pointer"
                        onClick={() => onRemoveContext( context )}>
                        {context.title}
                        <XMarkIcon className="size-4 ml-1 text-gray-700" aria-hidden="true" />
                    </div>
                    ))}
                </div>
                }
                <textarea
                    id="comment"
                    name="comment"
                    rows={4}
                    className="w-full bg-transparent ring-0 border-0 focus:border-0 focus:ring-0 text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                    value={query}
                    placeholder={placeholder}
                    onChange={e => setState({ ...state, query: e.target.value })}
                    onKeyDown={handleKeyDown}
                />
            </div>

            <div className="inline-flex">
                <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-3"
                    onClick={handleVibe}>
                    <BeakerIcon className="mr-2 -ml-0.5 h-5 w-5" aria-hidden="true" />
                    Vibe
                </button>

            {in_progress &&
                <button
                    type="button"
                    className="ml-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-3"
                    onClick={onFlowsterChat}>
                    <ChatBubbleLeftRightIcon className="mr-2 -ml-0.5 h-5 w-5" aria-hidden="true" />
                    Chat
                </button>
            }

                {in_progress &&
                <button
                    type="button"
                    className="ml-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-3"
                    onClick={onDownload}>
                    <DocumentArrowDownIcon className="mr-2 -ml-0.5 h-5 w-5" aria-hidden="true" />
                    Download
                </button>
                }
            </div>

            {error &&
            <div className="mt-4">
                    <span className="text-red-500">Error: {error}</span>
            </div>
            }
        </div>
    )
}
