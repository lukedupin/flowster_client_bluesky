import {useEffect, useState} from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { LinkIcon, PlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import * as Util from '../helpers/util'
import { BeakerIcon } from "@heroicons/react/24/outline/index";


const team = [
    {
        name: 'Tom Cook',
        email: 'tom.cook@example.com',
        href: '#',
        imageUrl:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
        name: 'Whitney Francis',
        email: 'whitney.francis@example.com',
        href: '#',
        imageUrl:
            'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
        name: 'Leonard Krasner',
        email: 'leonard.krasner@example.com',
        href: '#',
        imageUrl:
            'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
        name: 'Floyd Miles',
        email: 'floyd.miles@example.com',
        href: '#',
        imageUrl:
            'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
        name: 'Emily Selman',
        email: 'emily.selman@example.com',
        href: '#',
        imageUrl:
            'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
]

export const EditNodeModal = props => {
    const { node_info, showToast, onClose } = props

    const [state, setState] = useState(null)

    useEffect(() => {
        if ( node_info === null ) {
            setState(null)
        }
        else if ( state === null ) {
            setState(node_info)
        }
    }, [node_info])


    const safe_node_info = node_info || {params:[]}
    //console.log(safe_node_info)

    return (
        <div className={Util.classNames(
            "h-screen w-full max-w-md",
            (node_info === null) ? "hidden" : "",
            )}>

            <div className="overflow-hidden pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16 mt-16">
                <div className={Util.classNames(
                        "pointer-events-auto w-full max-w-md transform transition-all duration-500 ease-in-out",
                        (node_info !== null)  ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
                        )}>
                    <form className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                        <div className="h-0 flex-1 overflow-y-auto">
                            <div className="bg-gray-50 px-4 pt-6 pb-3 sm:px-6 inline-flex w-full items-center">
                                <img src={safe_node_info.image_url}
                                     alt="image"
                                     className="size-12 rounded-full ring-1 ring-indigo-100" />
                                <div className="flex flex-col w-full ml-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-base font-semibold text-gray-900">
                                            {safe_node_info.title}
                                        </div>
                                        <div className="ml-3 flex h-7 items-center">
                                            <button
                                                type="button"
                                                onClick={() => onClose(null)}
                                                className="relative text-gray-400 hover:text-gray-500"
                                            >
                                                <span className="absolute -inset-2.5" />
                                                <span className="sr-only">Close panel</span>
                                                <XMarkIcon aria-hidden="true" className="size-6" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-1">
                                        <p className="text-sm text-gray-500">
                                            {safe_node_info.module}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-1 flex-col justify-between">
                                <div className="divide-y divide-gray-200 px-4 sm:px-6">
                                    {false&&
                                    <div className="pt-6 pb-5">
                                        <label htmlFor="project-description" className="text-sm/6 font-medium text-gray-900">
                                            <div className="flex items-center">
                                                <BeakerIcon className="w-5 h-5 mr-2 text-indigo-600" />
                                                Vibe
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                Flow updates on just this node.
                                            </div>
                                        </label>
                                        <div className="mt-2">
                                                <textarea
                                                    id="project-description"
                                                    name="project-description"
                                                    rows={3}
                                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                                    defaultValue={''}
                                                />
                                        </div>
                                    </div>
                                    }

                                    <div className="space-y-6 pt-6 pb-5">
                                        {safe_node_info.params.map(( param, idx ) => (
                                        <div key={`param_${idx}`}>
                                            <label htmlFor="project-name" className="block text-sm/6 font-medium text-gray-900">
                                                {Util.capitalize(param.name)}
                                                <div className="text-gray-500 text-xs">
                                                    {param.description}
                                                </div>
                                            </label>
                                            <div className="mt-2">
                                                {(!Util.isString(param.value) || (param.value.length < 48 && param.value.indexOf('\n') < 0)) &&
                                                <input
                                                    id="project-name"
                                                    name="project-name"
                                                    type="text"
                                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-600 sm:text-sm/6"
                                                    value={param.value}
                                                />
                                                }
                                                {Util.isString(param.value) && (param.value.length >= 48 || param.value.indexOf('\n') >= 0) &&
                                                <textarea
                                                    id="project-name"
                                                    name="project-name"
                                                    rows={3}
                                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                                    value={param.value}
                                                />
                                                }
                                            </div>
                                        </div>
                                        ))}
                                        {/*
                                        <div>
                                            <label htmlFor="project-description" className="block text-sm/6 font-medium text-gray-900">
                                                Description
                                            </label>
                                            <div className="mt-2">
                                                <textarea
                                                    id="project-description"
                                                    name="project-description"
                                                    rows={3}
                                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                                    defaultValue={''}
                                                />
                                            </div>
                                        </div>
                                        */}
                                        <div>
                                            <h3 className="text-sm/6 font-medium text-gray-900">Team Members</h3>
                                            <div className="mt-2">
                                                <div className="flex space-x-2">
                                                    {team.map((person) => (
                                                        <a
                                                            key={person.email}
                                                            href={person.href}
                                                            className="relative rounded-full hover:opacity-75"
                                                        >
                                                            <img
                                                                alt={person.name}
                                                                src={person.imageUrl}
                                                                className="inline-block size-8 rounded-full"
                                                            />
                                                        </a>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
                                                    >
                                                        <span className="absolute -inset-2" />
                                                        <span className="sr-only">Add team member</span>
                                                        <PlusIcon aria-hidden="true" className="size-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <fieldset>
                                            <legend className="text-sm/6 font-medium text-gray-900">Privacy</legend>
                                            <div className="mt-2 space-y-4">
                                                <div className="relative flex items-start">
                                                    <div className="absolute flex h-6 items-center">
                                                        <input
                                                            defaultValue="public"
                                                            defaultChecked
                                                            id="privacy-public"
                                                            name="privacy"
                                                            type="radio"
                                                            aria-describedby="privacy-public-description"
                                                            className="relative size-4 appearance-none rounded-full border border-gray-300 before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
                                                        />
                                                    </div>
                                                    <div className="pl-7 text-sm/6">
                                                        <label htmlFor="privacy-public" className="font-medium text-gray-900">
                                                            Public access
                                                        </label>
                                                        <p id="privacy-public-description" className="text-gray-500">
                                                            Everyone with the link will see this project.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="relative flex items-start">
                                                        <div className="absolute flex h-6 items-center">
                                                            <input
                                                                defaultValue="private-to-project"
                                                                id="privacy-private-to-project"
                                                                name="privacy"
                                                                type="radio"
                                                                aria-describedby="privacy-private-to-project-description"
                                                                className="relative size-4 appearance-none rounded-full border border-gray-300 before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
                                                            />
                                                        </div>
                                                        <div className="pl-7 text-sm/6">
                                                            <label htmlFor="privacy-private-to-project" className="font-medium text-gray-900">
                                                                Private to project members
                                                            </label>
                                                            <p id="privacy-private-to-project-description" className="text-gray-500">
                                                                Only members of this project would be able to access.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="relative flex items-start">
                                                        <div className="absolute flex h-6 items-center">
                                                            <input
                                                                defaultValue="private"
                                                                id="privacy-private"
                                                                name="privacy"
                                                                type="radio"
                                                                aria-describedby="privacy-private-to-project-description"
                                                                className="relative size-4 appearance-none rounded-full border border-gray-300 before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
                                                            />
                                                        </div>
                                                        <div className="pl-7 text-sm/6">
                                                            <label htmlFor="privacy-private" className="font-medium text-gray-900">
                                                                Private to you
                                                            </label>
                                                            <p id="privacy-private-description" className="text-gray-500">
                                                                You are the only one able to access this project.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>
                                    </div>
                                    <div className="pt-4 pb-6">
                                        xxxx
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 justify-end px-4 py-4">
                            <button
                                type="button"
                                onClick={() => onClose(null)}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                onClick={() => onClose(state)}
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

