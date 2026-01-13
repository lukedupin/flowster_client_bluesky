import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Modal, Button, FormText, FormGroup, FormLabel, FormControl } from 'react-bootstrap';
import { Link, useNavigate } from "react-router-dom";

import * as Util from "../helpers/util";
import { useStore } from "../store";
import {ModalBase} from "../modals/modal_base";
import {Login} from "../modals/login";
import {SignupModal} from "../modals/signup_modal";

export const Signup = (props) => {
    const { showToast } = props;

    const [state, setState] = useState({
        name: "",
        email: "",
        phone: "",
        access_code: "",
        invalid_phone: false,
        show_login: false,
        show_access_code: false,
    })
    const { name, email, phone, access_code, invalid_phone, show_login, show_access_code } = state

    const { setUsrInfo } = useStore( x => x )
    const navigate = useNavigate()

    const handleSendAccess = () => {
        Util.fetch_js('/api/human/request_reset_code/', { phone },
            js => {
                showToast('Sent', 'success')
            },
            showToast )

        setState(prev => ({...prev,
            show_access_code: true,
        }))
    }

    const handleCreate = () => {
        Util.fetch_js('/api/human/create/', { name, email, phone, access_code },
            js => {
                setUsrInfo( js )
                navigate('/dashboard')
                showToast('Success', 'success')
            },
            showToast )
    }

    const handleLogin = (succ) => {
        if ( succ ) {
            navigate('/dashboard')
            showToast('Success', 'success')
        }

        setState(prev => ({...prev,
            show_login: false
        }))
    }

    const handleChange = (e) => {
        setState(prev => ({...prev,
            [e.target.name]: e.target.value
        }))
    }

    return (
        <>
            <section className="h-100 gradient-form pt-100">
                <div className="container py-5 h-100">
                    <SignupModal showToast={showToast}
                                 show_close={false}
                                 onAlreadyMember={() => setState(prev => ({...prev, show_login: true}))}
                                 onClose={handleLogin}
                                 />
                </div>
            </section>

            <ModalBase blackout={true} centered={true}>
                {show_login &&
                    <Login showToast={showToast}
                           onClose={handleLogin}
                    />
                }
            </ModalBase>
        </>
    );
};
