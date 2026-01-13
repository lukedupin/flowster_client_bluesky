import { useEffect, useRef, useState } from "react";
import * as Util from '../helpers/util';
import { useStore } from "../store";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from "../settings";
import Logo from "../assets/images/logo.png";

export const Login = props => {
    const { onReloadPolicy, showToast } = props

    const [state, setState] = useState({
        email: '',
        password: '',
        password_repeat: '',
        email_err: false,
        password_err: false,
        password_repeat_err: false,
    })
    const { email, password, password_repeat, email_err, password_err, password_repeat_err } = state

    const { setUsrInfo } = useStore( x => x )
    const emailRef = useRef(null)
    const passwordRef = useRef(null)
    const passwordRepeatRef = useRef(null)
    const navigate = useNavigate()

    const {reset_token} = useParams()

    const handleChange = e => {
        const update = {
            [e.target.name]: e.target.value,
        }

        if ( ['email', 'password', 'password_repeat'].indexOf(e.target.name) >= 0 ) {
            update[`${e.target.name}_err`] = false
        }

        setState(prev => ({ ...prev, ...update }))
    }

    const handleCheckPassword = () => {
        if ( password !== password_repeat ) {
            setState(prev => ({ ...prev, password_repeat_err: true }))
            showToast('Passwords do not match')
        }
    }

    const handleErr = msg => {
        const update = {
            email_err: false,
            password_err: false,
        }
        if ( msg.search(/email/i) >= 0 ) {
            update.email_err = true
        }
        if ( msg.search(/password/i) >= 0 ) {
            update.password_err = true
        }

        setState(prev => ({ ...prev, ...update }))
        showToast(msg)
    }

    const handleEnter = e => {
        if ( e.key === 'Enter' ) {
            handleSubmit(e)
        }
    }

    const handleSubmit = e => {
        e.preventDefault()
        emailRef.current.blur()
        passwordRef.current.blur()
        if ( passwordRepeatRef.current ) {
            passwordRepeatRef.current.blur()

            if ( password !== password_repeat ) {
                showToast('Passwords do not match')
                return
            }
        }

        const pwd_hash = Util.hashStr(password)
        if ( reset_token && reset_token.length > 0 ) {
            Util.fetch_js( '/api/human/login_with_reset/', { email, pwd_hash, reset_token },
                js => {
                    setUsrInfo( js.human )
                    navigate( '/' )
                    onReloadPolicy()
                    showToast( `Welcome back ${js.human.name}!`, "success" )
                }, handleErr )
        }
        else {
            Util.fetch_js( '/api/human/login/', { email, pwd_hash },
                js => {
                    setUsrInfo( js.human )
                    navigate( '/' )
                    onReloadPolicy()
                    showToast( `Welcome back ${js.human.name}!`, "success" )
                }, handleErr )
        }
    }

    const handleGoogle = useGoogleLogin({
        onSuccess: credentialResponse => {
            console.log(credentialResponse);
            const { access_token } = credentialResponse
            Util.fetch_js('/api/human/login_with_google/', { access_token },
                js => {
                    setUsrInfo( js.human )
                    navigate( '/' )
                    showToast( `Welcome back ${js.human.name}!`, "success" )
                }, showToast)
        },
        onError: () => {
            showToast('Login Failed');
        },
        redirect_uri: GOOGLE_REDIRECT_URI,
        ux_mode: 'redirect',
        flow: 'auth-code',
    });

    /*
    const handleGoogle = e => {
        e.preventDefault()

        const clientId = GOOGLE_CLIENT_ID
        const redirectUri = encodeURIComponent('http://localhost:3000'); // Replace with your redirect URI
        const scope = encodeURIComponent('profile email');

        const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;

        window.location.href = authUrl;
    }
    */

    const handleForgot = e => {
        e.preventDefault()
        emailRef.current.blur()
        passwordRef.current.blur()
        if ( passwordRepeatRef.current ) {
            passwordRepeatRef.current.blur()
        }

        Util.fetch_js('/api/human/forgot/', { email },
            js => {
                showToast('Check your email for a reset link', 'success')
            }, handleErr )
    }

    const is_reset = reset_token && reset_token.length > 0

    return (
        <>
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <img
                        className="mx-auto h-16 w-auto"
                        src={Logo}
                        alt="Anchor"
                    />
                    <h2 className="mt-2 text-center text-xl font-bold leading-9 tracking-tight text-gray-500">
                        {!is_reset? "Sign in to your account": "Reset your password"}
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                    <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
                        <form className="space-y-6">
                            <div>
                                <label htmlFor="email"
                                       className="block text-sm font-medium leading-6 text-gray-900">
                                    Email address
                                </label>
                                <div className="mt-2">
                                    <input
                                        ref={emailRef}
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className={Util.classNames( "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6", (email_err) ? 'ring-red-500' : '' )}
                                        value={email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password"
                                       className="block text-sm font-medium leading-6 text-gray-900">
                                    {!is_reset ? "Password" : "New Password"}
                                </label>
                                <div className="mt-2">
                                    <input
                                        ref={passwordRef}
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className={Util.classNames( "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6", (password_err) ? 'ring-red-500' : '' )}
                                        value={password}
                                        onChange={handleChange}
                                        onKeyDown={e => { if ( !is_reset ) { handleEnter(e) }}}
                                    />
                                </div>
                            </div>

                            {is_reset && (
                            <div>
                                <label htmlFor="password"
                                       className="block text-sm font-medium leading-6 text-gray-900">
                                    Repeat Password
                                </label>
                                <div className="mt-2">
                                    <input
                                        ref={passwordRepeatRef}
                                        id="password_repeat"
                                        name="password_repeat"
                                        type="password"
                                        required
                                        className={
                                            Util.classNames(
                                                "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6",
                                                (password_repeat_err) ? 'ring-red-500' : ''
                                            )}
                                        value={password_repeat}
                                        onChange={handleChange}
                                        onBlur={handleCheckPassword}
                                        onKeyDown={handleEnter}
                                    />
                                </div>
                            </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        defaultChecked={true}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                    <label htmlFor="remember-me"
                                           className="ml-3 block text-sm leading-6 text-gray-900">
                                        Remember me
                                    </label>
                                </div>

                                {!is_reset && (
                                <div className="text-sm leading-6">
                                    <div
                                       className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-500"
                                       onClick={handleForgot}>
                                        Forgot password?
                                    </div>
                                </div>
                                )}
                            </div>

                            <div>
                                <button
                                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    onClick={handleSubmit}
                                >
                                    Sign in
                                </button>
                            </div>
                        </form>

                        {!is_reset && (
                        <div>
                            <div className="relative mt-10">
                                <div
                                    className="absolute inset-0 flex items-center"
                                    aria-hidden="true">
                                    <div
                                        className="w-full border-t border-gray-200"/>
                                </div>
                                <div
                                    className="relative flex justify-center text-sm font-medium leading-6">
                                    <span
                                        className="bg-white px-6 text-gray-900">Or continue with</span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="cursor-pointer flex w-full col-span-2 items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
                                   onClick={handleGoogle}>
                                    <svg className="h-5 w-5" aria-hidden="true"
                                         viewBox="0 0 24 24">
                                        <path
                                            d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                                            fill="#EA4335"
                                        />
                                        <path
                                            d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                                            fill="#34A853"
                                        />
                                    </svg>
                                    <span
                                        className="text-sm font-semibold leading-6">Google</span>
                                </div>
                                {false &&
                                <div className="flex w-full items-center justify-center gap-3 rounded-md bg-[#1D9BF0] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9BF0]" >
                                    <svg className="h-5 w-5" aria-hidden="true"
                                         fill="currentColor"
                                         viewBox="0 0 20 20">
                                        <path
                                            d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                                    </svg>
                                    <span
                                        className="text-sm font-semibold leading-6">Twitter</span>
                                </div>
                                }

                                {false &&
                                <div className="flex w-full items-center justify-center gap-3 rounded-md bg-[#24292F] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24292F]" >
                                    <svg className="h-5 w-5" aria-hidden="true"
                                         fill="currentColor"
                                         viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span
                                        className="text-sm font-semibold leading-6">GitHub</span>
                                </div>
                                }
                            </div>
                        </div>)}
                    </div>

                    <p className="mt-10 text-center text-sm text-gray-500">
                        Not a member?{' '}
                        <a href="#"
                           className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
                           onClick={() => showToast("Please contact sales", "info")}>
                            Start a 14 day free trial
                        </a>
                    </p>
                </div>
            </div>
            <footer className="relative bg-white pt-8 pb-6">
                <div className="container mx-auto px-4">
                    <hr className="my-6 border-gray-400" />
                    <div className="flex flex-wrap items-center md:justify-between justify-center">
                        <div className="w-full md:w-4/12 px-4 mx-auto text-center">
                            <div className="text-sm text-gray-600 py-1">
                                <span className="pr-4 text-gray-400">Copyright © 2024 anchordoc.ai</span>
                                <Link to="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link>
                                {/* <span className="px-1"> | </span><a href="/terms" className="text-gray-600 hover:text-gray-900">Terms of Service</a> */}
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>)
}
