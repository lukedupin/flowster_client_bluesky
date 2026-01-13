import { Fragment, useState } from 'react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { Combobox } from '@headlessui/react'
import * as Util from '../helpers/util'


export const ComboboxMenu = props => {
    const { idx, items, onChange } = props
    const cap = ('cap' in props)? props.cap: 50
    const desc = props.desc || ''

    const [query, setQuery] = useState('')

    const handleSelect = (itm) => {
        const idx = items.findIndex(item => item === itm)
        onChange(idx)
    }

    const applyFilter = (query, items) => {
        query = query.toLowerCase()
        if ( query === '' ) {
            return items.slice(0, cap)
        }

        return items.filter(x =>
            x.name.toLowerCase().includes(query) ||
            x.desc.toLowerCase().includes(query) ).slice(0, cap)
    }

    const filtered = applyFilter( query, items )
    const selected = (idx !== undefined && idx !== null && idx >= 0 && idx < items.length)? items[idx]: null

    return (
        <Combobox as="div" value={selected} onChange={handleSelect}>
            <div className="relative mt-2">
                <Combobox.Input
                    className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    onChange={(event) => setQuery(event.target.value)}
                    displayValue={(item) => (item)? `${item.name}  ${item.desc}`: ''}
                    placeholder={desc}
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </Combobox.Button>

                {filtered.length > 0 && (
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {filtered.map((item, item_idx) => (
                            <Combobox.Option
                                key={`combobox_menu_${item_idx}`}
                                value={item}
                                className={({ active }) =>
                                    Util.classNames(
                                        'relative cursor-default select-none py-2 pl-3 pr-9',
                                        active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                    )
                                }
                            >
                                {({ active, selected }) => (
                                    <>
                                        <span className={Util.classNames('block truncate', selected && 'font-semibold')}>{item.name}</span>
                                        <span className="text-gray-500 truncate">{item.desc}</span>
                                        {selected && (
                                            <span
                                                className={Util.classNames(
                                                    'absolute inset-y-0 right-0 flex items-center pr-4',
                                                    active ? 'text-white' : 'text-indigo-600'
                                                )}>
                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </Combobox.Option>
                        ))}
                    </Combobox.Options>
                )}
            </div>
        </Combobox>
    )
}
