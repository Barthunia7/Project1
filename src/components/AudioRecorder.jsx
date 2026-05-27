import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function AudioRecorder() {
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], "recorded_audio.wav", { type: 'audio/wav' });
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(audioBlob));
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Connects frontend to backend server on port 5000
  const handleTranscribe = async () => {
    if (!audioFile) return alert("Please record or upload an audio file first!");
    
    setIsLoading(true);
    setTranscription("");
    
    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      const response = await axios.post('http://localhost:5000/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTranscription(response.data.text);
    } catch (error) {
      setTranscription("Error connecting to backend server. Make sure it is running via 'node index.js'!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white shadow-md rounded-xl p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Speech-To-Text UI</h1>

        {/* File Upload Section */}
        <div className="mb-6 p-4 border-2 border-dashed border-gray-200 rounded-lg">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Audio File</label>
          <input type="file" accept="audio/*" onChange={handleFileUpload} className="w-full text-sm text-gray-500" />
        </div>

        {/* Recording Section */}
        <div className="mb-6 flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg">
          <span className="text-sm font-semibold text-gray-700 mb-3">Live Audio Recording</span>
          {!isRecording ? (
            <button onClick={startRecording} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full">
              Record Audio
            </button>
          ) : (
            <button onClick={stopRecording} className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-full">
              Stop Recording
            </button>
          )}
        </div>

        {/* Audio Player and Transcribe Action Button */}
        {audioUrl && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-800 mb-1">Loaded File: {audioFile?.name || "Live Recording"}</p>
            <audio src={audioUrl} controls className="w-full h-10 mt-1" />
            
            <button 
              onClick={handleTranscribe}
              disabled={isLoading}
              className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-md transition-colors"
            >
              {isLoading ? "Transcribing File..." : "Send for Transcription"}
            </button>
          </div>
        )}

        {/* Live Transcription Box */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Transcription Result</h3>
          <div className="w-full min-h-[120px] bg-gray-900 text-green-400 font-mono p-4 rounded-lg text-sm flex items-center justify-center shadow-inner">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Processing audio...</span>
              </div>
            ) : (
              <p className="w-full text-left">{transcription || "No transcription generated yet."}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
