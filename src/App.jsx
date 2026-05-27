import AudioRecorder from "./components/AudioRecorder";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <AudioRecorder />
    </div>
  );
}
import React from 'react';
import AudioRecorder from './components/AudioRecorder';

function App() {
  return (
    <div className="App">
      <AudioRecorder />
    </div>
  );
}

export default App;
