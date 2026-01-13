import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import * as Util from "../helpers/util";

export const ButtonOptions = props => {
    const { children, onClick } = props
    const className = props.className || ""
    const buttonClassName = props.buttonClassName || ""
    const options = props.options || []
    const disabled = props.disabled || false
    const align = props.align || 'right'
    const theme = props.theme || 'indigo'

    return (
        <div className={Util.classNames("inline-flex rounded-md", className)}>
            <button
                type="button"
                className={
                    Util.classNames(
                        "relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap",
                        (theme === 'white')? "bg-white text-black ring-1 ring-gray-300": `text-white bg-${theme}-600 hover:bg-${theme}-500 focus-visible:outline-${theme}-600`,
                        buttonClassName,
                    )}
                disabled={disabled}
                onClick={() => onClick(0)}>
                {children}
            </button>
            <Menu as="div" className="relative -ml-px block">
                <Menu.Button className={Util.classNames(
                    "relative inline-flex items-center rounded-r-md px-2 py-2 border-l border-gray-300 focus:z-10",
                    (theme === 'white')? "bg-white text-black ring-1 ring-gray-300": `text-white bg-${theme}-600 hover:bg-${theme}-500`,
                )}>
                    <span className="sr-only">Open options</span>
                    <ChevronDownIcon className="h-5 w-5 flex-shrink-0 shrink-0" aria-hidden="true" />
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
                    <Menu.Items className={`absolute ${align}-0 z-10 -mr-1 mt-2 w-56 origin-top-${align} rounded-md bg-white focus:outline-none border`}>
                        <div className="py-1">
                            {options.map((opt, idx) => (
                                <Menu.Item key={opt}>
                                    {({ active }) => (
                                        <div className={Util.classNames(
                                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm cursor-pointer'
                                             )}
                                             onClick={() => onClick(idx)}>
                                            {opt}
                                        </div>
                                    )}
                                </Menu.Item>
                            ))}
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>
        </div>
    )
}
