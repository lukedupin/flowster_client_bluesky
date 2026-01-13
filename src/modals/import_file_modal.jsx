import React, {
    forwardRef, Fragment, useEffect, useImperativeHandle, useRef, useState
} from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Spinner } from "../components/spinner"
import * as Util from "../helpers/util"


export const ImportFileModal = forwardRef((props, ref) => {
    const { open, load_on_start, onUpload, onClose, showToast } = props
    const title = props.title || "Import XLSX"
    const accept = props.accept || ".xls, .xlsx, .csv"

    useImperativeHandle(ref, () => ({
        cancelUpload() {
            setState(prev => ({ ...prev, uploading: false }))
        }
    }))

    const initial_state = {
        loaded_on_start: false,
        filename: '',
        raw_file: null,
        uploading: false,
    }

    const [state, setState] = useState(initial_state)
    const { loaded_on_start, filename, raw_file, uploading } = state

    const fileRef = useRef(null)

    useEffect( () => {
        if ( open && load_on_start && !loaded_on_start && fileRef.current ) {
            fileRef.current.click()
            setState(prev => ({ ...prev, loaded_on_start: true }))
        }
    })

    useEffect(() => {
        if ( !open ) {
            setState( initial_state )
        }
    }, [open])

    const handleUpload = () => {
        if ( raw_file === null ) {
            showToast('Please select a spreadsheet', "warning")
            return
        }

        //Check the extension if its an image
        console.log(raw_file)
        const reader = new FileReader()
        if ( ['png', 'jpg', 'jpeg'].indexOf(Util.getExtension(raw_file.name)) >= 0 ) {
            reader.onload = (event) => {
                onUpload( event.target.result, 'image' )
            }
            reader.readAsArrayBuffer(raw_file)
        }
        else {
            reader.onload = (event) => {
                const text = event.target.result
                onUpload(text, 'txt')
            }
            reader.readAsText(raw_file)
        }

        //Show the spinner
        //setState(prev => ({ ...prev, uploading: true }))
        onClose()
    }

    const handleFileClick = () => {
        if ( uploading ) {
            return
        }

        fileRef.current.click()
    }

    const handleFileChange = (e) => {
        if ( uploading || !('files' in e.target) || !e.target.files.length ) {
            return
        }

        const raw_file = e.target.files[0]
        if ( raw_file === null || raw_file === undefined ) {
            return
        }

        setState(prev => ({ ...prev,
            filename: raw_file.name,
            raw_file,
        }))
    }

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-40" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-40 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel
                                className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                {!uploading &&
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onClose}>
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6"
                                                   aria-hidden="true"/>
                                    </button>
                                </div>
                                }
                                <div className="sm:flex sm:items-start">
                                    <div
                                        className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 sm:mx-0 sm:h-10 sm:w-10">
                                        <DocumentTextIcon
                                            className="h-6 w-6 text-white flex-shrink-0"
                                            aria-hidden="true"/>
                                    </div>
                                    <div
                                        className="mt-3 text-center sm:mx-4 sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3"
                                                      className="text-base font-semibold leading-6 text-gray-900">
                                            {title}
                                        </Dialog.Title>
                                        <div className="mt-3 w-full">
                                            <input
                                                ref={fileRef}
                                                className="hidden"
                                                type="file"
                                                accept={accept}
                                                onChange={handleFileChange}
                                            />
                                            <input
                                                type="text"
                                                id="filename"
                                                name="filename"
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                placeholder="Click to select a spreadsheet"
                                                readOnly
                                                value={filename}
                                                onClick={handleFileClick}
                                            />
                                            <p className="mt-1 text-sm text-gray-500">
                                                File formats ({accept})
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {uploading &&
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <Spinner className="ml-2 w-6 h-6 text-blue-600 z-50" />
                                </div>
                                }
                                {!uploading &&
                                <div
                                    className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                                        onClick={handleUpload}>
                                        Upload
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        onClick={onClose}>
                                        Cancel
                                    </button>
                                </div>
                                }
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
})
