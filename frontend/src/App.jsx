// PURPOSE: The root application component — orchestrates the entire UI, authentication, navigation, and game state.
// IMPACT: This is the TOP-LEVEL component that contains ALL views: Auth screen, Dashboard, Game, History, Training.
//         Manages global state: user session, game configuration, WebSocket connection, and active tab.
// ALTERNATIVE: Use React Router (react-router-dom) for URL-based navigation instead of tab state.

// PURPOSE: Imports React, useState (state management), and useEffect (side effects/lifecycle).
import React, { useState, useEffect } from 'react';

// PURPOSE: Imports the ChessBoard component — renders the interactive chess board for live games.
import ChessBoard from './components/ChessBoard';

// PURPOSE: Imports the ReplayBoard component — renders a non-interactive board for reviewing past matches.
import ReplayBoard from './components/ReplayBoard';

// PURPOSE: Imports the PuzzleBoard component — renders the tactical training puzzle interface.
import PuzzleBoard from './components/PuzzleBoard';

// PURPOSE: Imports the Auth component — renders the login/signup screen.
import Auth from './components/Auth';

// PURPOSE: Imports the custom WebSocket hook for real-time multiplayer communication.
import { useGameSocket } from './hooks/useGameSocket';

// PURPOSE: Imports Lucide React icon components used throughout the UI.
// IMPACT: Trophy = welcome icon, History = nav icon, Shield = error icon, Play = nav icon,
//         LogOut = logout button, ChevronRight = history card arrow, UserIcon = sidebar profile,
//         Lightbulb = training nav icon.
// ALTERNATIVE: Use react-icons for a wider selection, or SVG sprites for performance.
import { Trophy, History, Shield, Play, LogOut, ChevronRight, User as UserIcon, Lightbulb } from 'lucide-react';

// PURPOSE: Imports axios — a popular HTTP client library for making API requests.
// IMPACT: Used for match history and puzzle API calls (GET requests).
//         Simpler than fetch() — auto-parses JSON, has interceptors, better error handling.
// ALTERNATIVE: Use native fetch() API (no extra dependency), or ky (fetch wrapper with retries).
import axios from 'axios';

// PURPOSE: The main App component function.
function App() {
  // ========================= STATE MANAGEMENT =========================

  // PURPOSE: Stores the currently logged-in user's data (from AuthResponse).
  // IMPACT: null = not logged in (show Auth screen). Non-null = logged in (show dashboard).
  //         Contains: { username, wins, losses, xp, message }
  // ALTERNATIVE: Use a React Context for user state accessible by any descendant component.
  const [user, setUser] = useState(null);

  // PURPOSE: The current game room ID / session identifier.
  // IMPACT: Used for WebSocket subscriptions and move routing. Set when starting/joining a game.
  //         Initial value is a random "match-XXX" string (overridden when user sets up a game).
  const [gameId, setGameId] = useState('match-' + Math.floor(Math.random() * 1000));

  // PURPOSE: Whether the player has joined a game room (triggers WebSocket connection).
  // IMPACT: When true, the useGameSocket hook connects to the backend WebSocket.
  const [joined, setJoined] = useState(false);

  // PURPOSE: Stores the last move received from the WebSocket (from the opponent).
  // IMPACT: Passed to ChessBoard to sync the opponent's moves on the local board.
  const [lastMove, setLastMove] = useState(null);

  // PURPOSE: Array of chat messages for the current game session.
  // IMPACT: Passed to ChessBoard for display in the chat panel (multiplayer mode).
  const [chats, setChats] = useState([]);
  
  // ========================= GAME SETUP STATE =========================

  // PURPOSE: Controls visibility of the game setup modal overlay.
  const [showSetup, setShowSetup] = useState(false);

  // PURPOSE: The selected game mode — 'multiplayer' (vs human) or 'ai' (vs computer).
  // IMPACT: Determines whether a room code is required and whether AI logic runs in ChessBoard.
  const [gameMode, setGameMode] = useState('multiplayer');

  // PURPOSE: AI difficulty level — 'easy', 'medium', or 'hard'.
  // IMPACT: Passed to ChessBoard which adjusts AI move selection strategy based on difficulty.
  const [difficulty, setDifficulty] = useState('medium');

  // PURPOSE: The player's chosen color — 'white', 'black', or 'random'.
  // IMPACT: Determines board orientation and which side the player controls.
  const [playerColor, setPlayerColor] = useState('white');

  // PURPOSE: The room code input for multiplayer mode.
  // IMPACT: Both players must enter the same code to be placed in the same game room.
  const [joinCode, setJoinCode] = useState('');

  // PURPOSE: Game duration in minutes for the chess clock.
  // IMPACT: Converted to seconds (matchDuration * 60) and passed to ChessBoard for the timers.
  const [matchDuration, setMatchDuration] = useState(10); // in minutes

  // PURPOSE: The finalized game configuration object, set when the user confirms game setup.
  // IMPACT: When non-null, ChessBoard is rendered with these settings. When null, the welcome screen is shown.
  const [gameConfig, setGameConfig] = useState(null);

  // ========================= NAVIGATION & HISTORY STATE =========================

  // PURPOSE: The currently active tab — 'play', 'history', or 'training'.
  // IMPACT: Determines which main content section is visible.
  const [activeTab, setActiveTab] = useState('play'); // play, history, training

  // PURPOSE: Array of past match records fetched from the backend.
  // IMPACT: Displayed in the History tab as a list of match cards.
  const [matchHistory, setMatchHistory] = useState([]);

  // PURPOSE: The currently selected match for replay (in History tab).
  // IMPACT: When non-null, ReplayBoard is shown instead of the match list.
  const [selectedMatch, setSelectedMatch] = useState(null);

  // PURPOSE: The currently selected puzzle for training (in Training tab).
  // IMPACT: When non-null, PuzzleBoard is rendered with this puzzle.
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);

  // ========================= API URL CONFIGURATION =========================

  // PURPOSE: Same API URL helper function as in Auth.jsx — determines the backend URL.
  // IMPACT: Used for axios calls to /api/matches and /api/puzzles.
  // TODO: Extract this to a shared utility module to avoid code duplication with Auth.jsx.
  const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_BACKEND_URL;
    if (envUrl && envUrl.trim() !== '') return envUrl.replace(/\/$/, '');
    return 'http://localhost:8080';
  };

  // PURPOSE: Evaluates the API URL once (per render, but the function is pure so result is consistent).
  const API_URL = getApiUrl();

  // ========================= EFFECTS (Side Effects / Lifecycle) =========================

  // PURPOSE: On mount, checks localStorage for an existing user session.
  // IMPACT: If the user previously logged in and refreshed the page, they're automatically restored.
  //         The empty dependency array [] means this runs ONCE on component mount.
  // ALTERNATIVE: Use a proper auth token with expiration checking.
  useEffect(() => {
    const savedUser = localStorage.getItem('chess_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // PURPOSE: When the user state changes (login/logout), fetch their match history.
  // IMPACT: Populates the matchHistory state for the History tab.
  //         Dependency: [user] — runs whenever the user logs in or out.
  useEffect(() => {
    if (user) {
      fetchMatchHistory();
    }
  }, [user]);

  // PURPOSE: Fetches the logged-in user's match history from the backend API.
  // IMPACT: Calls GET /api/matches/user/{userId} and stores the result in matchHistory state.
  // ALTERNATIVE: Use React Query (TanStack Query) for automatic caching, retries, and loading states.
  const fetchMatchHistory = async () => {
    // PURPOSE: Guard clause — can't fetch history without a user ID.
    // IMPACT: Logs a warning if user or user.id is missing. This happens because AuthResponse
    //         doesn't include the user's database ID (known gap in the auth flow).
    if (!user || user.id === undefined || user.id === null) {
      console.warn('Cannot fetch history: Missing User ID');
      return;
    }
    try {
      // PURPOSE: GET request to fetch all matches involving this user.
      const response = await axios.get(`${API_URL}/api/matches/user/${user.id}`);
      // PURPOSE: Stores the match list in state for rendering in the History tab.
      setMatchHistory(response.data);
    } catch (error) {
      // PURPOSE: Logs fetch errors without crashing the app.
      console.error('Error fetching history:', error);
    }
  };

  // PURPOSE: Fetches the daily puzzle from the backend and switches to the Training tab.
  // IMPACT: Calls GET /api/puzzles/daily and sets the selectedPuzzle state.
  const fetchDailyPuzzle = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/puzzles/daily`);
      setSelectedPuzzle(response.data);
      setActiveTab('training');
    } catch (error) {
      console.error('Error fetching puzzle:', error);
    }
  };

  // ========================= WEBSOCKET HOOK =========================

  // PURPOSE: Initializes the WebSocket connection for real-time multiplayer.
  // IMPACT: Passes: gameId (only if joined), userId, and callbacks for moves, chat, and join status.
  //         Returns: { connected, error, sendMove, sendChat }
  //         The hook connects when joined=true and gameId is set. It disconnects when either becomes falsy.
  const { connected, error, sendMove, sendChat } = useGameSocket(
      joined ? gameId : null,  // Only connect if the player has joined a game.
      user?.id,                // The current user's database ID (used for join message).
      (move) => {              // onMoveReceived — callback when an opponent's move arrives.
        setLastMove(move);     // Stores the move for ChessBoard to process.
      },
      (chat) => {              // onChatReceived — callback when a chat message arrives.
        setChats(prev => [...prev, chat]); // Appends the message to the chat history.
      },
      (status) => {            // onJoinStatus — callback for join success/error events.
        if (status.status === 'error') {
          console.error('Join Error:', status.message);
        }
      }
  );

  // ========================= EVENT HANDLERS =========================

  // PURPOSE: Handles successful login/signup — stores user data in state and localStorage.
  // IMPACT: Triggers re-render which replaces the Auth screen with the main dashboard.
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('chess_user', JSON.stringify(userData));
  };

  // PURPOSE: Handles user logout — clears session data and resets game state.
  // IMPACT: Removes user from localStorage, resets user state to null, and disconnects from any game.
  //         Triggers re-render which shows the Auth screen.
  const handleLogout = () => {
    localStorage.removeItem('chess_user');
    setUser(null);
    setJoined(false);
  };

  // PURPOSE: Finalizes game setup and starts the game.
  // IMPACT: Resolves random color choice, sets the game room ID, creates the game config object,
  //         closes the setup modal, and triggers WebSocket connection by setting joined=true.
  const confirmStartGame = () => {
    // PURPOSE: Resolves 'random' color choice to either 'white' or 'black'.
    let finalColor = playerColor;
    if (playerColor === 'random') {
      finalColor = Math.random() > 0.5 ? 'white' : 'black';
    }
    
    // PURPOSE: Determines the game room ID based on game mode.
    // IMPACT: Multiplayer: uses the player-provided room code.
    //         AI: generates a random room code (no real multiplayer connection needed).
    const targetGameId = (gameMode === 'multiplayer')
      ? joinCode.trim()
      : 'match-' + Math.floor(Math.random() * 10000);

    // PURPOSE: Sets all game parameters — triggers WebSocket connection and ChessBoard rendering.
    setGameId(targetGameId);
    setPlayerColor(finalColor);
    setGameConfig({ gameId: targetGameId, gameMode, difficulty, playerColor: finalColor, matchDuration });
    setShowSetup(false); // Closes the setup modal.
    setJoined(true);     // Triggers WebSocket connection via useGameSocket hook.
  };

  // ========================= RENDER =========================

  // PURPOSE: If no user is logged in, render the Auth screen and nothing else.
  // IMPACT: This is a "guarded route" — the entire app is behind authentication.
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // PURPOSE: Renders the main application layout with sidebar navigation and content area.
  return (
    <div className="app-layout">
      {/* ==================== SIDEBAR NAVIGATION ==================== */}
      {/* PURPOSE: Left sidebar with navigation buttons, user profile, and logout. */}
      {/* IMPACT: Fixed width (260px), full height. Contains Play, History, Training tabs + user info. */}
      <nav className="sidebar-nav">
        {/* PURPOSE: App logo/title in the sidebar header. */}
        <div className="nav-logo">
          {/* PURPOSE: Logo image — displays the chess platform logo. */}
          <img src="/logo.png" alt="GrandMaster Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
          <span>GrandMaster</span>
          <span style={{ fontSize: '10px', opacity: 0.5, marginLeft: '8px' }}>v1.1</span>
        </div>

        {/* PURPOSE: Play tab button — shows the game setup/chess board. */}
        {/* IMPACT: Sets activeTab to 'play', highlighting this button and showing the Play content. */}
        <button 
          className={`nav-item ${activeTab === 'play' ? 'active' : ''}`} 
          onClick={() => setActiveTab('play')}
        >
          <Play size={20} /> Play
        </button>

        {/* PURPOSE: History tab button — shows past match records. */}
        {/* IMPACT: Also resets selectedMatch to null so the list is shown instead of a replay. */}
        <button 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => {
            setActiveTab('history');
            setSelectedMatch(null); // Reset to list view when switching to History tab.
          }}
        >
          <History size={20} /> History
        </button>

        {/* PURPOSE: Training tab button — fetches and displays the daily puzzle. */}
        {/* IMPACT: Triggers fetchDailyPuzzle() which calls the API and switches to the training tab. */}
        <button 
          className={`nav-item ${activeTab === 'training' ? 'active' : ''}`} 
          onClick={fetchDailyPuzzle}
        >
          <Lightbulb size={20} /> Training
        </button>

        {/* PURPOSE: Footer section at the bottom of the sidebar — user profile and logout. */}
        <div className="nav-footer">
          {/* PURPOSE: Displays the logged-in user's username with a user icon. */}
          <div className="user-profile">
            <UserIcon size={18} />
            <span>{user.username}</span>
          </div>
          {/* PURPOSE: Logout button — clears session and returns to login screen. */}
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      {/* PURPOSE: The main content area that fills the remaining width. */}
      {/* IMPACT: Scrollable content that shows the active tab's content (Play, History, or Training). */}
      <div className="app-main">
        {/* PURPOSE: Displays a WebSocket error banner if there's a connection error. */}
        {/* IMPACT: Shows errors like "Room is full" with a reload button. */}
        {error && (
          <div className="status-alert error" style={{ margin: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>Reload</button>
          </div>
        )}

        {/* ==================== PLAY TAB ==================== */}
        {/* PURPOSE: Renders the "Play" view — either the welcome screen or the live chess board. */}
        {activeTab === 'play' && (
          <div className="game-section">
            {/* PURPOSE: If no game is configured, show the welcome/setup prompt. */}
            {!gameConfig ? (
              <div className="setup-welcome glass-container">
                <Trophy size={48} className="text-accent mb-4" />
                <h2>Ready to prove your skill?</h2>
                <p>Select your preferences and start a new match.</p>
                <div className="flex-center mt-6">
                   {/* PURPOSE: Opens the game setup modal when clicked. */}
                   <button className="btn-accent" onClick={() => setShowSetup(true)}>
                     New Match
                   </button>
                </div>
              </div>
            ) : (
              /* PURPOSE: Renders the interactive chess board with all game configuration. */
              /* IMPACT: Passes game settings, move callbacks, chat data, and user info to ChessBoard. */
              <ChessBoard 
                {...gameConfig}            // Spreads: gameId, gameMode, difficulty, playerColor, matchDuration
                lastMove={lastMove}        // The last move received from the opponent via WebSocket.
                onMoveMade={sendMove}      // Callback to send moves to the backend via WebSocket.
                chats={chats || []}        // Array of chat messages for the chat panel.
                sendChat={sendChat}        // Callback to send chat messages via WebSocket.
                currentUser={user}         // The logged-in user's data (for name display).
                onGameOver={(result) => {  // Callback when the game ends (checkmate, resign, timeout).
                  setGameConfig(null);     // Returns to the welcome screen.
                  fetchMatchHistory();     // Refreshes match history to include the just-finished game.
                }} 
              />
            )}
          </div>
        )}

        {/* ==================== HISTORY TAB ==================== */}
        {/* PURPOSE: Renders the "History" view — match list or a specific match replay. */}
        {activeTab === 'history' && (
          <div className="history-section glass-container animate-fade-in">
            <h2 className="section-title">Match History</h2>
            {/* PURPOSE: If a match is selected, show the replay board. Otherwise, show the list. */}
            {selectedMatch ? (
              <ReplayBoard 
                matchId={selectedMatch.id} 
                moves={selectedMatch.moves ? selectedMatch.moves.map(m => m.san) : []}
                onBack={() => setSelectedMatch(null)} // Back button returns to the list.
              />
            ) : (
              <div className="history-list">
                {/* PURPOSE: Shows a message if no matches have been played yet. */}
                {matchHistory.length === 0 ? (
                  <p className="p-8 text-center text-secondary">No matches played yet. Go play!</p>
                ) : (
                  /* PURPOSE: Renders a card for each past match. */
                  matchHistory.map((match) => (
                    <div key={match.id} className="history-card">
                      <div className="match-info">
                        {/* PURPOSE: Displays the match date. */}
                        <span className="match-date">{new Date(match.startTime).toLocaleDateString()}</span>
                        {/* PURPOSE: Displays the opponent (currently shows AI difficulty). */}
                        <span className="match-opponent">vs AI ({match.difficulty || 'Easy'})</span>
                      </div>
                      <div className="match-actions">
                         {/* PURPOSE: Shows win/loss badge with appropriate color. */}
                         <span className={`result-tag ${match.result === 'WIN' ? 'win' : 'loss'}`}>
                           {match.result || 'In Progress'}
                         </span>
                         {/* PURPOSE: Review button — opens the match in the replay view. */}
                         <button 
                           className="btn-ghost"
                           onClick={() => setSelectedMatch(match)}
                         >
                           Review <ChevronRight size={16} />
                         </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TRAINING TAB ==================== */}
        {/* PURPOSE: Renders the "Training" view — tactical puzzle interface. */}
        {activeTab === 'training' && (
          <div className="training-section animate-fade-in">
            <h2 className="section-title">Tactical Training</h2>
            {/* PURPOSE: If a puzzle is loaded, show the PuzzleBoard. Otherwise, show a loading spinner. */}
            {selectedPuzzle ? (
              <PuzzleBoard 
                puzzle={selectedPuzzle}     // The puzzle data (FEN, solution, description, difficulty).
                onNext={fetchDailyPuzzle}   // Callback for "Next Puzzle" button — fetches a new puzzle.
                onBack={() => setActiveTab('play')} // Back button returns to the Play tab.
              />
            ) : (
              <div className="loading-state text-center p-12 glass-container">
                 <div className="spinner mb-4" />
                 <p>Finding the perfect challenge for you...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== GAME SETUP MODAL ==================== */}
      {/* PURPOSE: Modal overlay for configuring a new game (mode, color, room code, duration). */}
      {/* IMPACT: Shown when showSetup is true. Closes on "Cancel" or "Challenge" button click. */}
      {showSetup && (
        <div className="setup-modal-overlay">
           <div className="glass-container setup-card">
              <h2 className="text-center mb-6">Game Setup</h2>
              
              {/* PURPOSE: Game mode selector — VS Bot or Multiplayer. */}
              <div className="setup-section">
                 <label>Game Mode</label>
                 <div className="option-grid">
                    {/* PURPOSE: AI mode button — play against the computer. */}
                    <button className={`option-btn ${gameMode === 'ai' ? 'active' : ''}`} onClick={() => setGameMode('ai')}>VS Bot</button>
                    {/* PURPOSE: Multiplayer mode button — play against another human via WebSocket. */}
                    <button className={`option-btn ${gameMode === 'multiplayer' ? 'active' : ''}`} onClick={() => setGameMode('multiplayer')}>Multiplayer</button>
                 </div>
              </div>

              {/* PURPOSE: Difficulty selector — only shown in AI mode. */}
              {gameMode === 'ai' && (
                <div className="setup-section">
                  <label>Difficulty</label>
                  <div className="option-grid-3">
                      <button className={`option-btn ${difficulty === 'easy' ? 'active' : ''}`} onClick={() => setDifficulty('easy')}>Easy</button>
                      <button className={`option-btn ${difficulty === 'medium' ? 'active' : ''}`} onClick={() => setDifficulty('medium')}>Medium</button>
                      <button className={`option-btn ${difficulty === 'hard' ? 'active' : ''}`} onClick={() => setDifficulty('hard')}>Hard</button>
                  </div>
                </div>
              )}

              {/* PURPOSE: Room code input — only shown in multiplayer mode. */}
              {/* IMPACT: Both players must enter the same code to join the same game room. */}
              {gameMode === 'multiplayer' && (
                <div className="setup-section" style={{ marginTop: '0.5rem' }}>
                  <label>Room Code (Required)</label>
                  <input 
                     type="text" 
                     value={joinCode}
                     onChange={(e) => setJoinCode(e.target.value)}
                     placeholder="e.g. chess-room-1"
                     style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Enter a shared room code to play together</p>
                </div>
              )}

              {/* PURPOSE: Color picker — White, Black, or Random. */}
              <div className="setup-section">
                 <label>Your Color</label>
                 <div className="option-grid-3">
                    <button className={`option-btn ${playerColor === 'white' ? 'active' : ''}`} onClick={() => setPlayerColor('white')}>White</button>
                    <button className={`option-btn ${playerColor === 'black' ? 'active' : ''}`} onClick={() => setPlayerColor('black')}>Black</button>
                    <button className={`option-btn ${playerColor === 'random' ? 'active' : ''}`} onClick={() => setPlayerColor('random')}>Random</button>
                 </div>
              </div>

              {/* PURPOSE: Match duration input — sets the chess clock time in minutes. */}
              <div className="setup-section">
                  <label>Duration (Minutes)</label>
                  <input 
                     type="number" 
                     value={matchDuration}
                     onChange={(e) => setMatchDuration(Math.max(1, parseInt(e.target.value) || 1))}
                     min="1"
                     max="60"
                     style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
              </div>

              {/* PURPOSE: Challenge button — confirms game setup and starts the game. */}
              {/* IMPACT: Disabled if multiplayer mode but no room code entered. */}
              <div className="flex-center mt-8">
                <button 
                  className="btn-accent w-full" 
                  onClick={confirmStartGame}
                  disabled={gameMode === 'multiplayer' && joinCode.trim() === ''}
                  style={gameMode === 'multiplayer' && joinCode.trim() === '' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  Challenge
                </button>
              </div>
              {/* PURPOSE: Cancel button — closes the setup modal without starting a game. */}
              <button className="btn-ghost w-full mt-2" onClick={() => setShowSetup(false)}>Cancel</button>
           </div>
        </div>
      )}
    </div>
  );
}

// PURPOSE: Exports the App component as the default export for use in main.jsx.
export default App;
