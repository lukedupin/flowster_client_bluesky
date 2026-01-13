import * as Util from '../helpers/util';

import React, {Fragment, useState} from 'react'
import {Dialog, Menu, Transition} from '@headlessui/react'
import {
    ArrowLeftOnRectangleIcon,
    Bars3Icon,
    BellIcon,
    BuildingOfficeIcon,
    UserCircleIcon, UsersIcon
} from '@heroicons/react/24/outline'
import {ChevronDownIcon, MagnifyingGlassIcon} from "@heroicons/react/20/solid";
import { useStore } from "../store";
import {useNavigate} from "react-router-dom";


export const HeaderSearch = (props) => {
    const { search, onSidebarOpen, onSearch, showToast } = props

    const usr_info = {
        uid: '',
        name: 'Luke Dupin',
        profile_url: '/static/profile.jpg',
    }

    const navigate = useNavigate()

    const handleSearch = e => {
        onSearch(e.target.value)
    }

    const handleSignout = () => {
        Util.fetch_js('/api/human/logout/', {},
            js => {
                navigate('/login')
            }, showToast)
    }

    const userNavigation = [
        { name: 'Your profile', icon: UserCircleIcon, onClick: () => navigate(`/profile/${usr_info.uid}`) },
        { name: 'Tenant', icon: BuildingOfficeIcon, onClick: () => navigate('/tenant') },
        { name: 'Team', icon: UsersIcon, onClick: () => navigate('/team') },
        { name: 'Sign out', icon: ArrowLeftOnRectangleIcon, onClick: handleSignout },
    ]

    return (
        <div className="sticky top-0 z-40 lg:mx-auto max-w-full bg-white">
            <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
                <button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                    onClick={() => onSidebarOpen(true)}>
                    <span className="sr-only">Open sidebar</span>
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </button>

                {/* Separator */}
                <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

                <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 lg:px-8">
                    <div className="relative flex flex-1">
                        <label htmlFor="search-field" className="sr-only">
                            Search
                        </label>
                        <MagnifyingGlassIcon
                            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                            aria-hidden="true"
                        />
                        <input
                            id="search-field"
                            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                            placeholder="Search..."
                            type="search"
                            name="search"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="flex items-center gap-x-4 lg:gap-x-6">
                        <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                            <span className="sr-only">View notifications</span>
                            <BellIcon className="h-6 w-6" aria-hidden="true" />
                        </button>

                        {/* Separator */}
                        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                        {/* Profile dropdown */}
                        <Menu as="div" className="relative">
                            <Menu.Button className="-m-1.5 flex items-center p-1.5">
                                <span className="sr-only">Open user menu</span>
                                {usr_info.profile_url &&
                                <img
                                    className="h-8 w-8 rounded-full bg-gray-50"
                                    src={usr_info.profile_url}
                                    alt="" />
                                }
                                {usr_info.profile_url === null &&
                                <UserCircleIcon className="h-8 w-8 rounded-full text-gray-300" aria-hidden="true"/>
                                }
                                <span className="hidden lg:flex lg:items-center">
                                        <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                            {usr_info.name}
                                        </span>
                                        <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" /></span>
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                    {userNavigation.map((item) => (
                                        <Menu.Item key={item.name}>
                                            {({ active }) => (
                                                <div className={Util.classNames(
                                                        active ? 'bg-gray-50' : '',
                                                        'w-full inline-flex items-center px-3 py-1 text-sm leading-6 text-gray-900 cursor-pointer',
                                                     )}
                                                     onClick={item.onClick}>
                                                    <item.icon className="h-5 w-5 pr-2 flex-shrink-0" aria-hidden="true" />
                                                    {item.name}
                                                </div>
                                            )}
                                        </Menu.Item>
                                    ))}
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                </div>
            </div>
        </div>
    );
}
