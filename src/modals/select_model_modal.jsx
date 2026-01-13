import React, {
    forwardRef, Fragment, useEffect, useImperativeHandle, useRef, useState
} from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Spinner } from "../components/spinner"
import * as Util from "../helpers/util"
import {BotIcon} from "lucide-react";


import {
    ChevronRightIcon,
    EnvelopeIcon,
    PhoneIcon
} from '@heroicons/react/20/solid'

const people = [
  {
    name: 'Jane Cooper',
    title: 'Paradigm Representative',
    role: 'Admin',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  }
]

export const ModelCard = (props) => {
    const {model, onClick} = props

    return (
        <li key={model.digest} className="relative py-5 hover:bg-gray-50 cursor-pointer"
            onClick={e => onClick(model)}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-4xl justify-between gap-x-6">
              <div className="flex min-w-0 gap-x-4">
                <BotIcon className="size-12 flex-none rounded-full bg-gray-50" />
                <div className="min-w-0 flex-auto">
                  <div className="text-sm/6 font-semibold text-gray-900">
                      <span className="absolute inset-x-0 -top-px bottom-0" />
                      {model.model}
                  </div>
                  <div className="mt-1 flex text-xs/5 text-gray-500">
                    <div className="relative truncate hover:underline">
                      {model.details.family} - {model.details.quantization_level}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-4">
                <div className="hidden sm:flex sm:flex-col sm:items-end">
                  <div className="text-sm/6 text-gray-900">
                      {model.details.parameter_size}
                  </div>
                </div>
                <ChevronRightIcon aria-hidden="true" className="size-5 flex-none text-gray-400" />
              </div>
            </div>
          </div>
        </li>
    )
}


export const SelectModelModal = (props) => {
    const { open, onClose, showToast } = props
    const title = props.title || "Select Model"

    const [models, setModels] = useState([])

    useEffect(() => {
        if ( !open ) {
            setModels([])
            return
        }

        //Fetch list of models from server
        Util.fetch_js('/api/tags', null,
            js => {
                //console.log(js.models)
                setModels(js.models)
            },
            showToast)


    }, [open])

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
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={e => onClose()}>
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6"
                                                   aria-hidden="true"/>
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div
                                        className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 sm:mx-0 sm:h-10 sm:w-10">
                                        <BotIcon className="w-6 h-6 text-white flex-shrink-0"/>
                                    </div>
                                    <div
                                        className="mt-3 text-center sm:mx-4 sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3"
                                                      className="text-base font-semibold leading-6 text-gray-900">
                                            {title}
                                        </Dialog.Title>
                                    </div>
                                </div>
                                    <ul role="list" className="divide-y divide-gray-100">
                                        {models.map((model, idx) => (
                                            <ModelCard
                                                key={`model_card_${idx}`}
                                                model_idx={idx}
                                                model={model}
                                                onClick={m => onClose(model.model)}
                                            />
                                        ))}
                                    </ul>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        onClick={e => onClose()}>
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
