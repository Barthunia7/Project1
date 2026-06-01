import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email inbox for a verification link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleAuth} className="p-8 bg-white rounded shadow-md w-80">
        <h2 className="mb-4 text-xl font-bold">{isSignUp ? 'Sign Up' : 'Log In'}</h2>
        
        <input 
          className="w-full p-2 mb-3 border rounded" 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        
        <input 
          className="w-full p-2 mb-4 border rounded" 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        
        <button type="submit" className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600 transition">
          {isSignUp ? 'Register' : 'Enter'}
        </button>
        
        <p className="mt-4 text-xs text-blue-500 cursor-pointer text-center hover:underline" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
        </p>
      </form>
    </div>
  );
}
