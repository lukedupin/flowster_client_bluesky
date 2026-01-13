import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import {WEB_URL, WS_URL} from "../settings";
const wsUrl = `${WS_URL}/ws/speech_to_text`;

export const Microphone = props => {
    const { showToast, stealth, show_partial, isRecording } = props
    const onStop = props.onStop || (() => {});
    const onChunk = props.onChunk || ((data) => {});
    const onMessageChunk = props.onMessageChunk || ((msg) => {});

    const [isLoaded, setIsLoaded] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [partial, setPartial] = useState('');

    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);
    const canvasRef = useRef(null);

    const mediaRecorderRef = useRef(null);

    const [wakeLock, setWakeLock] = useState(null);

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, []);

    useEffect(() => {
        if ( isConnected ) {
            startRecording();
        }
        else {
            stopRecording();
        }

    }, [isConnected])

    useEffect(() => {
        if ( !isLoaded ) {
            setIsLoaded(true);
            return
        }

        if ( isRecording ) {
            connectWebSocket()
        }
        else {
            disconnectWebSocket()
        }

    }, [isRecording])

    const websocketRef = useRef(null);

    // Initialize WebSocket connection
    const connectWebSocket = () => {
        try {
            websocketRef.current = new WebSocket(wsUrl);

            websocketRef.current.onopen = () => {
                setIsConnected(true)
                console.log('WebSocket connected');
            };

            websocketRef.current.onclose = () => {
                setIsConnected(false)
                console.log('WebSocket disconnected');
            };

            websocketRef.current.onerror = (error) => {
                console.log(error)
                showToast('WebSocket error');
                setIsConnected(false)
            };

            //Get data back
            websocketRef.current.onmessage = (event) => {
                const msg = JSON.parse(event.data)
                if ( msg.event === 'final' ) {
                    setPartial('')
                }
                else if ( msg.event === 'partial' ) {
                    setPartial(msg.text)
                }

                onMessageChunk(msg)
            }

        } catch (err) {
            showToast('Failed to connect to WebSocket: ' + err)
        }
    };

    // Disconnect WebSocket
    const disconnectWebSocket = () => {
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }

        setIsConnected(false)
    };

    const handleAudioChunk = ( data ) => {
        if ( websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN ) {
            websocketRef.current.send( data )
        }

        onChunk(data)
    }

    const requestWakeLock = async () => {
        try {
            const lock = await navigator.wakeLock.request('screen');
            setWakeLock(lock);

            lock.addEventListener('release', () => {
                console.log('Wake lock was released');
                setWakeLock(null);
            });
        } catch (err) {
            showToast('Wake lock failed:', err);
        }
    };

    const releaseWakeLock = () => {
        if (wakeLock) {
            wakeLock.release();
            setWakeLock(null);
        }
    };

    const startRecording = async () => {
        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    //channelCount: 1,
                }
            });

            streamRef.current = stream;

            // Set up audio context and analyser
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();

            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;

            source.connect(analyser);
            analyserRef.current = analyser;

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/mp4', // mp4 for ios support
            });

            mediaRecorderRef.current = mediaRecorder;

            // Handle data available event
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 ) {
                    // Send audio data to WebSocket
                    handleAudioChunk(event.data)
                    console.log(`Sent audio chunk: ${event.data.size} bytes`);
                }
            };

            // Start recording with time slices (send data every 100ms)
            mediaRecorder.start(100);
            await requestWakeLock()

            // Start visualization
            if ( !stealth ) {
                startVisualization();
            }

        } catch (err) {
            onStop()
            showToast('Microphone access denied or error occurred. ', err);
        }
    };

    const stopRecording = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        releaseWakeLock()
        setAudioLevel(0);
    };

    const startVisualization = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isRecording) {
                return;
            }

            analyser.getByteFrequencyData(dataArray);

            // Calculate average audio level
            const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
            setAudioLevel(Math.round((average / 255) * 100));

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw waveform
            const barWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;

                // Create gradient
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
                gradient.addColorStop(0, '#3b82f6');
                gradient.addColorStop(0.5, '#06b6d4');
                gradient.addColorStop(1, '#8b5cf6');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();
    };

    if (!isRecording || stealth) {
        return ( <></> )
    }

    return (
        <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                    <Volume2 className="w-5 h-5 text-gray-600"/>
                    <div className="flex-1 max-w-xs">
                        <div
                            className="bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-100 ease-out"
                                style={{width: `${audioLevel}%`}}
                            />
                        </div>
                    </div>
                    <span
                        className="text-sm font-medium text-gray-600 w-12 text-right">
                        {audioLevel}%
                    </span>
                </div>

                <div className="bg-gray-900 rounded-lg p-4">
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        className="w-full h-32 rounded"
                        style={{background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'}}
                    />
                </div>
            </div>
            {show_partial &&
            <div>
                {partial}
            </div>
            }
        </div>
    );
}
