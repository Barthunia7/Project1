import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; 
import AuthForm from './AuthForm';       
import { supabase } from './supabaseClient'; 

export default function App() {
  const authContext = useAuth() || {};
  const { user = null, loading = false, logout = () => {} } = authContext;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [history, setHistory] = useState([]); 
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilename, setSelectedFilename] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchUserHistory();
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [user]);

  // --- SECURE SUPABASE CLOUD HISTORY LOG LOAD FETCH ---
  const fetchUserHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', user.id) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Supabase cluster link load error:", err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm font-semibold text-gray-500 animate-pulse">Checking credentials, please wait...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const startRecording = async () => {
    try {
      setAlertMessage(null);
      setSelectedFile(null);
      setSelectedFilename('');
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setSelectedFile(audioBlob);
        setSelectedFilename('mic_recording.webm');
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
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('audio/')) {
      triggerAlert('Invalid file type. Please upload a valid audio file.', 'error');
      return;
    }

    setAlertMessage(null);
    setSelectedFile(file);
    setSelectedFilename(file.name);
    e.target.value = null; 
  };

  // --- FORWARD AUDIO TO GROQ BACKEND AND SAVE DATA DOWN TO SUPABASE TABLE ---
  const handleManualTranscriptionSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedFile) {
      triggerAlert("No audio data currently staged for transcription.", "error");
      return;
    }

    const formData = new FormData();
    formData.append('audio', selectedFile, selectedFilename);

    try {
      setSubmitLoading(true);
      setAlertMessage(null);
      
      const response = await axios.post('http://localhost:5000/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const textResult = response.data.transcript;

      if (!textResult) {
        throw new Error("Transcribed text return payload empty.");
      }

      // Insert the result directly into your secure Supabase PostgreSQL database table
      const { error } = await supabase
        .from('transcriptions')
        .insert([
          { 
            user_id: user.id, 
            filename: selectedFilename, 
            text: textResult 
          }
        ]);

      if (error) throw error;

      setSelectedFile(null);
      setSelectedFilename('');
      await fetchUserHistory();
      
    }  catch (err) {
    const errorText = err.response?.data?.error || err.message || 'Processing failed.';
    triggerAlert(errorText, 'error');
  } finally {
    setSubmitLoading(false);
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
    <div className="w-full max-w-2xl mx-auto text-center px-4 pt-6">
      
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="text-left">
          <p className="text-xs text-gray-400 font-medium">Logged in as:</p>
          <p className="text-xs font-bold text-gray-700 truncate max-w-[180px] sm:max-w-none">{user.email}</p>
        </div>
        <button 
          onClick={logout} 
          className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Speech To Text</h1>
        <p className="text-sm text-gray-500">Convert your voice into organized text instantly.</p>
      </div>

      {alertMessage && (
        <div className={`p-4 mb-6 rounded-lg text-sm font-semibold text-left shadow-sm ${
          alertType === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {alertMessage}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 mb-8">
        <div className="mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-md transition transform hover:scale-105 ${
              isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-indigo-600 text-white'
            }`}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <p className="mt-4 font-semibold uppercase tracking-wider text-xs text-gray-400">
            {isRecording ? `Recording: ${formatTime(recordingTime)}` : 'READY TO RECORD'}
          </p>
        </div>

        <input 
          type="file" 
          ref={fileInputRef}
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden" 
        />

        {selectedFilename && (
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 px-4 py-2.5 rounded-xl inline-flex items-center gap-2 text-xs font-bold my-2 shadow-sm">
            🎯 File Staged: <span className="underline italic font-normal">{selectedFilename}</span>
          </div>
        )}

        {submitLoading && (
          <p className="text-sm font-semibold text-indigo-600 animate-pulse my-4">⏳ Processing audio stream, please wait...</p>
        )}

        <div className="flex flex-col gap-4 mt-6 border-t pt-6">
          <div className="flex flex-wrap gap-2 justify-center items-center">
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="px-5 py-2 text-xs bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 transition shadow-sm"
            >
              📁 Select Audio File
            </button>
            <button onClick={() => triggerAlert("Microphone simulation error.", "error")} className="px-3 py-2 text-xs bg-amber-100 text-amber-800 font-medium rounded-lg hover:bg-amber-200 transition">Simulate Mic Error</button>
            <button onClick={() => triggerAlert("Network interface timeout error.", "error")} className="px-3 py-2 text-xs bg-rose-100 text-rose-800 font-medium rounded-lg hover:bg-rose-200 transition">Simulate Network Error</button>
            <button onClick={() => { setSelectedFile(null); setSelectedFilename(''); setAlertMessage(null); }} className="px-3 py-2 text-xs bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition">Reset</button>
          </div>

          {selectedFile && (
            <button
              onClick={(e) => handleManualTranscriptionSubmit(e)}
              disabled={submitLoading}
              className="w-full max-w-md mx-auto py-3 px-6 text-sm font-black tracking-wide text-white uppercase bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
            >
              {submitLoading ? "⏳ Transcribing..." : "🚀 Send For Transcription"}
            </button>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="text-left mt-4 pb-12">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-gray-800">Your Transcription History</h3>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-bold">{history.length}</span>
          </div>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div key={item.id || index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium">
                  <span>{item.created_at ? new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}</span>
                  <span className="text-gray-400 italic">Cloud Synchronized</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{item.text || item.filename}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
