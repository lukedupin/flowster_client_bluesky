import * as Util from '../helpers/util';

import React, { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    ChartPieIcon,
    QuestionMarkCircleIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
    HomeIcon,
    UsersIcon,
    XMarkIcon,
    TagIcon,
    BoltIcon,
    CpuChipIcon,
    ServerIcon, TrophyIcon,
} from '@heroicons/react/24/outline'
import { Dropdown, DropdownItem } from "./dropdown";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.png";
import { useStore } from "../store";
import { BeakerIcon, LockClosedIcon, CheckCircleIcon } from "@heroicons/react/24/outline/index";
import { WEB_URL } from '../settings'
import {ChatItem} from "./chat_item.jsx";


const navigation_base = [
    { name: 'Vibe', href: '/', icon: BeakerIcon, newTab: false },
    //{ name: 'Sheets', href: '/sheets', icon: DocumentTextIcon, newTab: false },
    //{ name: 'Agents', href: '/activity', icon: BoltIcon, newTab: false },
    //{ name: 'Credentials', href: '/credentials', icon: LockClosedIcon, newTab: false },
    //{ name: 'Team', href: '/team', icon: UsersIcon },
    //{ name: 'Health', href: '/health', icon: CpuChipIcon, newTab: false },
    //{ name: 'Reports', href: '/reports', icon: ChartPieIcon, newTab: false },
]

export const Sidebar = (props) => {
    const { hidden, sidebarOpen, showContext, chats, agents, onSidebarOpen, onTutorial, showToast } = props
    const onClick = props.onClick || (() => { })

    const { usr_info, setUsrInfo } = useStore(x => x)
    const navigate = useNavigate()

    const safe_agents = agents.map(a => ({
        name: a.name,
        agent_uid: a.agent_uid,
        href: `/agent/${a.agent_uid}`,
        icon: ServerIcon,
        newTab: false
    }))
    const navigation = [...navigation_base, ...safe_agents]

    const calculateContext = () => {
        const path = `${window.location.pathname}`.replace(/^\//, '').replace(/\/.*$/, '').toLowerCase()
        const idx = navigation.findIndex(x => x.href === `/${path}`)
        return Math.max(0, idx)
    }

    const [state, setState] = useState({
        current_idx: calculateContext(),
    })
    const { current_idx } = state

    const linkContext = (href) => {
        return href.replace("tenant_uid", usr_info?.tenant?.uid)
    }

    const handleClick = (idx) => {
        if (navigation[idx].newTab) {
            window.open(linkContext(navigation[idx].href), '_blank')
        }
        else {
            onClick( navigation[idx] )
            setState(prev => ({ ...prev, current_idx: idx }))
        }
    }

    const handleTutorial = () => {
        Util.fetch_js('/api/human/client_settings/', { tutorial: true },
            js => {
                setUsrInfo(js.human)
            }, showToast)

        onTutorial()
    }

    return (
        <div className={Util.classNames((hidden) ? "hidden" : "")}>
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog as="div" className="relative z-30 lg:hidden" onClose={onSidebarOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/80" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-in-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in-out duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                        <button type="button" className="-m-2.5 p-2.5" onClick={() => onSidebarOpen(false)}>
                                            <span className="sr-only">Close sidebar</span>
                                            <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </button>
                                    </div>
                                </Transition.Child>
                                {/* Sidebar component, swap this element with another sidebar if you like */}
                                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                                    <div className="flex h-16 shrink-0 items-center">
                                        <img
                                            className="h-8 w-auto"
                                            src={Logo}
                                            alt="Your Company"
                                        />
                                        Flowster
                                    </div>
                                    <nav className="flex flex-1 flex-col">
                                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                            <li>
                                                <ul role="list" className="-mx-2 space-y-1">
                                                    {navigation.map((item, idx) => (
                                                        <li key={`${item.name}_${idx}`}>
                                                            <Link to={linkContext(item.href)}
                                                                onClick={() => handleClick(idx)}
                                                                className={Util.classNames(
                                                                    (current_idx === idx)
                                                                        ? 'bg-gray-50 text-indigo-600'
                                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                                )}>
                                                                <item.icon
                                                                    className={Util.classNames(
                                                                        (current_idx === idx) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                                                                        'h-6 w-6 shrink-0'
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    ))}

                                                    {chats.map((chat, idx) => (
                                                        <li key={`chat_${idx}`}>
                                                            <ChatItem
                                                                title={chat.name}
                                                                lastMessage={chat.lastMessage}
                                                                timestamp={chat.timestamp}
                                                                isUnread={chat.isUnread}
                                                                isSelected={current_idx === (idx + navigation.length)}
                                                                onClick={() => handleClick(idx + navigation.length)}
                                                            />
                                                        </li>
                                                    ))}
                                                </ul>
                                            </li>
                                            <li className="mt-auto">
                                                <div className={Util.classNames("cursor-pointer group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600")}
                                                    onClick={handleTutorial}>
                                                    <QuestionMarkCircleIcon
                                                        className="h-6 w-6 shrink-0 text-indigo-600 group-hover:text-indigo-500"
                                                        aria-hidden="true"
                                                    />
                                                    Tutorial
                                                </div>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-52 lg:flex-col">
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                        <img
                            className="h-8 w-auto"
                            src={Logo}
                            alt="Your Company"
                        />
                        <div className="ml-4 text-lg font-semibold text-gray-600">
                            Flowster
                        </div>
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item, idx) => (
                                        <li key={`${item.name}_${idx}`}>
                                            <Link to={linkContext(item.href)}
                                                onClick={() => handleClick(idx)}
                                                className={Util.classNames(
                                                    (current_idx === idx)
                                                        ? 'bg-gray-50 text-indigo-600'
                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                )}>
                                                <item.icon
                                                    className={Util.classNames(
                                                        (current_idx === idx) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                                                        'h-6 w-6 shrink-0'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                    {chats.map((chat, idx) => (
                                        <li key={`chat_${idx}`}>
                                            <ChatItem
                                                title={chat.name}
                                                lastMessage={chat.lastMessage}
                                                timestamp={chat.timestamp}
                                                isUnread={chat.isUnread}
                                                isSelected={current_idx === (idx + navigation.length)}
                                                onClick={() => handleClick(idx + navigation.length)}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            {/*}
                            <li className="mt-auto">
                                <div className={Util.classNames("cursor-pointer group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600")}
                                    onClick={handleTutorial}>
                                    <TrophyIcon
                                        className="h-6 w-6 shrink-0 text-indigo-600 group-hover:text-indigo-500"
                                        aria-hidden="true"
                                    />
                                    Play
                                </div>
                            </li>
                            {*/}
                            <li>
                                {/*<GoogleAuthButton showToast={showToast} />*/}
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
}
