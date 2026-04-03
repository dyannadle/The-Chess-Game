import React, { useState, useEffect } from 'react';
import ChessBoard from './components/ChessBoard';
import ReplayBoard from './components/ReplayBoard';
import PuzzleBoard from './components/PuzzleBoard';
import Auth from './components/Auth';
import { useGameSocket } from './hooks/useGameSocket';
import { Trophy, History, Shield, Play, LogOut, ChevronRight, User as UserIcon, Lightbulb } from 'lucide-react';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [gameId, setGameId] = useState('match-' + Math.floor(Math.random() * 1000));
  const [joined, setJoined] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [chats, setChats] = useState([]);
  
  // Game Setup State
  const [showSetup, setShowSetup] = useState(false);
  const [gameMode, setGameMode] = useState('multiplayer');
  const [difficulty, setDifficulty] = useState('medium');
  const [playerColor, setPlayerColor] = useState('white');
  const [joinCode, setJoinCode] = useState('');
  const [gameConfig, setGameConfig] = useState(null);

  const [activeTab, setActiveTab] = useState('play'); // play, history, training
  const [matchHistory, setMatchHistory] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_BACKEND_URL;
    if (envUrl && envUrl.trim() !== '') return envUrl.replace(/\/$/, '');
    return 'http://localhost:8080';
  };

  const API_URL = getApiUrl();

  useEffect(() => {
    const savedUser = localStorage.getItem('chess_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMatchHistory();
    }
  }, [user]);

  const fetchMatchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/matches/user/${user.id}`);
      setMatchHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchDailyPuzzle = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/puzzles/daily`);
      setSelectedPuzzle(response.data);
      setActiveTab('training');
    } catch (error) {
      console.error('Error fetching puzzle:', error);
    }
  };

  const { connected, sendMove, sendChat } = useGameSocket(
      joined ? gameId : null, 
      (move) => setLastMove(move),
      (chat) => setChats(prev => [...prev, chat])
  );

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('chess_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('chess_user');
    setUser(null);
    setJoined(false);
  };

  const confirmStartGame = () => {
    let finalColor = playerColor;
    if (playerColor === 'random') {
      finalColor = Math.random() > 0.5 ? 'white' : 'black';
    }
    
    // Choose specific room if provided, else create a random room code
    const targetGameId = (gameMode === 'multiplayer')
      ? joinCode.trim()
      : 'match-' + Math.floor(Math.random() * 10000);

    setGameId(targetGameId);
    setPlayerColor(finalColor);
    setGameConfig({ gameId: targetGameId, gameMode, difficulty, playerColor: finalColor });
    setShowSetup(false);
    setJoined(true);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <nav className="sidebar-nav">
        <div className="nav-logo">GrandMaster</div>
        <button 
          className={`nav-item ${activeTab === 'play' ? 'active' : ''}`} 
          onClick={() => setActiveTab('play')}
        >
          <Play size={20} /> Play
        </button>
        <button 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => {
            setActiveTab('history');
            setSelectedMatch(null);
          }}
        >
          <History size={20} /> History
        </button>
        <button 
          className={`nav-item ${activeTab === 'training' ? 'active' : ''}`} 
          onClick={fetchDailyPuzzle}
        >
          <Lightbulb size={20} /> Training
        </button>
        <div className="nav-footer">
          <div className="user-profile">
            <UserIcon size={18} />
            <span>{user.username}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <div className="app-main">
        {activeTab === 'play' && (
          <div className="game-section">
            {!gameConfig ? (
              <div className="setup-welcome glass-container">
                <Trophy size={48} className="text-accent mb-4" />
                <h2>Ready to prove your skill?</h2>
                <p>Select your preferences and start a new match.</p>
                <div className="flex-center mt-6">
                   <button className="btn-accent" onClick={() => setShowSetup(true)}>
                     New Match
                   </button>
                </div>
              </div>
            ) : (
              <ChessBoard 
                {...gameConfig}
                lastMove={lastMove}
                onMoveMade={sendMove}
                chats={chats || []}
                sendChat={sendChat}
                currentUser={user}
                onGameOver={(result) => {
                  setGameConfig(null);
                  fetchMatchHistory();
                }} 
              />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section glass-container animate-fade-in">
            <h2 className="section-title">Match History</h2>
            {selectedMatch ? (
              <ReplayBoard 
                matchId={selectedMatch.id} 
                moves={selectedMatch.moves ? selectedMatch.moves.map(m => m.san) : []}
                onBack={() => setSelectedMatch(null)}
              />
            ) : (
              <div className="history-list">
                {matchHistory.length === 0 ? (
                  <p className="p-8 text-center text-secondary">No matches played yet. Go play!</p>
                ) : (
                  matchHistory.map((match) => (
                    <div key={match.id} className="history-card">
                      <div className="match-info">
                        <span className="match-date">{new Date(match.startTime).toLocaleDateString()}</span>
                        <span className="match-opponent">vs AI ({match.difficulty || 'Easy'})</span>
                      </div>
                      <div className="match-actions">
                         <span className={`result-tag ${match.result === 'WIN' ? 'win' : 'loss'}`}>
                           {match.result || 'In Progress'}
                         </span>
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

        {activeTab === 'training' && (
          <div className="training-section animate-fade-in">
            <h2 className="section-title">Tactical Training</h2>
            {selectedPuzzle ? (
              <PuzzleBoard 
                puzzle={selectedPuzzle}
                onNext={fetchDailyPuzzle}
                onBack={() => setActiveTab('play')}
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

      {showSetup && (
        <div className="setup-modal-overlay">
           <div className="glass-container setup-card">
              <h2 className="text-center mb-6">Game Setup</h2>
              
              <div className="setup-section">
                 <label>Game Mode</label>
                 <div className="option-grid">
                    <button className={`option-btn ${gameMode === 'ai' ? 'active' : ''}`} onClick={() => setGameMode('ai')}>VS Bot</button>
                    <button className={`option-btn ${gameMode === 'multiplayer' ? 'active' : ''}`} onClick={() => setGameMode('multiplayer')}>Multiplayer</button>
                 </div>
              </div>

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

              <div className="setup-section">
                 <label>Your Color</label>
                 <div className="option-grid-3">
                    <button className={`option-btn ${playerColor === 'white' ? 'active' : ''}`} onClick={() => setPlayerColor('white')}>White</button>
                    <button className={`option-btn ${playerColor === 'black' ? 'active' : ''}`} onClick={() => setPlayerColor('black')}>Black</button>
                    <button className={`option-btn ${playerColor === 'random' ? 'active' : ''}`} onClick={() => setPlayerColor('random')}>Random</button>
                 </div>
              </div>

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
              <button className="btn-ghost w-full mt-2" onClick={() => setShowSetup(false)}>Cancel</button>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;
