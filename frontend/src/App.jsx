import React, { useState, useEffect } from 'react';
import ChessBoard from './components/ChessBoard';
import { useGameSocket } from './hooks/useGameSocket';
import { Shield, Users, Radio, MessageSquare, History, Trophy } from 'lucide-react';

function App() {
  const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
  const pieceSymbols = {
    w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
    b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
  };

  const [gameId, setGameId] = useState('');
  const [joined, setJoined] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  
  const [chatInput, setChatInput] = useState('');
  const [chats, setChats] = useState([]);
  const [history, setHistory] = useState([]);

  const { connected, sendMove, sendChat } = useGameSocket(
      joined ? gameId : null, 
      (move) => setLastMove(move),
      (chat) => setChats(prev => [...prev, chat])
  );

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (gameId.trim()) {
      setJoined(true);
    }
  };

  const onMoveMade = (moveData) => {
    sendMove(moveData);
  };
  
  const handleSendChat = (e) => {
      e.preventDefault();
      if (chatInput.trim()) {
          sendChat({ sender: 'Player', text: chatInput });
          setChatInput('');
      }
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
        <ChessBoard gameId={gameId} onMoveMade={onMoveMade} lastMove={lastMove} onHistoryUpdate={setHistory} />
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
