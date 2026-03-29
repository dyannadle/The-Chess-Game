import React, { useState, useEffect } from 'react';
import ChessBoard from './components/ChessBoard';
import { useGameSocket } from './hooks/useGameSocket';
import { Shield, Users, Radio, MessageSquare, History, Trophy } from 'lucide-react';

function App() {
  const [gameId, setGameId] = useState('');
  const [joined, setJoined] = useState(false);
  const [lastMove, setLastMove] = useState(null);

  const { connected, sendMove } = useGameSocket(joined ? gameId : null, (move) => {
    setLastMove(move);
  });

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (gameId.trim()) {
      setJoined(true);
    }
  };

  const onMoveMade = (moveData) => {
    sendMove(moveData);
  };

  if (!joined) {
    return (
      <div className="app-container">
        <div className="header-title-wrapper">
            <Trophy className="title-icon" />
            <h1 className="main-title gradient-text">GrandMaster</h1>
        </div>
        
        <div className="glass join-card">
          <div className="join-card-header">
             <h2 className="join-card-title">Multiplayer Chess</h2>
             <p className="join-card-subtitle">Enter a room ID to challenge your opponent</p>
          </div>

          <form onSubmit={handleJoinGame} className="join-form">
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
              Start Game
            </button>
          </form>

          <div className="features-list">
            <div className="feature-item"><Users width={16} height={16} /> 2 Players</div>
            <div className="feature-item"><Radio width={16} height={16} /> Real-time</div>
            <div className="feature-item"><Shield width={16} height={16} /> Secure</div>
          </div>
        </div>
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
        <ChessBoard gameId={gameId} onMoveMade={onMoveMade} lastMove={lastMove} />
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

        {/* Feature Cards Placeholder for "Real App" feel */}
        <div className="glass feature-card">
            <div className="feature-card-header chat">
                <MessageSquare className="icon" />
                <span className="feature-card-title">Live Chat</span>
            </div>
            <div className="feature-card-placeholder">
                Chat coming soon...
            </div>
        </div>

        <div className="glass feature-card">
            <div className="feature-card-header history">
                <History className="icon" />
                <span className="feature-card-title">Move History</span>
            </div>
            <div className="feature-card-placeholder">
                Log currently empty
            </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
