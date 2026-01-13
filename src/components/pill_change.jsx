import React, { Fragment, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, MinusIcon} from '@heroicons/react/20/solid'
import * as Util from "../helpers/util"
import { RatingOverlap } from "../helpers/consts";

export const PillChangeType = {
    INCREASING: 1,
    DECREASING: -1,
}

export const PillType = {
    BAD:    0,
    GOOD:   1,
    NA:     2,
}

export const convertRating = (rating) => {
    if ( rating === undefined || rating === null ) {
        return null
    }

    //Set the pill data
    if ( rating.overlap === RatingOverlap.SUPPORTED ) {
        return { value: rating.rating, change: 1, type: PillType.GOOD }
    }
    else if ( rating.overlap === RatingOverlap.AGAINST ) {
        return { value: rating.rating, change: -1, type: PillType.BAD }
    }
    else if ( rating.overlap === RatingOverlap.DOES_NOT_APPLY ) {
        return { value: '', change: 0, type: PillType.NA }
    }
    else {
        console.error( `Unknown rating overlap: ${rating.overlap}` )
    }

    return null
}

export const simpleValue = value => {
    if ( value === undefined || value === null || value === '' || value == 0 ) {
        return { value: '', change: 0, type: PillType.NA, isGood: x => (x >= 0) }
    }

    if ( value > 0 ) {
        return { value: value, change: 1, type: PillType.GOOD, isGood: x => (x >= 0) }
    }
    else if ( value < 0 ) {
        return { value: value, change: -1, type: PillType.BAD, isGood: x => (x >= 0) }
    }

    // Catch all
    return { value: '', change: 0, type: PillType.NA, isGood: x => (x >= 0) }
}

export const PillChange = props => {
    const { id, value, type, className } = props
    const change = (props.change != undefined)? props.change : value
    const onClick = props.onClick || (() => {})
    const pointer = props.onClick? 'cursor-pointer' : ''
    const good = props.good || "bg-green-100 text-green-500"
    const bad = props.bad || "bg-red-100 text-red-500"
    const na = props.na || "bg-gray-100 text-gray-500"

    const cond = (check, v0, v1, v2) => {
        if ( type === PillType.GOOD ) {
            return v0
        } else if ( type === PillType.BAD ) {
            return v1
        } else {
            return v2
        }
    }

    const is_change_num = ( typeof change === 'number' )
    const chng = { icon: change }

    return (
        <div id={id}
            className={Util.classNames(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0',
                pointer,
                cond( type, good, bad, na ),
                className
            )}
            onClick={() => onClick({target:{id, value}})}>
            {!is_change_num && change !== null &&
                change
            }
            {is_change_num && change !== 0 && change > 0 &&
                <ArrowUpIcon
                    className={Util.classNames(
                        "-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center",
                        cond( type, good, bad, na ),
                    )} aria-hidden="true" />
            }
            {is_change_num && change !== 0 && change < 0 &&
                <ArrowDownIcon
                    className={Util.classNames(
                        "-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center",
                        cond( type, good, bad, na ),
                    )}
                    aria-hidden="true" />
            }
            {is_change_num && change === 0 &&
                <MinusIcon
                    className={Util.classNames(
                        "-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center",
                        cond( type, good, bad, na ),
                    )}
                    aria-hidden="true" />
            }

            <span className="sr-only"> {(change >= 0) ? 'Increased' : 'Decreased'} by </span>
            {value}
        </div>
    )
}
