import React, { useState, useRef } from 'react';

export default function AudioRecorder() {
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState("Your transcription will appear here after Day 6 integration...");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Handle local file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  // Start recording using MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
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
      alert("Microphone access denied or unavailable.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white shadow-md rounded-xl p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Speech-To-Text Interface</h1>

        {/* 1. File Upload Section */}
        <div className="mb-6 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 transition-colors">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Audio File</label>
          <input 
            type="file" 
            accept="audio/*" 
            onChange={handleFileUpload}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        {/* 2. Audio Recorder Section */}
        <div className="mb-6 flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg">
          <span className="text-sm font-semibold text-gray-700 mb-3">Live Audio Recording</span>
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full shadow-sm flex items-center gap-2 transition-transform transform hover:scale-105"
            >
              <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
              Record Audio
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-full shadow-sm flex items-center gap-2 transition-transform transform hover:scale-105"
            >
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              Stop Recording
            </button>
          )}
        </div>

        {/* Selected/Recorded Audio Preview */}
        {audioUrl && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-800 mb-1">Loaded File: {audioFile?.name || "Live Recording"}</p>
            <audio src={audioUrl} controls className="w-full h-10 mt-1" />
          </div>
        )}

        {/* 3. Transcription Display Section */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Transcription Result</h3>
          <div className="w-full min-h-[120px] bg-gray-900 text-green-400 font-mono p-4 rounded-lg text-sm overflow-y-auto leading-relaxed shadow-inner">
            {transcription}
          </div>
        </div>
      </div>
    </div>
  );
}
