import { useStore } from '../store';
import sha256 from 'crypto-js/sha256';
import { enc } from 'crypto-js';


// call this to setup a websocket connection
// url: the url to connect to
// setSocket: is a state hook to set the socket
// routes: is a dictionary of routes to call when a message is received
// failure: is a callback to call when a message is received but the server
export const connectWS = (url, setSocket, routes={}, failure=null) => {
    const socket = new WebSocket( url );

    //Setup a default failure callback if none is given
    if ( failure === null ) {
        failure = (ep, reason) => { console.log(`EP [ ${ep} ]: ${reason}`) }
    }

    //Handle routes from the server
    socket.onmessage = (event) => {
        const js = JSON.parse( event.data )
        const { ep, succ } = js

        const params = js.params || js.resp

        //Failure, quit
        if ( !succ ) {
            return failure( ep, params )
        }

        //Invalid callback?
        if ( !(ep in routes) ||
            routes[ep] == undefined ||
            routes[ep] == null ) {
            return failure( ep, "Missing route" )
        }

        //Success, call the callback
        routes[ep]( params )
    };

    //Default routes
    /*
    socket.onopen = () => {
        console.log('WebSocket connected');
    };
     */
    socket.onclose = () => {
        //console.log('WebSocket disconnected');
        setSocket(null)
    };

    //Callback!
    setSocket( socket )
    return socket
};

export const sendWS = (socket, ep, params) => {
    if ( socket === null || socket.readyState !== WebSocket.OPEN ) {
        console.log("Socket is invalid")
        return null
    }

    return socket.send( JSON.stringify({ ep, params }) )
}

export const closeWS = (socket) => {
    if ( socket ) {
        socket.close()
    }
}

export const fetch_stream_build = async (url, js) => {
    try {
        // Create form data for the request
        const formData = new FormData();
        Object.keys(js).forEach(key => {
            if (js[key] === null) {
                return
            }

            let content = js[key]
            if (content instanceof File) {
                // Handle file upload
            } else if (Array.isArray(js[key]) || typeof content === 'object') {
                content = JSON.stringify(content)
            }

            formData.append(key, content)
        })

        // Make the fetch request
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(js)
        });
        if (!response.ok) {
            console.log('response error')
            return err(`HTTP error! status: ${response.status}`);
        }

        // Get a reader from the response body stream
        return {err:null, reader: response.body.getReader() }
    }
    catch (error) {
        return { err: `HTTP error! status: ${error.message}`, reader: null }
    }
}

export const fetch_stream_consume = async (reader, succ, err) => {
    //Defaults?
    if ( succ === undefined || succ === null ) {
        succ = (js) => { console.log( js ) }
    }
    if ( err === undefined || err === null ) {
        err = (reason) => { console.log(reason) }
    }

    try {
        const decoder = new TextDecoder();

        // Process the stream chunks
        const partial_data = []
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                return succ( { type: 'done' } )
            }

            // Decode the chunk and append to the buffer
            const text = decoder.decode(value, { stream: true });

            //Remove data: prefix and return json
            const lines = text.split('\n');
            for ( let line of lines ) {
                let partial = false
                line = line.trim()
                if ( line.startsWith('data: ') ) {
                    line = line.replace('data: ', '')
                }
                else if ( line.startsWith('partial: ') ) {
                    line = line.replace('partial: ', '')
                    partial = true
                }

                if ( line.trim().length === 0 ) {
                    continue
                }

                //Send the chunk to the success callback
                //console.log(line)
                const js = JSON.parse(line)
                if ( js === null ) {
                    continue
                }

                // Handle partial data
                if ( !partial ) {
                    if ('type' in js) {
                        succ(js)
                    }
                }
                else {
                    if ( js.is_start ) {
                        partial_data.length = 0
                    }

                    partial_data.push( js.data )

                    if ( js.is_done ) {
                        //console.log(partial_data)
                        const js = JSON.parse( partial_data.join('') )
                        if (js !== null && 'type' in js) {
                            //console.log(js)
                            succ(js)
                        }
                        partial_data.length = 0
                    }
                }
            }
        }
    } catch (error) {
        //console.log('Partial error')
        err(`HTTP error! status: ${error.message}`);
    }
}

// Main function to fetch and process the stream
// Always use this unless you need access to the reader to stop a long running request or something
export const fetch_stream = async (url, js, succ, err) => {
    const ret = await fetch_stream_build( url, js )
    if ( ret.err !== null ) {
        return err( ret.err )
    }

    return fetch_stream_consume( ret.reader, succ, err )
}

export const fetch_js = (url, js, succ, err) => {
    const { csrf_token } = useStore.getState();
    //console.log( csrf_token )

    //Load in the data
    const form_data = null //new FormData()
    /*
    //const form_data = Object.values(js).some(x => x instanceof File)? new FormData(): null
    if ( js !== null ) {
        Object.keys( js ).forEach( key => {
            if ( js[key] === null ) {
                return
            }

            let content = js[key]
            if ( content instanceof File ) {
            }
            else if ( Array.isArray( js[key] ) || typeof content === 'object' ) {
                content = JSON.stringify( content )
            }

            form_data.append( key, content );
        } );
    }
     */

    //Build the header
    let header = { method: 'GET' };
    if ( js !== null ) {
        header = {
            method: 'POST',
            headers: {
                //'Content-Type': 'application/json',
                //credentials: 'include',
                //'X-CSRFToken': csrf_token,
            },
            //body: form_data //HTML form format
            //body: JSON.stringify( js ) //Raw json body format
        };

        //Load the header based on the data type, either form_data
        if ( form_data === null ) {
            header.headers['Content-Type'] = 'application/json'
            header.body = JSON.stringify( js )
        }
        else {
            header.body = form_data
        }
    }

    //Defaults?
    if ( succ === undefined || succ === null ) {
        succ = (js) => { console.log( js ) }
    }
    if ( err === undefined || err === null ) {
        err = (reason) => { console.log(`${url} - ${reason}`) }
    }

    //Query
    fetch(url, header).then(resp => {
        //We had a sever related error, can't do anything useful
        if ( !resp.ok ) {
            return "Couldn't handle request"
        }

        //Server had a valid response, pass it off to deal with the data
        try {
            return resp.json();
        }
        catch (error) {
            return resp.text();
        }
    }).then( js => {
        //Parse the servers response, raw strings are error messages, objects are successful data
        if (typeof js === 'string') {
            try {
                const json = JSON.parse(js)
                if ( json.successful ) {
                    succ( json )
                }
                else {
                    err( json.reason )
                }
            }
            catch (error) {
                err( js ) //Actually is a string
            }
        }
        else if (typeof js === 'object' && js !== null) {
            ( js.successful )? succ( js ): err( js.reason )
        }
        else {
            err( "Unknown server response")
        }
    })
}

export const post_js = (url, js, succ, err) => {
    //Build the header
    let header = { method: 'GET' };
    if ( js !== null ) {
        header = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                //credentials: 'include',
                //'X-CSRFToken': csrf_token,
            },
            //body: form_data //HTML form format
            body: JSON.stringify( js ) //Raw json body format
        };
    }

    //Defaults?
    if ( succ === undefined || succ === null ) {
        succ = (js) => { console.log( js ) }
    }
    if ( err === undefined || err === null ) {
        err = (reason) => { console.log(`${url} - ${reason}`) }
    }

    //Query
    fetch(url, header).then(resp => {
        //We had a sever related error, can't do anything useful
        if ( !resp.ok ) {
            return "Couldn't handle request"
        }

        //Server had a valid response, pass it off to deal with the data
        try {
            return resp.json();
        }
        catch (error) {
            return resp.text();
        }
    }).then( js => {
        //Parse the servers response, raw strings are error messages, objects are successful data
        if (typeof js === 'string') {
            try {
                const json = JSON.parse(js)
                if ( json.successful ) {
                    succ( json )
                }
                else {
                    err( json.reason )
                }
            }
            catch (error) {
                err( js ) //Actually is a string
            }
        }
        else if (typeof js === 'object' && js !== null) {
            ( js.successful )? succ( js ): err( js.reason )
        }
        else {
            err( "Unknown server response")
        }
    })
}


/*
export const fetch_raw(url, js) {
    const { csrf_token } = useStore.getState();
    let header = { method: 'GET' };
    if ( js !== null ) {
        header = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrf_token,
            },
            body: JSON.stringify(js)
        };
    }

    //Query
    return fetch(url, header).then(resp => resp.json())
}
*/

export const post_new_tab = (url, data) => {
    // Create a form
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = url
    form.target = '_blank' // To open in a new tab

    // Add data to the form
    Object.keys(data).forEach(key => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = (Array.isArray(data[key]) || typeof data[key] === "object")? JSON.stringify(data[key]): data[key]
        form.appendChild(input)
    })

    // Append the form to the body
    document.body.appendChild(form)

    // Submit the form
    form.submit()

    // Remove the form from the body
    document.body.removeChild(form)
}

export const get_new_tab = (url, data) => {
    // Construct the query string
    const qs = Object.keys(data)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent( (Array.isArray(data[key]) || typeof data[key] === "object")? JSON.stringify(data[key]): data[key] ))
        .join('&')

    // Open the new tab
    window.open(url + (qs? `?${qs}`: ''), '_blank')
}

export const isbool = (raw, allow_str=false) => {
    if ( raw === undefined || raw === null ) {
        return false
    }

    return (typeof raw === "boolean" || raw instanceof Boolean)
}

export const xbool = (raw, def=false) => {
    if ( raw === null || raw === undefined ) {
        return def
    }
    //Main path
    else if ( typeof raw === "boolean" || raw instanceof Boolean ) {
        return raw
    }
    else if ( typeof raw === "object" && !(raw instanceof String) ) {
        return def
    }

    return this.xstr(raw, 'false').toLowerCase() === "true"
}

export const xint = (raw, def=0) => {
    if ( raw === null || raw === undefined ) {
        return def
    }
    else if ( typeof raw === "boolean" || raw instanceof Boolean ) {
        return (raw === true)? 1: 0
    }
    else if ( typeof raw === "object" && !(raw instanceof String) ) {
        return def
    }

    let num = parseInt(raw)
    return !isNaN(num) ? num : def;
}

export const xfloat = (raw, def=0) => {
    if ( raw === null || raw === undefined ) {
        return def
    }
    else if ( typeof raw === "boolean" || raw instanceof Boolean ) {
        return (raw === true)? 1: 0
    }
    else if ( typeof raw === "object" && !(raw instanceof String) ) {
        return def
    }

    let num = parseFloat(raw)
    return !isNaN(num) ? num : def;
}

export const xstr = (raw, def='') => {
    if ( raw === null || raw === undefined ) {
        return def
    }
    else if ( typeof raw === "boolean" || raw instanceof Boolean ) {
        return raw? "true": "false"
    }
    else if ( typeof raw === "object" && !(raw instanceof String) ) {
        return def
    }

    return `${raw}`
}

export const isString = (value) => {
    return typeof value === 'string' || value instanceof String;
}

export const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export const namify = (string) => {
    const ary = string.replace('/', '_').replace(' ', '_').replace('-', '_').split('_');

    let result = [];
    for ( let i = 0; i < ary.length; i++ ) {
        result.push( capitalize( ary[i]) );
    }

    return result.join(' ');
}

export const roundNumber = (number, digits) => {
    var multiple = Math.pow(10, digits);
    return Math.round(number * multiple) / multiple;
}

export const numberWithCommas = (x) => {
    return xint(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export const epoch = () => {
    return new Date().getTime()
}

export const epochToDate = (ms) => {
    var d = new Date(0)
    d.setUTCSeconds(Math.floor(ms / 1000))

    return formatDate(d)
    //return (d.getMonth() + 1) +"/"+ d.getDate() +"/"+ d.getFullYear().toString().slice(-2)
}

export const epochToTime = (ms, short) => {
    var d = new Date(0)
    d.setUTCSeconds(Math.floor(ms / 1000))

    if (short === true) {
        var min = d.getMinutes()
        var hour = d.getHours()
        var am = "am"
        if (hour >= 12) {
            hour -= 12
            am = "pm"
        }

        if (hour === 0)
            hour = 12

        return hour + ":" + lpad((min % 60).toString(), 2, '0') + am
    } else
        return d.toLocaleTimeString()
}

export const epochToDateTime = (ms) => {
    return epochToDate(ms) + " " + epochToTime(ms, true)
}

export const epochExpanded = (ms) => {
    var date = new Date(0)
    date.setUTCSeconds(Math.floor(ms / 1000))

    //Setup the 12 hour format
    var hour = date.getHours()
    var hour_12 = hour % 12
    if (hour_12 === 0) {
        hour_12 = 12
    }

    return {
        month: date.getMonth() + 1,
        day: date.getDate(),
        year: date.getFullYear(),

        hour: hour,
        hour_12: hour_12,
        minute: date.getMinutes(),
        am_pm: (hour < 12) ? "AM" : "PM",
    }
}

export const epochToAgo = (ms) => {
    const diff = Date.now() - ms

    // Calculate the number of days ago
    const hours = Math.round(diff / (1000 * 60 * 60));
    if (hours < 1) {
        return 'now'
    }

    const days = Math.round(hours / 24)
    if (days < 1) {
        return `${hours}h ago`
    }

    const months = Math.round(days / 30)
    if (days < 30) {
        return `${days}d ago`
    }

    const years = Math.floor(months / 12)
    if (months < 12) {
        return `${months}mo ago`
    }
    else {
        return `${years}yr ago`
    }
}

export const lpad = (str, count, char) => {
    str = str.toString()
    if (char === undefined || char === null)
        char = ' '
    while (str.length < count)
        str = char + str

    return str
}

export const rpad = (str, count, char) => {
    str = str.toString()
    if (char === undefined || char === null)
        char = ' '
    while (str.length < count)
        str = str + char

    return str
}

export const formatDate = (date) => {
    var year = date.getFullYear()
    var month = date.getMonth()
    var day = date.getDate()

    return (month + 1) + "/" + day + "/" + year
}

export const formatTime = (ms, show_label, am_pm) => {
    var sec = Math.floor(ms / 1000)
    if (show_label === undefined || show_label === null)
        show_label = true
    if (am_pm === undefined || am_pm === null)
        am_pm = false

    //Raw data!
    if (show_label === false) {
        var min = Math.round(sec / 60)
        if (min < 60)
            return min

        return Math.floor(min / 60) + ":" + lpad((min % 60).toString(), 2, '0')
    }

    var minutes = Math.floor(sec / 60) % 60
    var hours = Math.floor(sec / 3600)

    if (!am_pm)
        return hours + ":" +
            lpad(minutes.toString(), 2, '0') + "." +
            lpad(Math.floor(sec % 60).toString(), 2, '0')


    var am = "am"
    if (hours >= 12) {
        hours -= 12
        am = "pm"
    }

    if (hours === 0)
        hours = 12
    return hours + ":" + lpad(minutes.toString(), 2, '0') + am
}

export const simpleTimestamp = (ms) => {
    var sec = Math.floor((epoch() - ms) / 1000)
    if (sec < 60) {
        sec = 60
    }

    //Years
    if (sec >= 12 * 30 * 24 * 3600) {
        return Math.floor(sec / (12 * 30 * 24 * 3600)) + "yr"
    } else if (sec >= 30 * 24 * 3600) {
        return Math.floor(sec / (30 * 24 * 3600)) + "mo"
    } else if (sec >= 24 * 3600) {
        return Math.floor(sec / (24 * 3600)) + "d"
    } else if (sec >= 3600) {
        return Math.floor(sec / 3600) + "h"
    } else {
        return Math.floor(sec / 60) + "min"
    }
}

export const durationTuple = (ms) => {
    if (ms < 0) {
        ms = 0
    }

    var seconds = ms / 1000

    //Pad zeros
    var min = Math.floor(seconds / 60) % 60
    var sec = Math.floor(seconds) % 60
    if (min < 10) {
        min = "0" + min
    }
    if (sec < 10) {
        sec = "0" + sec
    }

    //Write the time
    return [Math.floor(seconds / 3600) + ":" + min, sec]
}

export const humanDuration = (ms, zero_time) => {
    if (zero_time === undefined || zero_time === null) {
        zero_time = "Now"
    }

    var sec = Math.floor(ms / 1000)
    if (sec <= 0)
        return zero_time
    if (sec === 1)
        return "1 second"
    if (sec < 60)
        return Math.floor(sec) + " seconds"

    var hour = Math.floor(sec / 3600)
    var min = Math.floor(sec / 60) % 60
    if (hour === 0) {
        if (min === 1)
            return "1 minute"
        else
            return min + " minutes"
    }

    if (hour === 1) {
        if (min === 0)
            return "1 hour"
        else if (min === 1)
            return "1 hour and 1 minute"
        else
            return "1 hour and " + min + " minutes"
    }

    if (min === 0)
        return hour + " hour"
    else if (min === 1)
        return hour + " hours and 1 minute"
    else
        return hour + " hours and " + min + " minutes"
}

export const isLeapYear = (date) => {
    var year = date.getFullYear();
    if ((year & 3) !== 0)
        return false;

    return ((year % 100) !== 0 || (year % 400) === 0);
}

export const dayToDate = ( days ) => {
    return new Date( days * 8.64e7 )
}

export const dateToDay = ( date ) => {
    return Math.floor( date / 8.64e7 )
}

// Get Day of Year
export const getDoy = (date) => {
    var day_count = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var mn = date.getMonth();
    var dn = date.getDate();
    var day_of_year = day_count[mn] + dn;
    if (mn > 1 && isLeapYear(date))
        day_of_year++;

    return day_of_year;
}

export const isObject = (obj) => {
    return obj !== undefined && typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0
}

export const shortMonths = () => {
    return [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ]
}

export const toShortMonth = (idx) => {
    if (idx < 0 || idx > 11) {
        return "";
    }

    return shortMonths()[idx]
}

export const numbeRd = ( num ) => {
    if ( num === 0 ) {
        return num
    }
    else if ( num >= 10 && num < 20 ) {
        return `${num}th`
    }
    else if ( num % 10 === 1 ) {
        return `${num}st`
    }
    else if ( num % 10 === 2 ) {
        return `${num}nd`
    }
    else if ( num % 10 === 3 ) {
        return `${num}rd`
    }
    else {
        return `${num}th`
    }
}

export const friendlyDate = (d, include_year=true) => {
    if ( typeof d !== 'object' )  {
        d = new Date(d)
    }

    const date = numbeRd(d.getDate())
    const month = toShortMonth(d.getMonth())
    const year = d.getFullYear()

    if ( include_year ) {
        return `${month} ${date} ${year}`;
    }
    else {
        return `${d.getDate()} ${month}`;
    }
}

export const scrollTo = ( id, options={} ) => {
    if ( id.search(/^[#]/) < 0 ) {
        id = `#${id}`
    }

    const anchor = document.querySelector( id )
    if ( anchor === null || anchor === undefined ) {
        console.log(`Couldn't find ${id}`)
        return
    }

    const args = { behavior: 'smooth', block: 'start' }
    Object.keys(options).forEach( key => {
        args[key] = options[key]
    })

    anchor.style.scrollMarginTop = '75px'
    anchor.scrollIntoView( args )
}

export const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
};

export const hashStr = ( digest ) => {
    //const digest = ary.join(delin)
    return sha256(digest).toString( enc.Hex )
}

export const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ')
}

export const toPercentage = (input) => {
    // Convert the number to a percentage (multiplied by 100)
    let percentage = input * 100;

    // Convert to a string with two digits after the decimal point
    let percentageString = percentage.toFixed(1);

    // Remove trailing zeros and possibly the decimal point
    percentageString = parseFloat(percentageString).toString();

    // Add the percentage sign
    return percentageString + '%';
}

export const getExtension = (fileName) => {
    if (typeof fileName !== 'string') return ''

    const lastDot = fileName.lastIndexOf('.')

    // No dot, or dot is the first char (hidden file)
    if (lastDot === -1 || lastDot === 0) return ''

    return fileName.slice(lastDot + 1)
}

export const safeGet = (obj, key, def=null) => {
    //Big state check to make sure we wont get a bad value
    if ( obj === null || obj === undefined ||
         key === null || key === undefined ||
         typeof obj !== 'object' ) {
        return def
    }

    return (key in obj)? obj[key]: def
}

export const isSM = () => {
    return window.innerWidth >= 640; // Tailwind's sm breakpoint is 640px
}
export const isMD = () => {
    return window.innerWidth >= 768; // Tailwind's sm breakpoint is 640px
}

export const isLG = () => {
    return window.innerWidth >= 1024; // Tailwind's sm breakpoint is 640px
}

export const copyToClipboard = (text, cb) => {
    const callback = cb || (() => {})
    navigator.clipboard.writeText(text)
        .then( callback )
        .catch(err => console.error('Could not copy text: ', err));
}
