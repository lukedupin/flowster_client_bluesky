import { useState } from 'react'
import { Switch } from '@headlessui/react'
import * as Util from '../helpers/util'

export const Toggle = props => {
  const {checked, onToggle} = props
  const sr_only = props.sr_only | "Use settings"

  return (
    <Switch
      checked={checked}
      onChange={onToggle}
      className={Util.classNames("group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 data-[checked]:bg-indigo-600",
                                props.className)}>
      <span className="sr-only">{sr_only}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out group-data-[checked]:translate-x-5"
      />
    </Switch>
  )
}

