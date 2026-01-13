import React, { useEffect, useRef, useState } from 'react';


export const AutoFillTextarea = (props) => {
    const { id, name, className, value, readOnly } = props
    const marginTop = props.marginTop ? props.marginTop : null

    const [numRows, setNumRows] = useState( props.rows ? props.rows : 1 );

    const textarea = useRef( null );

    // Function to calculate and set the number of rows for the textarea
    const adjustTextareaRows = () => {
        if ( !textarea.current ) {
            return
        }

        const textareaTop = textarea.current.getBoundingClientRect().top;
        const textareaHeight = window.innerHeight - ((marginTop !== null)? marginTop: textareaTop)
        const rowHeight = parseInt( window.getComputedStyle( textarea.current ).lineHeight );
        const calculatedRows = Math.floor( textareaHeight / rowHeight );

        // Set a minimum number of rows to prevent it from collapsing completely
        setNumRows( calculatedRows < 1 ? 1 : calculatedRows );
    };

    // Call the adjustTextareaRows function initially and whenever the window is resized
    useEffect( () => {
        adjustTextareaRows();
        window.addEventListener( "resize", adjustTextareaRows );
        return () => {
            window.removeEventListener( "resize", adjustTextareaRows );
        };
    }, [textarea] );

    return (
        <textarea
            ref={textarea}
            id={id}
            name={name}
            className={className}
            value={value}
            readOnly={readOnly}
            rows={numRows}
        />
    );
}