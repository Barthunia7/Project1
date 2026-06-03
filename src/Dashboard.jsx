import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AudioRecorder from './components/AudioRecorder';

export default function Dashboard() {
  const [text, setText] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error reading your database history grid:", error.message);
    } else if (data) {
      setHistory(data);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return alert("Session expired. Please log in again.");

    const { error } = await supabase
      .from('transcriptions')
      .insert([{ user_id: user.id, text }]);

    if (error) {
      alert(error.message);
    } else {
      setText('');
      fetchData(); 
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with Log Out */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Transcriptions</h1>
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition" 
          onClick={() => supabase.auth.signOut()}
        >
          Log Out
        </button>
      </div>

      {/* Audio Recording Card Container */}
      <div className="mb-8 p-4 bg-white border rounded shadow-sm">
        <AudioRecorder onSaveRefresh={fetchData} />
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleSave} className="mb-8">
        <textarea 
          className="w-full p-3 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Type, paste, or copy-paste your transcribed audio text here to save..." 
          rows="3"
          required 
        />
        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">
          Save Record to History
        </button>
      </form>

      {/* Layout Card History Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map(item => (
          <div key={item.id} className="p-4 border rounded shadow-sm bg-white hover:shadow-md transition">
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{item.text}</p>
            <span className="text-xs text-gray-400 block text-right">
              {new Date(item.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
