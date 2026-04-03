import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, LogIn, UserPlus, Trophy } from 'lucide-react';

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && envUrl.trim() !== '') return envUrl.replace(/\/$/, '');
  return 'http://localhost:8080';
};

const API_URL = getApiUrl();

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('chess_user', JSON.stringify(data));
        onLogin(data);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="header-title-wrapper">
          <Trophy className="title-icon" />
          <h1 className="main-title gradient-text">GrandMaster</h1>
      </div>

      <div className="glass auth-card">
        <div className="auth-header">
          <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="join-card-subtitle">
            {isLogin ? 'Enter your details to track your progress' : 'Join the elite community of grandmasters'}
          </p>
        </div>

        {error && (
          <div className="status-alert check" style={{ marginBottom: '1rem' }}>
            <Shield className="status-alert-icon" />
            <p className="status-alert-text">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="join-form">
          <div className="input-group">
            <label className="input-label">Username</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Login Now' : 'Sign Up Free'}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            className="auth-switch-btn" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Create one here' : 'Login here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
