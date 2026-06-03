import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function AudioRecorder({ onSaveRefresh }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [history, setHistory] = useState([]); 
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('');
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null); // Reference to track and clean up hardware streams

  useEffect(() => {
    fetchHistory();
    
    // Cleanup interval and stream on component unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/history');
      setHistory(response.data);
    } catch (err) {
      console.error("History extraction error:", err.message);
    }
  };

  const startRecording = async () => {
    try {
      setAlertMessage(null);
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; // Store stream for cleanup safely
      
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Fix 2: Stop tracks immediately to free mic hardware instantly
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob, 'recording.webm');
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      triggerAlert('Microphone access denied or missing configuration.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(timerRef.current); // Fix 1: Instantly clear interval layout calculations
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e) => {
  try {
    // 1. Safely extract files with a fallback check
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];

    // 2. Validate file presence and type safely
    if (!file || !file.type.startsWith('audio/')) {
      triggerAlert('Invalid file type. Please upload a valid audio file.', 'error');
      return;
    }

    setAlertMessage(null);
    
    // 3. Forward to automatic upload pipeline
    await uploadAudio(file, file.name);
    
  } catch (error) {
    console.error("File input read error:", error);
    triggerAlert("Failed to load the selected file structure.", "error");
  } finally {
    // 4. Always reset input element safely
    if (e.target) e.target.value = null; 
  }
};


  const uploadAudio = async (fileBlob, filename) => {
    const formData = new FormData();
    formData.append('audio', fileBlob, filename);

    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await fetchHistory();
      if (onSaveRefresh) onSaveRefresh(); 
    } catch (err) {
      triggerAlert('Error connecting to backend server or processing audio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const triggerAlert = (msg, type) => {
    setAlertMessage(msg);
    setAlertType(type);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
  <div className="w-full max-w-2xl mx-auto text-center px-4">
    {/* Alert Notification Block */}
    {alertMessage && (
      <div className={`p-4 mb-6 rounded-lg text-sm font-semibold text-left shadow-sm ${
        alertType === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
      }`}>
        {alertMessage}
      </div>
    )}

    {/* Main Recording Card Area */}
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-6">
      <div className="mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-md transition transform hover:scale-105 ${
            isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-blue-600 text-white'
          }`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <p className="mt-4 font-semibold uppercase tracking-wider text-xs text-gray-500">
          {isRecording ? `Recording: ${formatTime(recordingTime)}` : 'READY TO RECORD'}
        </p>
      </div>

      {/* Hidden Native File Anchor */}
      <input 
        type="file" 
        ref={fileInputRef}
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden" 
      />

      {loading && (
        <p className="text-sm font-semibold text-blue-600 animate-pulse my-4">⏳ Processing audio stream, please wait...</p>
      )}

      {/* Action Controls - Relocated inside the card view container */}
      <div className="flex flex-wrap gap-2 justify-center mt-6 border-t pt-6">
        <button 
          onClick={() => fileInputRef.current.click()} 
          className="px-4 py-2 text-xs bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          Select Audio File
        </button>
        <button onClick={() => triggerAlert("Microphone simulation hook error occurred.", "error")} className="px-3 py-2 text-xs bg-amber-100 text-amber-800 font-medium rounded-lg hover:bg-amber-200 transition">Simulate Mic Error</button>
        <button onClick={() => triggerAlert("Network interface timeout error simulated.", "error")} className="px-3 py-2 text-xs bg-rose-100 text-rose-800 font-medium rounded-lg hover:bg-rose-200 transition">Simulate Network Error</button>
        <button onClick={() => setAlertMessage(null)} className="px-3 py-2 text-xs bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition">Clear Alerts</button>
      </div>
    </div>

    {/* Database File History Block */}
    {history.length > 0 && (
      <div className="text-left mt-8">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold text-gray-800">Transcription History</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">{history.length}</span>
        </div>
        <div className="space-y-3">
          {history.map((item, index) => (
            <div key={item.id || index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium">
                <span>{item.createdAt || 'May 28, 2026'}</span>
                <span>{item.duration || '0:45'}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{item.transcript || item.filename}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

}
