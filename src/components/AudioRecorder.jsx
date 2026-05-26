import { useState, useRef } from "react";

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Please allow microphone access to record audio.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert("Audio uploaded successfully!");
        console.log("Server response:", data);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      console.error("Upload network error:", err);
      alert("Could not connect to the backend server.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Speech-to-Text Recorder</h2>
      
      <div className="flex gap-4 mb-6">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-red-500 text-white font-medium rounded-full hover:bg-red-600 transition shadow-lg shadow-red-500/30"
          >
            🔴 Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-gray-700 text-white font-medium rounded-full hover:bg-gray-800 transition animate-pulse"
          >
            ⏹️ Stop Recording
          </button>
        )}
      </div>

      {audioUrl && (
        <div className="w-full flex flex-col items-center gap-4 border-t pt-4">
          <p className="text-sm text-gray-500 font-medium">Playback your recording:</p>
          <audio src={audioUrl} controls className="w-full" />
          
          <button
            onClick={uploadAudio}
            className="w-full mt-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            📤 Upload & Transcribe
          </button>
        </div>
      )}
    </div>
  );
}
