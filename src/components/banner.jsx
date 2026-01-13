import { XMarkIcon } from '@heroicons/react/20/solid'
import * as Util from "../helpers/util.js";
import { useEffect } from "react";

export const Banner = (props) => {
    const { message, onDismiss } = props
    const color = ('color' in props)? props.color : 'bg-indigo-600'
    const timeout = ('timeout' in props)? props.timeout : 8000

    useEffect( () => {
        if ( timeout <= 0 ) {
            return
        }

        //Set a timeout
        const timer = setTimeout(() => {
            onDismiss()
        }, timeout)
        return () => clearTimeout(timer)
    })

    return (
        <div className={Util.classNames(
                "flex items-center gap-x-6 px-6 py-2.5 sm:px-3.5 sm:before:flex-1 rounded",
                color,
            )}>
            <p className="text-sm leading-6 text-white">
                {message}
            </p>
            <div className="flex flex-1 justify-end">
                <button type="button"
                        className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
                        onClick={onDismiss}>
                    <span className="sr-only">Dismiss</span>
                    <XMarkIcon className="h-5 w-5 text-white" aria-hidden="true" />
                </button>
            </div>
        </div>
    )
}