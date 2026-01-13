import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {WEB_URL, WS_URL} from "../settings";
const wsUrl = `${WS_URL}/ws`

export const Landing = props => {
    const { showToast } = props

    const [isLoaded, setIsLoaded] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [markdown, setMarkdown] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [target_name, setTargetName] = useState('');

    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);
    const canvasRef = useRef(null);

    const mediaRecorderRef = useRef(null);
    const websocketRef = useRef(null);

    const [wakeLock, setWakeLock] = useState(null);
    const [isSupported, setIsSupported] = useState(false);
    const [record, setRecord] = useState('');

    const requestWakeLock = async () => {
        try {
            const lock = await navigator.wakeLock.request('screen');
            setWakeLock(lock);

            lock.addEventListener('release', () => {
                console.log('Wake lock was released');
                setWakeLock(null);
            });
        } catch (err) {
            console.error('Wake lock failed:', err);
        }
    };

    const releaseWakeLock = () => {
        if (wakeLock) {
            wakeLock.release();
            setWakeLock(null);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wakeLock) {
                wakeLock.release();
            }
        };
    }, [wakeLock]);
    
    useEffect(() => {
        if ( !isLoaded ) {
            setIsLoaded(true);
            return
        }

        if ( isRecording ) {
            startVisualization();
        }
        else {
            disconnectWebSocket()

            setMarkdown('')
            setLoading(true);

            //Post /api/save-audio
            fetch(`${WEB_URL}/api/save-audio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ target_name })
            }).then(response => response.json())
            .then(data => {
                setLoading(false);
                if ( 'content' in data ) {
                    setMarkdown(data.content)
                }
            })
            .catch((error) => {
                setLoading(false);
                console.error('Error saving audio:', error);
            });
        }
        
    }, [isRecording])

    useEffect(() => {
        if ( isConnected ) {
            startRecording();
        }
    },[isConnected])

    // Initialize WebSocket connection
    const connectWebSocket = () => {
        try {
            websocketRef.current = new WebSocket(wsUrl);

            websocketRef.current.onopen = () => {
                websocketRef.current.send(target_name);
                setIsConnected(true);
                setError('');
                console.log('WebSocket connected');
            };

            websocketRef.current.onclose = () => {
                setIsConnected(false);
                setIsRecording(false)
                console.log('WebSocket disconnected');
            };

            websocketRef.current.onerror = (error) => {
                setError('WebSocket error: ' + error.message);
                setIsConnected(false);
                setIsRecording(false)
            };

            //Get data back
            websocketRef.current.onmessage = (event) => {
                const msg = JSON.parse(event.data)
                if ( msg.event === 'partial' || msg.event === 'final' ) {
                    console.log(msg.text)
                    setRecord(msg.text)
                }
                else if ( msg.event === 'content' ) {
                    setMarkdown(msg.text)
                }
            };

        } catch (err) {
            setError('Failed to connect to WebSocket: ' + err.message);
        }
    };

    // Disconnect WebSocket
    const disconnectWebSocket = () => {
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }
    };

    const startRecording = async () => {
        try {
            setError('');
            
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
                mimeType: 'audio/webm;codecs=opus', // Use opus codec for better compression
            });

            mediaRecorderRef.current = mediaRecorder;

            // Handle data available event
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
                    // Send audio data to WebSocket
                    websocketRef.current.send(event.data);
                    console.log(`Sent audio chunk: ${event.data.size} bytes`);
                }
            };

            // Start recording with time slices (send data every 100ms)
            mediaRecorder.start(100);
            setIsRecording(true);
            
        } catch (err) {
            setError('Failed to access microphone: ' + err.message);
            console.error('Microphone access error:', err);
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
        setIsRecording(false);
        setAudioLevel(0);
    };

    const startVisualization = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!isRecording) return;
            
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

    useEffect(() => {
        return () => {
            stopRecording();
            disconnectWebSocket()
        };
    }, []);

    const handleToggleRecording = () => {
        if (isRecording) {
            releaseWakeLock()
            stopRecording();
        } else {
            requestWakeLock()
            connectWebSocket()
            //startRecording();
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Microphone
                    Stream</h1>
                <p className="text-gray-600">Real-time audio visualization from
                    your microphone</p>
            </div>

            {error && (
                <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="text-center mb-6">
                <button
                    onClick={handleToggleRecording}
                    className={`inline-flex items-center px-6 py-3 rounded-full text-white font-medium transition-all duration-200 ${
                        isRecording
                            ? 'bg-red-500 hover:bg-red-600 shadow-lg scale-105'
                            : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg'
                    }`}
                >
                    {isRecording ? (
                        <>
                            <MicOff className="w-5 h-5 mr-2"/>
                            Stop Recording
                        </>
                    ) : (
                        <>
                            <Mic className="w-5 h-5 mr-2"/>
                            Start Recording
                        </>
                    )}
                </button>
            </div>

            {isRecording && (
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

                    <div className="text-center">
                        <div
                            className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-full">
                            <div
                                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                            <span className="text-sm font-medium">Recording Active</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-6 text-xs text-gray-500 text-center space-y-1">
                {isRecording &&
                    <p>{record}</p>
                }
            </div>

            <Markdown>
                {markdown}
            </Markdown>

            {loading &&
                <div className="inline-flex justify-center space-x-2 w-full">
                    <span className="relative flex size-6 mt-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex size-6 rounded-full bg-sky-500"></span>
                    </span>
                </div>
            }
        </div>
    );
}
