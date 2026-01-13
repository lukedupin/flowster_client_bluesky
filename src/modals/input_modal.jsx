import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export const InputModal = props => {
    const { id, name, open, title, placeholder } = props
    const defaultValue = props.defaultValue || ""
    const inputType = props.inputType || "text"
    const onClose = props.onClose || (() => {})
    const onConfirm = props.onConfirm || onClose
    const cancelBtn = props.cancelBtn || "Cancel"
    const confirmBtn = props.confirmBtn || "Ok"

    const [value, setValue] = useState( defaultValue )

    useEffect( () => {
        if ( open ) {
            setValue( defaultValue )
        }
    }, [open] )

    const handleChange = ( e ) => {
        setValue( e.target.value )
    }

    const handleEnter = ( e ) => {
        if ( e.key === 'Enter' ) {
            onConfirm( { target: { id, name, value } } )
        }
    }

    return (
        <Dialog open={open} onClose={onClose} className="relative z-10">
            <Dialog.Backdrop
                transition
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <Dialog.Panel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95">
                        <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                            <button
                                type="button"
                                onClick={() => onClose(false)}
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-offset-2" >
                                <span className="sr-only">Close</span>
                                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                <QuestionMarkCircleIcon aria-hidden="true" className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <Dialog.Title as="h3" className="text-base font-semibold text-gray-900">
                                    {title}
                                </Dialog.Title>
                                <div className="mt-4">
                                    <input
                                        id={id}
                                        name={name}
                                        type={inputType}
                                        placeholder={placeholder}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                                        value={value}
                                        onKeyDown={handleEnter}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                                type="button"
                                onClick={() => onConfirm( { target: { id, name, value } } )}
                                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 sm:ml-3 sm:w-auto px-4">
                                {confirmBtn}
                            </button>
                            <button
                                type="button"
                                onClick={() => onClose(false)}
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" >
                                {cancelBtn}
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    )
}
