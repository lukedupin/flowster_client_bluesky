import React, { useState, useRef, useEffect } from "react"
import * as Util from "../helpers/util.js"
import { Link, useNavigate, useParams } from "react-router-dom";

import ProfileImg from "../assets/images/1650435393275.jpeg";
import {PageTitle} from "../components/page_title";
import { PlusIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import {EmptyList} from "../components/empty_list";
import {UsersIcon} from "@heroicons/react/24/outline";
import { ImportFileModal } from "../modals/import_file_modal";


const CreateActions = {
    CREATE_HUMAN: 0,
    IMPORT_XLSX: 1,
    EXPORT_XLSX: 2,
}

const CreateOptions = [
    'Create Human',
    'Import Xlsx',
    'Export Xlsx',
]

export const Team = props => {
    const { loaded, showToast } = props

    const [state, setState] = useState({
        humans: [],
        show_upload: false,
    })
    const {humans, show_upload} = state

    const navigate = useNavigate()

    const spreadsheetRef = useRef(null)

    useEffect(() => {
        reloadHumans()
    }, [])

    const reloadHumans = () => {
        Util.fetch_js('/api/human/list/', {},
            js => {
                setState(prev => ({...prev,
                    humans: js.humans,
                }))
            }, showToast)
    }

    const handleCreate = (action) => {
        switch (action) {
            case CreateActions.CREATE_HUMAN:
                navigate('/profile/create')
                break
            case CreateActions.EXPORT_XLSX:
                Util.post_new_tab( '/api/tenant/export/', {} )
                break
            case CreateActions.IMPORT_XLSX:
                setState(prev => ({...prev, show_upload: true}))
                break
        }
    }

    const handleSelectHuman = (uid) => {
        navigate(`/profile/${uid}`)
    }

    const handleImportFile = (file) => {
        Util.fetch_js( '/api/tenant/import/', { file },
            js => {
                showToast('People imported', "success")
                reloadHumans()
                setState(prev => ({ ...prev,
                    show_upload: false,
                }))
            },
            err => {
                spreadsheetRef.current.cancelUpload()
                showToast(err, "error")
            } )
    }

    const handleImportClose = () => {
        setState(prev => ({ ...prev,
            show_upload: false
        }))
    }

    return (
        <div>
            <PageTitle
                title="Team"
                subtitle="Manage your team members."
                button_text={CreateOptions[CreateActions.CREATE_HUMAN]}
                button_icon={<PlusIcon className="h-5 w-5 mr-2" aria-hidden="true"/>}
                button_options={CreateOptions}
                onClick={handleCreate}
            />

            <div className="border-b border-gray-200 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:border-t sm:pb-0">
                <ul role="list" className="divide-y divide-gray-100">
                    {humans.map((human) => (
                        <li key={human.email}
                            onClick={() => handleSelectHuman( human.uid )}
                            className="flex items-center justify-between gap-x-6 py-5">
                            <div className="flex min-w-0 gap-x-4">
                                {human.profile_url &&
                                <img className="h-12 w-12 flex-none rounded-full bg-gray-50" src={human.profile_url} alt="" />
                                }
                                {human.profile_url === null &&
                                <UserCircleIcon className="h-12 w-12 rounded-full text-gray-300" aria-hidden="true"/>
                                }
                                <div className="min-w-0 flex-auto">
                                    <p className="text-sm font-semibold leading-6 text-gray-900">{human.name}</p>
                                    <p className="mt-1 truncate text-xs leading-5 text-gray-500">{human.email}</p>
                                </div>
                            </div>
                            <Link to={`/profile/${human.uid}`}
                                className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                View
                            </Link>
                        </li>
                    ))}
                </ul>

                {loaded && humans.length === 0 &&
                    <EmptyList
                        icon={UsersIcon}
                        name="humans"
                        onCreate={() => handleCreate(CreateActions.CREATE_HUMAN)}
                    />
                }
            </div>

            <ImportFileModal
                ref={spreadsheetRef}
                open={show_upload}
                load_on_start={true}
                onUpload={handleImportFile}
                onClose={handleImportClose}
                showToast={showToast}
            />
        </div>
    )
}
