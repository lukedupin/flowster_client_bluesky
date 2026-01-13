import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import React from "react";
import * as Util from "../helpers/util"

export const Sortable = props => {
    const { show, asc } = props
    const onSort = props.onSort || (() => {})

    const icon = {
        false: (<ChevronDownIcon className="h-5 w-5" aria-hidden="true"/>),
        true: (<ChevronUpIcon className="h-5 w-5" aria-hidden="true"/>),
    }

    const klass = show ? "ml-2 flex-none rounded bg-gray-100 text-gray-900 group-hover:bg-gray-200" :
                         "invisible ml-2 flex-none rounded text-gray-400 group-hover:visible group-focus:visible"

    return (
        <span className={klass} onClick={onSort}>
            {icon[!!asc]}
        </span>
    )
}
