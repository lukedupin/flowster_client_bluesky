import { useEffect, useState, useRef } from 'react'
import { Dialog, DialogBackdrop } from '@headlessui/react'
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import * as Util from '../helpers/util'; // Assuming you have a utils.js file for utility functions
import { WEB_URL } from '../settings'; // Assuming you have a settings.js file for constants


export const HtmlVibeModal = props => {
    const { open } = props
    const onClose = props.onClose || (() => {})
    const onConfirm = props.onConfirm || onClose

    const [value, setValue] = useState( "" )

    useEffect( () => {
        if ( open ) {
            setValue( "" )
        }
    }, [open] )

    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Function to scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll whenever messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle textarea input
    const handleInputChange = (e) => {
        setInputText(e.target.value);
    };

    // Handle key press for Ctrl+Enter
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Send message function
    const sendMessage = () => {
        if ( !inputText.trim() ) return;

        setIsLoading( true );

        // Add user message to list
        const userMessage = inputText;
        setMessages( prevMessages => [...prevMessages, {
            text: userMessage,
            isUser: true
        }] );
        setInputText( '' );

        const payload = {
            question: userMessage,
        }

        Util.fetch_stream( `${WEB_URL}/api/flowster_chat`, payload, js => {
            if ( js === null || js === undefined ) {
                return
            }

            console.log( js );
            try {
                const json = JSON.parse(js);
                setMessages( prevMessages => [...prevMessages, {
                    text: json.answer,
                    isUser: false
                }] );
                setIsLoading( false );
                textareaRef.current?.focus();
            } catch (error) {
                console.error("Error parsing JSON:", error);
            }
        }, err => {
            console.error( 'Error sending message:', err );
            setMessages( prevMessages => [...prevMessages, {
                text: 'Error: Failed to send message. Server might be down. ' + err,
                isUser: false
            }] );
            setIsLoading( false );
            textareaRef.current?.focus();
        } )
    }

    return (
        <Dialog open={open} onClose={onClose} className="relative z-10">
            <DialogBackdrop
                transition="true"
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <Dialog.Panel
                        transition="true"
                        className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-3xl sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95">
                        <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                            <button
                                type="button"
                                onClick={() => onClose(false)}
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-offset-2" >
                                <span className="sr-only">Close</span>
                                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex flex-col bg-gray-100" style={{height: '640px'}}>
                            <div className="flex-1 overflow-auto p-4">
                                <div className="max-w-3xl mx-auto">
                                    <h1 className="text-2xl font-bold mb-6 text-center">Flowster Conversation</h1>

                                    {/* Message list */}
                                    <div className="space-y-4">
                                        {messages.map((message, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-lg ${
                                                    message.isUser
                                                        ? 'bg-blue-500 text-white ml-12'
                                                        : 'bg-white text-gray-800 border border-gray-200 mr-12'
                                                }`}
                                            >
                                                <p className="whitespace-pre-wrap">{message.text}</p>
                                            </div>
                                        ))}
                                        {/* Empty div for scrolling to bottom */}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>
                            </div>

                            {/* Input area */}
                            <div className="bg-white border-t border-gray-200 p-4">
                                <div className="max-w-3xl mx-auto">
                                    <div className="flex flex-col">
                                        <textarea
                                            ref={textareaRef}
                                            value={inputText}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            rows="4"
                                            placeholder="Type your message here... (Press Ctrl+Enter to send)"
                                            disabled={isLoading}
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button
                                                onClick={sendMessage}
                                                disabled={isLoading || !inputText.trim()}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                {isLoading ? 'Sending...' : 'Send'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    )
}
