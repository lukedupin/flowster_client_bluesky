import { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import * as Util from '../helpers/util'

const people = [
    { name: 'Wade Cooper', desc: '@wadecooper' },
    { name: 'Arlene Mccoy', desc: '@arlenemccoy' },
    { name: 'Devon Webb', desc: '@devonwebb' },
    { name: 'Tom Cook', desc: '@tomcook' },
    { name: 'Tanya Fox', desc: '@tanyafox' },
    { name: 'Hellen Schmidt', desc: '@hellenschmidt' },
    { name: 'Caroline Schultz', desc: '@carolineschultz' },
    { name: 'Mason Heaney', desc: '@masonheaney' },
    { name: 'Claudie Smitham', desc: '@claudiesmitham' },
    { name: 'Emil Schaefer', desc: '@emilschaefer' },
]

export const SelectMenu = props => {
    const { idx, items, hide_title_desc, onChange } = props

    const handleSelect = (itm) => {
        const idx = items.findIndex(item => item === itm)
        onChange(idx)
    }

    const selected = (idx >= 0 && idx < items.length)? items[idx]: { name: 'None', desc: 'None'}

    return (
        <Listbox value={selected} onChange={handleSelect}>
            {({ open }) => (
                <>
                    <div className="relative mt-2">
                        <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
                            <span className="inline-flex w-full truncate">
                                <span className="truncate">{selected.name}</span>
                                {hide_title_desc &&
                                    <span className="ml-2 truncate text-gray-500">{selected.desc}</span>
                                }
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                        </Listbox.Button>

                        <Transition
                            show={open}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {items.map((item, i) => (
                                    <Listbox.Option
                                        key={`select_menu_${i}`}
                                        className={({ active }) =>
                                            Util.classNames(
                                                active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                                'relative cursor-default select-none py-2 pl-3 pr-9'
                                            )
                                        }
                                        value={item}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <div className="flex">
                                                    <span className={Util.classNames(selected ? 'font-semibold' : 'font-normal', 'truncate')}>
                                                        {item.name}
                                                    </span>
                                                    <span className={Util.classNames(active ? 'text-indigo-200' : 'text-gray-500', 'ml-2 truncate')}>
                                                        {item.desc}
                                                    </span>
                                                </div>

                                                {selected ? (
                                                    <span
                                                        className={Util.classNames(
                                                            active ? 'text-white' : 'text-indigo-600',
                                                            'absolute inset-y-0 right-0 flex items-center pr-4'
                                                        )}
                                                    >
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </Transition>
                    </div>
                </>
            )}
        </Listbox>
    )
}

