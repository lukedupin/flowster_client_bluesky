import React, { Fragment, useState, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import * as Util from "../helpers/util"



export const DropdownCheckbox = props => {
    const { name, checked, children } = props
    const onChange = props.onChange || (() => {})
    const id = props.id || name

    return (<Menu.Item>
            <div key={`bob_${name}`}
                className="items-center text-gray-700 px-4 py-2 text-sm flex flex-row hover:bg-gray-100 hover:text-gray-900">
                <input
                    id={id}
                    name={name}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                    htmlFor={id}
                    className="ml-3 text-sm text-gray-500 cursor-pointer">
                    {children}
                </label>
            </div>
        </Menu.Item>
    )
}

export const DropdownItem = props => {
    const { id, name, value, icon, active, children } = props
    const onClick = props.onClick || (() => {})

    const comp = { icon }

    return (<Menu.Item>
            <div onClick={() => onClick( { target: { id, name, value } } )}
                 className={Util.classNames(
                     active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                     'px-4 py-2 text-sm flex flex-row hover:bg-gray-100 hover:text-gray-900 cursor-pointer' )}>
                {icon && <comp.icon
                    className={Util.classNames( active ? 'text-indigo-500' : 'text-gray-400 hover:text-gray-500', '-ml-0.5 mr-2 h-5 w-5' )}
                    aria-hidden="true"/>}
                {children}
            </div>
        </Menu.Item>)
}

export const Dropdown = props => {
    const { value, header, children, className, onClose } = props
    const align = props.align || 'right'
    const show_override = props.show

    const menuRef = React.useRef(null);

    useEffect(() => {
        if (show_override === undefined) {
            return
        }

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                if (onClose) {
                    setTimeout(onClose, 100)
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuRef]);

    const dyn_args = show_override !== undefined? {show: show_override}: {}

    return (<Menu as="div" ref={menuRef}
                  className={Util.classNames( "relative inline-block text-left", className )}>
            {show_override === undefined &&
            <div>
                <Menu.Button
                    className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    {value}
                    <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                </Menu.Button>
            </div>
            }

            <Transition
                as={Fragment}
                {...dyn_args}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95">

                <Menu.Items className={Util.classNames(
                    `absolute ${align}-0 z-10 mt-2 w-56 origin-top-${align} rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`,
                    (header)? 'divide-y divide-gray-100': '',
                )}>
                    {header && <div className="px-4 py-3">
                        <p className="text-sm font-semibold text-indigo-600">{header}</p>
                    </div>}
                    <div className="py-1">
                        {children}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    )
}

