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
export const FormUI = props => {
    const {title, fields, profile, onChanged, showToast} = props
    const [content, setContent] = useState({})

    const className = props.className || ""
    const onContentChange = props.onContentChange || (() => {})

    useEffect(() => {
        setContent(profile)
    }, [profile]);

    const handleChanged = ( name, value ) => {
        setContent( prev => ({...prev, [name]: value}) )
        onContentChange( {...content, [name]: value})
    }

    const calcColSpan = (info) => {
        if ( info.col_end !== undefined && info.col_end > 0 ) {
            return `col-start-${info.col_span} col-end-${parseInt(info.col_end) + parseInt(info.col_span)}`
        }

        return `col-span-${info.col_span}`
    }

    return (
        <div className={className}>
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className="grid grid-cols-6 gap-x-6 mb-4">
                {fields.map( (field, idx) => (
                    <div key={idx} className={Util.classNames( calcColSpan(field), "mb-4")}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                            <input
                                type="text"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                value={content[field.name] || ''}
                                onChange={e => handleChanged( field.name, e.target.value)}
                            />
                    </div>
                ))}
            </div>
        </div>
    )
}