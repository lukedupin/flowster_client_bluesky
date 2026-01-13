import React, { useState, useEffect } from 'react';
import {
    Route, Routes, BrowserRouter, useLocation, useNavigate
} from "react-router-dom";

import ReactDOM from 'react-dom/client'

import { Toast } from "./components/toast";

import Logo from './assets/images/logo.png'

import * as Util from './helpers/util';
import {Landing} from "./pages/landing";
import { Sidebar } from "./components/sidebar";
import { HeaderSearch } from "./components/header_search";

import './index.css'
import {ChatInterface} from "./pages/chat_interface.jsx";
import {AgentInterface} from "./pages/agent_interface.jsx";
import {ProfileInterface} from "./pages/profile_interface.jsx";

export const App = (props) => {
    const [state, setState] = useState({
        preloaded: true,
        delay_loading: false,
        slow: false,
        err: false,
        toast: { msg: "", status: "" },
    })
    const { preloaded, delay_loading, err, slow, toast } = state

    const handleLoaded = () => {
        setState(prev => ({...prev,
            preloaded: true,
        }))
    }

    const handleToast = ( msg, status ) => {
        if ( status === undefined || status === null ) {
            status = "failure"
        }

        const toast = { msg, status };
        setState(prev => ({ ...prev, toast }))
    }

    const handleToastComplete = () => {
        const toast = { msg: "", status: "" };
        setState(prev => ({ ...prev, toast }))
    }

    //Main entry into program
    return (
        <BrowserRouter>
            <Core
                showToast={handleToast}
            />

            <Toast
                msg={toast.msg}
                status={toast.status}
                timeout={5000}
                onComplete={handleToastComplete}
            />
        </BrowserRouter>
    );
}

export const Preload = (props) => {
    const { msg, showToast, onLoaded } = props

    const path = `${window.location.pathname}`.replace(/^\//, '').replace(/\/.*$/, '').toLowerCase()
    const navigate = useNavigate()

    useEffect(() => {
        onLoaded()
    }, [])

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-white max-w-full max-h-full z-50">
            <img src={Logo} alt="Logo" className="w-1/4"/>
            <p className="text-xl text-red-600">{msg}</p>
        </div>
    )
}

//This odd nesting is required because I need to load the path and that can only happen inside the router
export const Core = (props) => {
    const { showToast } = props

    const location = useLocation()
    const path = `${window.location.pathname}`.replace(/^\//, '').replace(/\/.*$/, '').toLowerCase()

    const [sheet, setSheet] = useState(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [agents, setAgents] = useState([])

    useEffect(() => {
        //Title controls
        if ( path === 'landing' || path === '' ) {
            document.title = `Flowster.ai`
        }
        else {
            document.title = `Flowster.ai | ${Util.namify( path )}`
        }
    }, [location])

    useEffect(() => {
        handleUpdateAgents()
    }, [])

    const handleUpdateAgents = () => {
        //Fetch agents
        Util.post_js('/api/agent_list', {},
            (js) => {
                setAgents(js.agents || [])
            },
            err => {
                showToast("Failed to fetch agents: " + err, "failure")
            })
    }

    const search = ""
    const handleSearch = (search) => {
        console.log("Search: ", search)
    }

    const handleSheet = (sheet) => {
        setSheet(sheet)
        if ( path !== 'landing' && path !== '' ) {
            location.pathname = '/'
        }
    }

    const handleCreateAgent = info => {
        showToast("Create Agent clicked", "success")
    }


    const chats = [
        //{ id: 1, title: 'Chat about React', isUnread: true, isSelected: false, lastMessage: 'How do I use hooks?', timestamp: '2h ago' },
    ]

    return (
        <div>
            <Sidebar
                hidden={false}
                sidebarOpen={sidebarOpen}
                onSidebarOpen={setSidebarOpen}
                agents={agents}
                chats={chats}
                onClick={handleCreateAgent}
                onTutorial={() => ({})}
                showToast={showToast}
            />

            <div className="lg:pl-52">
                <HeaderSearch
                    search={search}
                    showToast={showToast}
                    onSidebarOpen={setSidebarOpen}
                    onSearch={handleSearch}
                />

                <main className="">
                    {/* <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">*/}
                    <div className="w-full">
                        <Routes>
                            <Route path='/agent/:agentUid' element={
                                <AgentInterface
                                    showToast={showToast} />
                            }/>
                            <Route path='/profile_builder' element={
                                <ProfileInterface
                                    showToast={showToast} />
                            }/>
                            <Route path='*' element={
                                <ChatInterface
                                    showToast={showToast} />
                            }/>
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('app')).render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>,
)
