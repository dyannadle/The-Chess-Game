import React, { useState, useEffect } from 'react';
import ChessBoard from './components/ChessBoard';
import Auth from './components/Auth';
import { useGameSocket } from './hooks/useGameSocket';
import { Shield, Users, Radio, MessageSquare, History, Trophy, Cpu, User as UserIcon, LogOut } from 'lucide-react';

function App() {
  const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
  const pieceSymbols = {
    w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
    b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
  };

  const [user, setUser] = useState(null);
  const [gameId, setGameId] = useState('');
  const [joined, setJoined] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  
  const [chatInput, setChatInput] = useState('');
  const [chats, setChats] = useState([]);
  const [history, setHistory] = useState([]);

  // Game Setup State
  const [showSetup, setShowSetup] = useState(false);
  const [gameMode, setGameMode] = useState('multiplayer'); // 'multiplayer' or 'ai'
  const [difficulty, setDifficulty] = useState('medium');
  const [playerColor, setPlayerColor] = useState('white');

  useEffect(() => {
    const savedUser = localStorage.getItem('chess_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const { connected, sendMove, sendChat } = useGameSocket(
      joined ? gameId : null, 
      (move) => setLastMove(move),
      (chat) => setChats(prev => [...prev, chat])
  );

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('chess_user');
    setUser(null);
    setJoined(false);
  };

  const handleStartGameSetup = (e) => {
    e.preventDefault();
    if (gameId.trim()) {
      setShowSetup(true);
    }
  };

  const confirmStartGame = () => {
    let finalColor = playerColor;
    if (playerColor === 'random') {
      finalColor = Math.random() > 0.5 ? 'white' : 'black';
    }
    setPlayerColor(finalColor);
    setShowSetup(false);
    setJoined(true);
  };

  const onMoveMade = (moveData) => {
    if (gameMode === 'multiplayer') {
      sendMove(moveData);
    }
  };
  
  const handleSendChat = (e) => {
      e.preventDefault();
      if (chatInput.trim()) {
          sendChat({ sender: user.username, text: chatInput });
          setChatInput('');
      }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (!joined) {
    return (
      <div className="app-container">
        <div className="header-title-wrapper">
            <Trophy className="title-icon" />
            <h1 className="main-title gradient-text">GrandMaster</h1>
        </div>

        {/* User Info Header */}
        <div className="glass" style={{ marginBottom: '2rem', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <UserIcon size={20} className="gradient-text" />
           <span style={{ fontWeight: 700 }}>{user.username}</span>
           <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Wins: {user.wins}</span>
           <button onClick={handleLogout} className="auth-switch-btn" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogOut size={16} /> Logout
           </button>
        </div>
        
        <div className="glass join-card">
          <div className="join-card-header">
             <h2 className="join-card-title">Multiplayer Chess</h2>
             <p className="join-card-subtitle">Enter a room ID to challenge your opponent</p>
          </div>

          <form onSubmit={handleStartGameSetup} className="join-form">
            <div className="input-group">
              <label className="input-label">Room ID</label>
              <input
                type="text"
                placeholder="e.g. chess-123"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <button
              type="submit"
              className="submit-btn"
            >
              Configure Game
            </button>
          </form>

          <div className="features-list">
            <div className="feature-item"><Users width={16} height={16} /> Online</div>
            <div className="feature-item"><Cpu width={16} height={16} /> AI Bot</div>
            <div className="feature-item"><Trophy width={16} height={16} /> Ranked</div>
          </div>
        </div>

        {showSetup && (
          <div className="setup-modal-overlay">
             <div className="glass setup-card">
                <div className="auth-header">
                   <h2 className="auth-title">Game Setup</h2>
                   <p className="join-card-subtitle">Customize your match before entering</p>
                </div>

                <div className="setup-section">
                   <label className="setup-label">Game Mode</label>
                   <div className="option-grid">
                      <button 
                        className={`option-btn ${gameMode === 'multiplayer' ? 'active' : ''}`}
                        onClick={() => setGameMode('multiplayer')}
                      >
                         <Users size={20} /> Multiplayer
                      </button>
                      <button 
                         className={`option-btn ${gameMode === 'ai' ? 'active' : ''}`}
                         onClick={() => setGameMode('ai')}
                      >
                         <Cpu size={20} /> VS Engine
                      </button>
                   </div>
                </div>

                {gameMode === 'ai' && (
                  <div className="setup-section">
                    <label className="setup-label">Difficulty</label>
                    <div className="option-grid">
                        <button className={`option-btn ${difficulty === 'easy' ? 'active' : ''}`} onClick={() => setDifficulty('easy')}>Easy</button>
                        <button className={`option-btn ${difficulty === 'medium' ? 'active' : ''}`} onClick={() => setDifficulty('medium')}>Medium</button>
                        <button className={`option-btn ${difficulty === 'hard' ? 'active' : ''}`} onClick={() => setDifficulty('hard')}>Hard</button>
                    </div>
                  </div>
                )}

                <div className="setup-section">
                   <label className="setup-label">Your Color</label>
                   <div className="option-grid">
                      <button className={`option-btn ${playerColor === 'white' ? 'active' : ''}`} onClick={() => setPlayerColor('white')}>White</button>
                      <button className={`option-btn ${playerColor === 'black' ? 'active' : ''}`} onClick={() => setPlayerColor('black')}>Black</button>
                      <button className={`option-btn ${playerColor === 'random' ? 'active' : ''}`} onClick={() => setPlayerColor('random')}>Random</button>
                   </div>
                </div>

                <button className="submit-btn" onClick={confirmStartGame}>Enter Room</button>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="game-layout">
      {/* Header for Mobile */}
      <header className="glass mobile-header">
          <h1 className="mobile-title gradient-text">GrandMaster</h1>
          <div className="status-indicator">
              <div className={`status-dot ${connected ? 'online' : 'offline pulsate'}`} />
              <span className="status-text">{connected ? 'Online' : 'Reconnecting...'}</span>
          </div>
      </header>

      {/* Main Board Section */}
      <div className="main-board-section">
        <ChessBoard 
          gameId={gameId} 
          onMoveMade={onMoveMade} 
          lastMove={lastMove} 
          onHistoryUpdate={setHistory}
          gameMode={gameMode}
          difficulty={difficulty}
          playerColor={playerColor}
        />
      </div>

      {/* Sidebar Info */}
      <aside className="sidebar">
        {/* Connection Status Desktop */}
        <div className="glass desktop-status">
            <div className="session-info">
                <span className="session-label">Session</span>
                <span className="session-id">{gameId}</span>
            </div>
            <div className="status-indicator">
                <span className="status-text">{connected ? 'Live Sync' : 'Connecting'}</span>
                <div className={`status-dot ${connected ? 'online' : 'offline pulsate'}`} />
            </div>
        </div>

        {/* Live Chat */}
        <div className="glass feature-card chat-area">
            <div className="feature-card-header chat">
                <MessageSquare className="icon" />
                <span className="feature-card-title">Live Chat</span>
            </div>
            <div className="chat-messages">
                {chats.length === 0 ? (
                    <div className="feature-card-placeholder">No messages yet. Say hi!</div>
                ) : (
                    chats.map((c, i) => (
                        <div key={i} className="chat-message">
                            <strong>{c.sender}:</strong> <span>{c.text}</span>
                        </div>
                    ))
                )}
            </div>
            <form onSubmit={handleSendChat} className="chat-input-form">
               <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="chat-input"
                  required
               />
               <button type="submit" className="chat-submit-btn">Send</button>
            </form>
        </div>

        {/* Move History */}
        <div className="glass feature-card history-area">
            <div className="feature-card-header history">
                <History className="icon" />
                <span className="feature-card-title">Move History</span>
            </div>
            <div className="history-list">
              {history.length === 0 ? (
                 <div className="feature-card-placeholder">Log currently empty</div>
              ) : (
                <div className="history-timeline">
                  {history.map((m, i) => (
                    <div key={i} className={`history-timeline-item ${m.color === 'w' ? 'white-move' : 'black-move'}`}>
                      <div className="timeline-number">{Math.floor(i/2) + 1}</div>
                      
                      <div className="timeline-content">
                         <div className="timeline-header">
                            <span className="timeline-icon">{pieceSymbols[m.color][m.piece]}</span>
                            <span className="timeline-text">
                              {m.color === 'w' ? 'White' : 'Black'} {pieceNames[m.piece]}
                            </span>
                         </div>
                         <div className="timeline-squares">
                            <span className="square-badge">{m.from}</span>
                            <span className="arrow">➔</span>
                            <span className="square-badge">{m.to}</span>
                         </div>
                      </div>

                      <div className="timeline-badges">
                         {m.captured && <span className="badge capture">Takes {pieceNames[m.captured]}</span>}
                         {m.san.includes('+') && <span className="badge check">Check</span>}
                         {m.san.includes('#') && <span className="badge mate">Mate</span>}
                         {m.san === 'O-O' && <span className="badge action">Kingside Castle</span>}
                         {m.san === 'O-O-O' && <span className="badge action">Queenside Castle</span>}
                         {m.promotion && <span className="badge action">Promotes to {pieceNames[m.promotion]}</span>}
                      </div>

                      <div className="timeline-san">{m.san}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
