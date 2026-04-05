// PURPOSE: Authentication component — renders the login/signup screen.
// IMPACT: This is the FIRST thing users see. Guards the entire app — no access without authentication.
//         Handles both login and signup flows with a toggle, sends credentials to the backend API.
// ALTERNATIVE: Use a third-party auth provider (Auth0, Firebase Auth, Clerk) for production-grade authentication.
//              Or use OAuth2 (Google/GitHub login) to eliminate password management entirely.

// PURPOSE: Imports React and useState hook for component state management.
// IMPACT: useState manages: isLogin (toggle), username, password, error (message), loading (spinner).
import React, { useState } from 'react';

// PURPOSE: Imports Lucide icon components for the UI.
// IMPACT: Shield = error icon, Lock = password icon, UserIcon = username icon,
//         LogIn/UserPlus = unused but available for button icons, Trophy = title icon.
// ALTERNATIVE: Use react-icons, heroicons, or Font Awesome for icons.
import { Shield, Lock, User as UserIcon, LogIn, UserPlus, Trophy } from 'lucide-react';

// PURPOSE: Helper function that determines the backend API URL.
// IMPACT: Checks the VITE_BACKEND_URL environment variable first (set for production/Vercel).
//         Falls back to http://localhost:8080 for local development.
//         The .replace(/\/$/, '') removes any trailing slash to prevent double-slash URLs.
// ALTERNATIVE: Use a .env file with VITE_BACKEND_URL=http://localhost:8080 for consistent config.
const getApiUrl = () => {
  // PURPOSE: Reads the VITE_BACKEND_URL from Vite's environment variables.
  // IMPACT: In production (Vercel), this is set to the Render backend URL (e.g., https://chess-api.onrender.com).
  const envUrl = import.meta.env.VITE_BACKEND_URL;

  // PURPOSE: Uses the env URL if it exists and is not empty/whitespace.
  // IMPACT: Prevents using an empty string as the API URL (would cause relative URL requests).
  if (envUrl && envUrl.trim() !== '') return envUrl.replace(/\/$/, '');

  // PURPOSE: Default fallback for local development.
  // IMPACT: Assumes the Spring Boot backend is running on localhost:8080.
  return 'http://localhost:8080';
};

// PURPOSE: Evaluates the API URL once when the module loads (not on every render).
// IMPACT: All fetch() calls in this component use this constant URL.
const API_URL = getApiUrl();

// PURPOSE: The Auth component — a controlled form for login/signup.
// IMPACT: Receives onLogin callback from App.jsx. When auth succeeds, calls onLogin(userData)
//         which stores the user in state and localStorage, then renders the main app.
// ALTERNATIVE: Use a router (react-router-dom) with separate /login and /signup pages.
const Auth = ({ onLogin }) => {
  // PURPOSE: isLogin state — toggles between Login and Signup modes.
  // IMPACT: true = login form, false = signup form. Controls form title, button text, and API endpoint.
  const [isLogin, setIsLogin] = useState(true);

  // PURPOSE: username state — bound to the username input field (controlled component).
  // IMPACT: The current value of the username <input>. Updated on every keystroke via onChange.
  const [username, setUsername] = useState('');

  // PURPOSE: password state — bound to the password input field (controlled component).
  // IMPACT: The current value of the password <input>. Updated on every keystroke via onChange.
  const [password, setPassword] = useState('');

  // PURPOSE: error state — holds the error message string to display to the user.
  // IMPACT: When non-empty, an error banner is shown above the form (e.g., "Invalid username or password").
  const [error, setError] = useState('');

  // PURPOSE: loading state — indicates if an API request is in progress.
  // IMPACT: When true, the submit button shows "Processing..." and is disabled to prevent double-submission.
  const [loading, setLoading] = useState(false);

  // PURPOSE: Form submit handler — sends login/signup request to the backend API.
  // IMPACT: async function because it uses await for the fetch() call.
  //         Handles success (store user data) and failure (show error message).
  const handleSubmit = async (e) => {
    // PURPOSE: Prevents the browser's default form submission (which would cause a full page reload).
    // IMPACT: Without this, the browser would navigate to the form's action URL (not desired in SPA).
    e.preventDefault();

    // PURPOSE: Clears any previous error message before a new attempt.
    setError('');

    // PURPOSE: Sets loading to true — disables the submit button and shows "Processing..." text.
    setLoading(true);

    // PURPOSE: Determines the API endpoint based on the current mode (login vs signup).
    // IMPACT: Login → POST /api/auth/login, Signup → POST /api/auth/signup.
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      // PURPOSE: Sends the HTTP POST request to the backend with username and password.
      // IMPACT: The fetch() call goes to: http://localhost:8080/api/auth/login (or signup).
      //         Headers specify JSON content type so Spring's @RequestBody can deserialize it.
      //         Body is JSON-serialized: { "username": "alice", "password": "mypassword" }
      // ALTERNATIVE: Use axios.post(url, data) for simpler syntax and automatic JSON parsing.
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // PURPOSE: Parses the JSON response body from the backend.
      // IMPACT: On success: { username, wins, losses, xp, message }
      //         On failure: { message: "Invalid username or password" } or plain string.
      const data = await response.json();

      // PURPOSE: Checks if the HTTP response status is 2xx (success).
      if (response.ok) {
        // PURPOSE: Stores the user data in localStorage for session persistence across page reloads.
        // IMPACT: When the user refreshes the page, App.jsx reads this from localStorage to skip the login screen.
        //         WARNING: localStorage is not secure — user data (including the session) can be inspected/modified.
        // ALTERNATIVE: Use httpOnly cookies or JWT tokens stored in memory for better security.
        localStorage.setItem('chess_user', JSON.stringify(data));

        // PURPOSE: Calls the parent component's (App.jsx) login handler with the user data.
        // IMPACT: App.jsx sets user state → the auth screen is replaced with the main dashboard.
        onLogin(data);
      } else {
        // PURPOSE: Displays the error message from the backend response.
        // IMPACT: Shows "Invalid username or password" or "Username already taken!" in the error banner.
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      // PURPOSE: Handles network errors (backend not running, CORS blocked, timeout, etc.).
      // IMPACT: Shows a generic connection error message to the user.
      // ALTERNATIVE: Differentiate between network errors and server errors for more specific messages.
      setError('Connection error. Is the backend running?');
    } finally {
      // PURPOSE: Always executes — resets the loading state regardless of success or failure.
      // IMPACT: Re-enables the submit button and hides the "Processing..." text.
      setLoading(false);
    }
  };

  // PURPOSE: Renders the authentication UI — centered card with form, toggle, and branding.
  return (
    // PURPOSE: Full-screen centered container with dark gradient background.
    // IMPACT: Styled by .auth-container in index.css — min-height: 100vh, centered content.
    <div className="auth-container">
      {/* PURPOSE: Title section with trophy icon and gradient "GrandMaster" text. */}
      {/* IMPACT: Creates the branding impression — first thing users see. Animated with slideDown. */}
      <div className="header-title-wrapper">
          {/* PURPOSE: Trophy icon with green glow effect (CSS filter: drop-shadow). */}
          <Trophy className="title-icon" />
          {/* PURPOSE: Main title with gradient text effect (green-to-blue). */}
          {/* IMPACT: .gradient-text uses background-clip: text to make text appear as a gradient. */}
          <h1 className="main-title gradient-text">GrandMaster</h1>
      </div>

      {/* PURPOSE: Glass-morphism card containing the auth form. */}
      {/* IMPACT: .glass applies backdrop-filter: blur() and semi-transparent background. */}
      {/*         .auth-card adds shadow, border-radius, padding, and slideUp animation. */}
      <div className="glass auth-card">
        {/* PURPOSE: Header text that changes based on login/signup mode. */}
        <div className="auth-header">
          {/* PURPOSE: Dynamic title — "Welcome Back" for login, "Create Account" for signup. */}
          <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          {/* PURPOSE: Subtitle with context-appropriate message. */}
          <p className="join-card-subtitle">
            {isLogin ? 'Enter your details to track your progress' : 'Join the elite community of grandmasters'}
          </p>
        </div>

        {/* PURPOSE: Conditionally renders the error banner when an error message exists. */}
        {/* IMPACT: Shows a red alert with Shield icon and the error text. */}
        {/* ALTERNATIVE: Use a toast/notification library (react-hot-toast) for non-blocking error messages. */}
        {error && (
          <div className="status-alert check" style={{ marginBottom: '1rem' }}>
            <Shield className="status-alert-icon" />
            <p className="status-alert-text">{error}</p>
          </div>
        )}

        {/* PURPOSE: The login/signup form — controlled by React state. */}
        {/* IMPACT: onSubmit triggers handleSubmit which calls the backend API. */}
        <form onSubmit={handleSubmit} className="join-form">
          {/* PURPOSE: Username input group with label and icon. */}
          <div className="input-group">
            <label className="input-label">Username</label>
            <div style={{ position: 'relative' }}>
              {/* PURPOSE: User icon positioned inside the input field (absolute positioning). */}
              <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              {/* PURPOSE: Controlled username input — value comes from state, onChange updates state. */}
              {/* IMPACT: 'required' attribute prevents form submission with empty username. */}
              {/*         paddingLeft: 40px makes room for the icon inside the input. */}
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

          {/* PURPOSE: Password input group with label and lock icon. */}
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              {/* PURPOSE: Lock icon positioned inside the password input field. */}
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              {/* PURPOSE: Controlled password input — type="password" masks the characters. */}
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

          {/* PURPOSE: Submit button — triggers the form submission. */}
          {/* IMPACT: disabled={loading} prevents double-clicks during API calls. */}
          {/*         Text changes to "Processing..." while loading. */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Login Now' : 'Sign Up Free'}
          </button>
        </form>

        {/* PURPOSE: Toggle link between login and signup modes. */}
        {/* IMPACT: Clicking "Create one here" switches to signup mode (and vice versa). */}
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

// PURPOSE: Exports the Auth component as the default export for use in App.jsx.
export default Auth;
