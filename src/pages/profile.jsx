import { PhotoIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import * as Util from "../helpers/util.js";
import {useStore} from "../store";
import { ConfirmModal } from "../modals/confirm_modal";
import { ButtonOptions } from "../components/button_options";
import {ArrowPathIcon, ArrowUpTrayIcon} from "@heroicons/react/24/outline";
import {StateTitle} from "../components/state_title";
import {TagComp} from "../components/tag_comp";
import {COLORS, PRIORITIES} from "../helpers/consts";
import {PriorityComp} from "../components/priority_comp";
import {ComboboxMenu} from "../components/combobox_menu";
import {TrashIcon} from "@heroicons/react/20/solid";


const ResyncActions = {
    RESYNC: 0,
    UPLOAD: 1,
}

const ResyncOptions = [
    'Google Sync',
    'Upload Image',
]

export const Profile = props => {
    const { government_uid, governments, session_uid, sessions, onGovernmentChange, onSessionChange, showToast } = props

    const [state, setState] = useState({
        auth: '',
        name: '',
        email: '',
        phone: '',
        profile_url: null,
        password: '',
        password_repeat: '',
        confirm_remove: false,
        raw_file: null,
        filename: null,

        documents: [],
        committees: [],
        tags: [],

        document_uids: {},
        committee_uids: {},
        tag_uids: {},
        colors: {},
        priorities: {},
    })
    const {auth, name, email, phone, profile_url, password, password_repeat, confirm_remove, raw_file, filename, documents, committees, tags, committee_uids, tag_uids, document_uids, priorities, colors} = state

    const fileRef = React.useRef(null)

    const navigate = useNavigate()

    const {human_uid} = useParams()

    const { usr_info, setUsrInfo } = useStore( x => x )

    useEffect(() => {
        if ( human_uid === null || human_uid === undefined || human_uid === "create" ) {
            return
        }

        //Load up the humans
        Util.fetch_js('/api/human/detail/', { human_uid },
            js => {
                const { name, auth, email, phone, profile_url } = js.human
                setState(prev => ({...prev,
                    auth,
                    name,
                    email,
                    phone,
                    profile_url,
                }))
            }, showToast)

        //Get the tags
        Util.fetch_js('/api/tags/list/', {},
            js => {
                setState(prev => ({...prev,
                    tags: js.tags
                }))
            }, showToast)
    }, [])

    useEffect(() => {
        //If there is no committee, set this to the empty set
        if (session_uid === null || session_uid === undefined || session_uid === '') {
            setState(prev => ({...prev,
                committees: []
            }))
            return
        }

        //Load up the committees
        Util.fetch_js('/api/committee/list/', { session_uid },
            js => {
                setState(prev => ({...prev,
                    committees: js.committees
                }))
            })

        //Load up the documents
        Util.fetch_js('/api/document/list/', { government_uid, session_uid },
            js => {
                setState(prev => ({...prev,
                    documents: js.documents
                }))
            })

        //Get my current notification settings
        Util.fetch_js('/api/notification/list/', { human_uid },
            js => {
                const document_uids = {}
                const committee_uids = {}
                const tag_uids = {}
                const colors = {}
                const priorities = {}

                js.document_uids.forEach(uid => document_uids[uid] = true)
                js.committee_uids.forEach(uid => committee_uids[uid] = true)
                js.tag_uids.forEach(uid => tag_uids[uid] = true)
                js.colors.forEach(color => colors[color] = true)
                js.priorities.forEach(priority => priorities[priority] = true)

                setState(prev => ({...prev,
                    document_uids,
                    committee_uids,
                    tag_uids,
                    colors,
                    priorities,
                }))
            })
    }, [government_uid, session_uid]);

    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            handleSave( true )
        }
    }

    const handleSave = (prevent_nav) => {
        if ( password !== '' && password !== password_repeat ) {
            showToast( 'Passwords do not match', 'Error' )
            return
        }

        const pwd_hash = (password === '') ? null : Util.hashStr(password)
        const action = (human_uid === null || human_uid === undefined || human_uid === "create") ? 'create' : 'modify'

        Util.fetch_js( `/api/human/${action}/`, { email, name, pwd_hash, human_uid, image: raw_file },
            js => {
                if ( js.human.uid === usr_info.uid ) {
                    const { name, email, profile_url } = js.human
                    setUsrInfo( { ...usr_info, name, email, profile_url } )
                }

                if ( !prevent_nav ) {
                    navigate( '/team' )
                }
                showToast( 'Updated', 'Successful' )
            }, showToast)
    }

    const handleDelete = del => {
        if ( !del ) {
            setState(prev => ({...prev,
                confirm_remove: false,
            }))
            return
        }

        Util.fetch_js( `/api/human/disable/`, { human_uids: [human_uid], disable: true },
            js => {
                navigate( '/team' )
                showToast( 'Deleted', 'Successful' )
            }, showToast)
    }

    const handleAddDocument = uid => {
        console.log(uid)
        const document_uids = state.document_uids
        document_uids[uid] = true

        Util.fetch_js( `/api/notification/modify/`, { government_uid, session_uid, document_uids: Object.keys(document_uids) },
            js => {}, showToast)

        setState(prev => ({...prev,
            document_uids
        }))
    }

    const handleRemoveDocument = uid => {
        const document_uids = state.document_uids
        delete document_uids[uid]

        Util.fetch_js( `/api/notification/modify/`, { government_uid, session_uid, document_uids: Object.keys(document_uids) },
            js => {}, showToast)

        setState(prev => ({...prev,
            document_uids
        }))
    }

    const handleChange = e => {
        const { name, value } = e.target;
        setState(prev => ({ ...prev,
            [name]: value
        }))
    }

    const handleChecked = (key, uid, checked) => {
        const obj = state[key]
        if ( checked ) {
            obj[uid] = true
        }
        else {
            delete obj[uid]
        }

        Util.fetch_js( `/api/notification/modify/`, { government_uid, session_uid, [key]: Object.keys(obj) },
            js => {}, showToast)

        setState(prev => ({ ...prev,
            [key]: obj
        }))
    }

    const handleFileChange = (e) => {
        const raw_file = e.target.files[0];

        //Set the state
        setState(prev => ({...prev,
            profile_url: URL.createObjectURL(raw_file),
            filename: raw_file.name,
            raw_file,
        }))
    }

    const handleFileClick = () => {
        fileRef.current.click();
    };

    const handleResync = action => {
        if ( action === ResyncActions.RESYNC ) {
            Util.fetch_js( `/api/human/modify/`, { resync_profile: true },
                js => {
                    if ( js.human.uid === usr_info.uid ) {
                        const { name, email, profile_url } = js.human
                        setUsrInfo( { ...usr_info, name, email, profile_url } )
                    }

                    setState(prev => ({...prev,
                        profile_url: js.human.profile_url,
                    }))

                    showToast( 'Resynced', 'Successful' )
                }, showToast)
        }
        else if ( action === ResyncActions.UPLOAD ) {
            handleFileClick()
        }
    }

    const handleGovernmentChange = uid => {
        const government = governments.find(x => x.uid === uid)
        if (government !== undefined && government !== null) {
            onGovernmentChange({target: {name: 'government_uid', value: government.uid}})
        }
    }

    const handleSessionChange = name => {
        const session = sessions.find(x => x.name === name)
        if (session !== undefined && session !== null) {
            onSessionChange({target: {name: 'session_uid', value: session.uid}})
        }
    }

    const session = sessions.find( x => x.uid === session_uid ) || {}
    const government = governments.find( x => x.uid === government_uid ) || {}
    const my_documents = documents.filter(x => document_uids[x.uid] )

    return (
        <form>
            <div className="space-y-12">
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
                    <div>
                        <h2 className="text-base/7 font-semibold text-gray-900">
                            Personal Information
                        </h2>
                        <p className="mt-1 text-sm/6 text-gray-600">
                            This information is visible within your organization.
                        </p>
                    </div>

                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                        <div className="px-4 py-6 sm:p-8">
                            <div
                                className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                <div className="col-span-4">
                                    <label htmlFor="name"
                                           className="block text-sm/6 font-medium text-gray-900">
                                        Name
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={name}
                                            onChange={handleChange}
                                            onKeyDown={handleEnter}
                                            autoComplete="given-name"
                                            placeholder="John Doe"
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-3">
                                    <label htmlFor="email"
                                           className="block text-sm/6 font-medium text-gray-900">
                                        Email address
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={handleChange}
                                            onKeyDown={handleEnter}
                                            placeholder="xxx@gmail.com"
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-3">
                                    <label htmlFor="phone"
                                           className="block text-sm/6 font-medium text-gray-900">
                                        Phone
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="phone"
                                            id="phone"
                                            autoComplete="phone"
                                            value={phone}
                                            onChange={handleChange}
                                            onKeyDown={handleEnter}
                                            placeholder="208.xxx.xxxx"
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-4">
                                    <label htmlFor="profile"
                                           className="block text-sm/6 font-medium text-gray-900">
                                        Profile Image
                                    </label>
                                    <div
                                        className="mt-2 bg-gray-50 p-3 ring-1 rounded-lg ring-gray-300">
                                        <div className="flex items-center gap-x-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={fileRef}
                                                onChange={handleFileChange}
                                            />
                                            {profile_url && <img src={profile_url}
                                                                 className="h-14 w-14 text-gray-300 rounded-full shadow-md"
                                                                 aria-hidden="true"
                                                                 alt="User profile image"
                                            />}
                                            {profile_url === null && <UserCircleIcon
                                                className="h-12 w-12 text-gray-300 rounded-full"
                                                aria-hidden="true"/>}
                                            {auth.toLowerCase() !== 'google' && <button
                                                type="button"
                                                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                                onClick={handleFileClick}>
                                                Change
                                            </button>}
                                            {auth.toLowerCase() === 'google' &&
                                                <ButtonOptions
                                                    className="ml-6"
                                                    align="right"
                                                    theme="white"
                                                    options={ResyncOptions}
                                                    onClick={handleResync}>
                                                    <ArrowPathIcon
                                                        className="mr-2 h-5 w-5 shrink-0"
                                                        aria-hidden="true"/>
                                                    Resync
                                                </ButtonOptions>}
                                        </div>
                                    </div>
                                </div>

                                {auth.toLowerCase() !== 'google' &&
                                    <div className="col-span-3">
                                        <label htmlFor="password"
                                               className="block text-sm/6 font-medium text-gray-900">
                                            Password
                                        </label>
                                        <div className="mt-2 sm:col-span-2 sm:mt-0">
                                            <input
                                                className={
                                                    Util.classNames(
                                                        "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 sm:max-w-xs sm:text-sm sm:leading-6",
                                                        (password.length > 0 && password !== password_repeat)? "ring-red-500": ""
                                                )}
                                                type="password"
                                                name="password"
                                                id="password"
                                                value={password}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                }
                                {password !== '' &&
                                    <div className="col-span-3">
                                        <label htmlFor="password_repeat"
                                               className="block text-sm/6 font-medium text-gray-900">
                                            (Repeat)
                                        </label>
                                        <input
                                            className={
                                                Util.classNames(
                                                    "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 sm:max-w-xs sm:text-sm sm:leading-6",
                                                    (password_repeat.length > 0 && password !== password_repeat)? "ring-red-500": ""
                                            )}
                                            type="password"
                                            name="password_repeat"
                                            id="password_repeat"
                                            value={password_repeat}
                                            onChange={handleChange}
                                            onKeyDown={handleEnter}
                                        />
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
                    <div>
                        <h2 className="text-base/7 font-semibold text-gray-900">Notifications</h2>
                        <p className="mt-1 text-sm/6 text-gray-600">
                            We'll always let you know about important changes,
                            but you pick what else you want to hear about.
                        </p>
                    </div>

                    <div
                        className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl sm:col-span-2">
                        <div className="px-4 py-6 sm:p-8">
                            <div className="max-w-2xl space-y-10 sm:col-span-2 grid grid-cols-2">
                                {committees.length <= 0 &&
                                    <fieldset className='col-span-full col-span-2'>
                                        <div className="mb-10 space-y-2">
                                            <StateTitle
                                                session_header="Session"
                                                session_text={session.name}
                                                session_list={sessions.map(x => x.name)}
                                                state_header="Government"
                                                state_uid={government.uid}
                                                state_list={governments}
                                                onStateClick={handleGovernmentChange}
                                                onSessionClick={name => handleSessionChange(name)}>
                                            </StateTitle>
                                        </div>
                                    </fieldset>
                                }
                                {committees.length > 0 &&
                                    <fieldset
                                        className='col-span-full md:col-span-1'>
                                        <legend
                                            className="text-sm/6 font-semibold text-gray-900">
                                            By Committee
                                        </legend>

                                        <div className="mt-6 space-y-2">
                                            <StateTitle
                                                className="mt-4 ml-4"
                                                session_header="Session"
                                                session_text={session.name}
                                                session_list={sessions.map(x => x.name)}
                                                state_header="Government"
                                                state_uid={government.uid}
                                                state_list={governments}
                                                onStateClick={handleGovernmentChange}
                                                onSessionClick={name => handleSessionChange(name)}>
                                            </StateTitle>

                                            {committees.map((comm, idx) => (
                                                <div key={`committee_${idx}`}
                                                     className="relative flex gap-x-3">
                                                    <div
                                                        className="flex h-6 items-center">
                                                        <input
                                                            id={`committee_${idx}`}
                                                            name={`committee_${idx}`}
                                                            type="checkbox"
                                                            className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                            checked={committee_uids[comm.uid]}
                                                            onChange={e => handleChecked('committee_uids', comm.uid, e.target.checked)}
                                                        />
                                                    </div>
                                                    <div className="text-sm/6">
                                                        <label
                                                            htmlFor={`committee_${idx}`}
                                                            className="font-medium text-gray-900 cursor-pointer">
                                                            {(comm.chamber !== '') ? `${comm.name} (${comm.chamber})` : comm.name}
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </fieldset>
                                }

                                {tags.length > 0 &&
                                    <fieldset
                                        className='col-span-full md:col-span-1 !mt-0  md:ml-10'>
                                        <legend
                                            className="text-sm/6 font-semibold text-gray-900">
                                            By Tags
                                        </legend>
                                        <div className="mt-6 space-y-2">
                                            {tags.map((tag, idx) => (
                                                <div key={`tag_${idx}`}
                                                     className="relative flex gap-x-3">
                                                    <div
                                                        className="flex h-6 items-center">
                                                        <input
                                                            id={`tag_${idx}`}
                                                            name={`tag_${idx}`}
                                                            type="checkbox"
                                                            className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                            checked={tag_uids[tag.uid]}
                                                            onChange={e => handleChecked('tag_uids', tag.uid, e.target.checked)}
                                                        />
                                                    </div>
                                                    <div className="text-sm/6">
                                                        <label
                                                            htmlFor={`tag_${idx}`}
                                                            className="font-medium text-gray-900 cursor-pointer">
                                                            <TagComp
                                                                color={tag.color}
                                                                value={tag.name}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </fieldset>
                                }

                                <fieldset className="col-span-full">
                                    <legend
                                        className="text-sm/6 font-semibold text-gray-900 col-span-full">
                                        By Bills
                                    </legend>
                                    <div className="mt-6 space-y-6">
                                        <div className="w-72">
                                            <ComboboxMenu
                                                desc="H0xxx"
                                                items={documents.map(doc => ({
                                                    name: doc.code,
                                                    desc: doc.title.substring(0, 32)
                                                }))}
                                                onChange={idx => handleAddDocument(documents[idx].uid)}
                                            />
                                        </div>
                                        {my_documents.length > 0 &&
                                        <div className="px-4 sm:px-6 lg:px-8 w-full">
                                            <div className="mt-4 flow-root">
                                                <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
                                                    <div className="inline-block min-w-full py-2 align-middle">
                                                        <table className="min-w-full border-separate border-spacing-0">
                                                            <thead>
                                                            <tr>
                                                                <th scope="col"
                                                                    className="sticky top-0 border-b border-gray-300 bg-white bg-opacity-75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8">
                                                                    Name
                                                                </th>
                                                                <th scope="col"
                                                                    className="sticky top-0 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                                                                </th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {my_documents.map((doc, idx) => (
                                                                <tr key={`doc_tr_${idx}`}>
                                                                    <td className={Util.classNames(
                                                                        'whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8',
                                                                    )}>
                                                                        {doc.code} {doc.name}
                                                                    </td>
                                                                    <td className={Util.classNames('whitespace-nowrap px-3 py-4 text-sm text-gray-500')}>
                                                                        <TrashIcon
                                                                            className="h-5 w-5 text-gray-400 hover:text-red-500 cursor-pointer"
                                                                            aria-hidden="true"
                                                                            onClick={() => handleRemoveDocument(doc.uid)}
                                                                        />
                                                                    </td>
                                                                </tr>))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        }
                                    </div>
                                </fieldset>

                                <fieldset
                                    className="col-span-full md:col-span-1">
                                    <legend
                                        className="text-sm/6 font-semibold text-gray-900 col-span-1">
                                        By Colors
                                    </legend>
                                    <div className="mt-6 space-y-2">
                                        {COLORS.filter(x => x !== 'none').map((color, idx) => (
                                            <div key={`colors_${idx}`}
                                                 className="flex items-center gap-x-3">
                                                <input
                                                    id={`color_${idx}`}
                                                    name={`color_${idx}`}
                                                    type="checkbox"
                                                    className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                    checked={colors[color.toLowerCase()]}
                                                    onChange={e => handleChecked('colors', color.toLowerCase(), e.target.checked)}
                                                />
                                                <label htmlFor={`color_${idx}`}
                                                       className="block text-sm/6 font-medium text-gray-900">
                                                    <TagComp
                                                        className="cursor-pointer"
                                                        color={color}
                                                        value={Util.capitalize(color)}
                                                    />
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>
                                <fieldset
                                    className="col-span-full md:col-span-1 md:ml-10">
                                    <legend
                                        className="text-sm/6 font-semibold text-gray-900 col-span-1">
                                        By Priority
                                    </legend>
                                    <div className="mt-6 space-y-2">
                                        {PRIORITIES.filter(x => x !== 'none').map((priority, idx) => (
                                            <div key={`priorities_${idx}`}
                                                 className="flex items-center gap-x-3">
                                                <input
                                                    id={`priority_${idx}`}
                                                    name={`priority_${idx}`}
                                                    type="checkbox"
                                                    className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                    checked={priorities[priority.toLowerCase()]}
                                                    onChange={e => handleChecked('priorities', priority.toLowerCase(), e.target.checked)}
                                                />
                                                <label
                                                    htmlFor={`priority_${idx}`}
                                                    className="block text-sm/6 font-medium text-gray-900">
                                                    <PriorityComp
                                                        className="cursor-pointer"
                                                        priority={priority}
                                                    />
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-x-6">
                {(human_uid !== null && human_uid !== undefined && human_uid !== "create" && human_uid !== usr_info.uid) ?
                    <button
                        type="button"
                        onClick={() => handleChange({
                            target: {
                                name: 'confirm_remove',
                                value: true
                            }
                        })}
                        className="text-sm font-semibold leading-6 text-red-600">
                        Delete
                    </button> : <div></div>
                }
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/team')}
                        className="text-sm font-semibold leading-6 text-gray-900">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex justify-center ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        Save
                    </button>
                </div>
            </div>

            <ConfirmModal
                open={confirm_remove}
                danger={true}
                title='Delete User'
                message={`Are you sure you want to delete ${name}?`}
                confirmBtn="Delete"
                onClose={handleDelete}
            />
        </form>
    )
}
