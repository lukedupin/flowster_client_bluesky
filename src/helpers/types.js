
export function toObj(obj, allow_null=true ) {
    if ( obj == undefined || obj == null ) {
        return (allow_null)? {}: null
    }

    if ( !Array.isArray(obj) &&
        typeof obj === "object" &&
        Object.keys(obj).length > 0 ) {
        return obj
    }

    return ( (typeof obj) == "string" ) ? JSON.parse(obj) : null
}

export function toArray(ary, allow_null=true ) {
    if ( ary == undefined || ary == null ) {
        return (allow_null)? []: null
    }

    if ( Array.isArray(obj) && typeof obj == "object" ) {
        return obj
    }

    return ( (typeof obj) == "string" ) ? JSON.parse(obj) : null
}

export function toStr( value, allow_null=true ) {
    if ( value == undefined || value == null ) {
        return (allow_null)? "": null
    }

    return String(value)
}

export function toUuid(value, allow_null=true ) {
    if ( value == undefined || value == null ) {
        return null
    }

    const val = String(value)
    return (isValidUUID(val))? val: null
}

export function toInt(value, allow_null=true) {
    if ( value == undefined || value == null ) {
        return (allow_null)? 0: null
    }

    if (typeof value === "number") {
        return Math.round(value)
    }

    const num = parseInt( value )
    return Number.isInteger( num ) ? num : null
}

export function toFloat(value, allow_null=true ) {
    if ( value == undefined || value == null ) {
        return (allow_null)? 0.0: null
    }

    if (typeof value === "number") {
        return value
    }

    const num = parseFloat( value )
    return (num != NaN)? num: null
}

export function toBool(value, allow_null=true ) {
    if ( value == undefined || value == null ) {
        return (allow_null)? false: null
    }

    //Return the value!
    switch ( typeof value ) {
        case "boolean":
            return value

        case "string":
            return value.toLowerCase().indexOf("true") == 0

        case "number":
            return Math.round(value) != 0

        default:
            return null
    }
}

export function toFile(value, allow_null=true ) {
    if ( value == undefined || value == null ) {
        return (allow_null)? false: null
    }

    return value
}
