import { PhotoIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import * as Util from "../helpers/util.js";
import {useStore} from "../store";
import { ConfirmModal } from "../modals/confirm_modal";
import { Combobox } from "@headlessui/react";
import { Dropdown, DropdownItem } from "../components/dropdown";
import { TrashIcon } from "@heroicons/react/20/solid";

export const Tenant = props => {
    const { governments, showToast } = props

    const {usr_info, setUsrInfo} = useStore()

    const [state, setState] = useState({
        name: Util.safeGet( usr_info.tenant, 'name', '' ),
        is_public: Util.safeGet( usr_info.tenant, 'is_public', false ),
        government_uid: Util.safeGet( usr_info.tenant, 'government_uid', '' ),
        whitelist_domains: Util.safeGet( usr_info.tenant, 'whitelist_domains', [] ),
        show_delete: null,
    })
    const {name, is_public, government_uid, whitelist_domains, show_delete} = state

    useEffect(() => {
        tenantDetails()
    }, [])

    const tenantDetails = () => {
        //Load up the humans
        Util.fetch_js('/api/tenant/detail/', {},
            js => {
                const { name, is_public, government_uid, whitelist_domains } = js.tenant
                setState(prev => ({...prev,
                    name,
                    is_public,
                    government_uid,
                    whitelist_domains,
                }))
            }, showToast)
    }

    const handleSave = () => {
        Util.fetch_js( '/api/tenant/modify/', { name, is_public, government_uid, whitelist_domains },
            js => {
                usr_info.tenant = js.tenant
                setUsrInfo( usr_info )
                setState(prev => ({...prev,
                    name: js.tenant.name,
                    is_public: js.tenant.is_public,
                    government_uid: js.tenant.government_uid,
                    whitelist_domains: js.tenant.whitelist_domains,
                }))
                showToast( 'Updated', 'Successful' )
            }, showToast)
    }

    const handleChange = e => {
        const { name, value } = e.target;
        if ( name === 'whitelist_domains' ) {
            const whitelist_domains = [...state.whitelist_domains]
            whitelist_domains[e.target.idx] = value
            setState(prev => ({ ...prev,
                whitelist_domains
            }))
        }
        else {
            setState(prev => ({ ...prev,
                [name]: value
            }))
        }
    }

    const handleAddDomain = () => {
        const domain = usr_info.email.replace(/^.*@/, '')
        setState(prev => ({...prev,
            whitelist_domains: [...whitelist_domains, domain]
        }))
    }

    const handleDelete = (domain) => {
        if (domain === null) {
            setState(prev => ({ ...prev, show_delete: null }))
            return
        }

        const whitelist_domains = state.whitelist_domains.filter( d => d !== domain )

        //Delete the pillar and then update the list
        Util.fetch_js('/api/tenant/modify/', { tenant_uid: usr_info.tenant_uid, whitelist_domains },
            js => {
                usr_info.tenant = js.tenant
                setUsrInfo( usr_info )
                showToast("Removed", "success")
            },
            showToast)

        setState(prev => ({ ...prev,
            whitelist_domains,
            show_delete: null,
        }))
    }


    const government_name = governments.find( gov => gov.uid === government_uid )?.name || 'None'

    return (
        <div>
            <div className="space-y-12 sm:space-y-16">
                <div>
                    <h2 className="text-base font-semibold leading-7 text-gray-900">Tenant</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                        View/Edit tenant information.
                    </p>

                    <div
                        className="mt-10 space-y-8 border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t sm:pb-0">
                        <div
                            className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                            <label htmlFor="first-name"
                                   className="block text-sm font-semibold leading-6 text-gray-900 sm:pt-1.5">
                                Name
                            </label>
                            <div className="mt-2 sm:col-span-2 sm:mt-0">
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={name}
                                    onChange={handleChange}
                                    autoComplete="given-name"
                                    placeholder="Tenant"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div
                            className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                            <label htmlFor="first-name"
                                   className="block text-sm font-semibold leading-6 text-gray-900 sm:pt-1.5">
                                Is Public
                            </label>
                            <div className="mt-2 sm:col-span-2 sm:mt-0">
                                <input
                                    id="is_public"
                                    aria-describedby="is_public-description"
                                    name="is_public"
                                    type="checkbox"
                                    className="cursor-pointer h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    onChange={() => handleChange( {
                                        target: {
                                            name: 'is_public',
                                            value: !is_public
                                        }
                                    } )}
                                    checked={is_public}
                                />
                            </div>
                        </div>

                        <div
                            className="sm:grid sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-6">
                            <label htmlFor="government"
                                   className="block text-sm font-semibold leading-6 text-gray-900">
                                Default Government
                            </label>
                            <div className="mt-2 sm:col-span-2 sm:mt-0">
                                <Dropdown
                                    header={"Governments"}
                                    value={government_name}
                                    align="left">
                                    {governments.map( ( item, idx ) => (
                                        <DropdownItem
                                            id={item.uid}
                                            key={`m${item.id}_${idx}`}
                                            value={item.uid}
                                            onClick={() => handleChange( {
                                                target: {
                                                    name: 'government_uid',
                                                    value: item.uid
                                                }
                                            } )}>
                                            {item.name}
                                        </DropdownItem>) )}
                                </Dropdown>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3 sm:py-6">
                            <div>
                                <label htmlFor="government"
                                       className="block text-sm font-semibold leading-6 text-gray-900">
                                    Whitelist Email Access
                                </label>
                            </div>

                            <div className="max-w-2xl space-y-10 md:col-span-2">
                                <fieldset>
                                    <legend
                                        className="text-sm leading-6 text-gray-900">
                                        Email Domains
                                    </legend>
                                    <div className="mt-6 space-y-6">
                                        {whitelist_domains.map( ( domain, idx ) => (
                                        <div className="relative ml-6"
                                             key={`domain_${idx}`}>
                                            <div className="text-sm leading-6 inline-flex items-center">
                                                <input
                                                    type="text"
                                                    name="whitelist_domains"
                                                    id={`whitelist_domains_${idx}`}
                                                    value={domain}
                                                    onChange={e => handleChange({target: {name: 'whitelist_domains', idx, value: e.target.value}})}
                                                    placeholder="domain.com"
                                                    className="block w-80 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                                />
                                                <TrashIcon
                                                    className="cursor-pointer ml-6 h-5 w-5 flex-shrink-0 text-gray-500 hover:text-red-600"
                                                    onClick={() => handleChange( { target: { name: 'show_delete', value: domain } } )}
                                                />
                                            </div>
                                        </div>) )}
                                        <div className="relative flex gap-x-3">
                                            <div className="flex h-6 items-center my-2">
                                                <button
                                                    className="rounded-md inline-flex bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                    onClick={handleAddDomain}>
                                                <PlusIcon className="h-5 w-5 mr-2 flex-shrink-0 text-white" aria-hidden="true"/>
                                                    Add Domain
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </fieldset>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-x-6">
                <div></div>
                <div>
                    <button
                        type="button"
                        onClick={tenantDetails}
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
                open={show_delete !== null}
                uid={show_delete}
                danger={true}
                title="Delete?"
                message="Are you sure you want to delete this?"
                confirmBtn="Delete"
                onClose={handleDelete}
            />
        </div>
    )
}
