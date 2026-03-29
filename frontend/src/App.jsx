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
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0d1117] text-white">
        <div className="flex items-center gap-3 mb-8 animate-bounce">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <h1 className="text-4xl md:text-6xl font-black gradient-text">GrandMaster</h1>
        </div>
        
        <div className="glass p-8 w-full max-w-md flex flex-col items-center gap-6 shadow-2xl">
          <div className="flex flex-col gap-2 text-center">
             <h2 className="text-2xl font-bold">Multiplayer Chess</h2>
             <p className="text-gray-400 text-sm">Enter a room ID to challenge your opponent</p>
          </div>

          <form onSubmit={handleJoinGame} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Room ID</label>
              <input
                type="text"
                placeholder="e.g. chess-123"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-mono"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-green-500/20"
            >
              Start Game
            </button>
          </form>

          <div className="flex gap-4 items-center opacity-50 text-xs">
            <div className="flex items-center gap-1"><Users className="w-4 h-4" /> 2 Players</div>
            <div className="flex items-center gap-1"><Radio className="w-4 h-4" /> Real-time</div>
            <div className="flex items-center gap-1"><Shield className="w-4 h-4" /> Secure</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center min-h-screen p-4 lg:p-12 gap-8 bg-[#0d1117] text-white">
      {/* Header for Mobile */}
      <header className="lg:hidden w-full flex justify-between items-center glass p-4 mb-4">
          <h1 className="text-xl font-black gradient-text">GrandMaster</h1>
          <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500 '}`} />
              <span className="text-xs uppercase tracking-widest text-gray-400">{connected ? 'Online' : 'Reconnecting...'}</span>
          </div>
      </header>

      {/* Main Board Section */}
      <div className="flex-1 w-full flex flex-col gap-6">
        <ChessBoard gameId={gameId} onMoveMade={onMoveMade} lastMove={lastMove} />
      </div>

      {/* Sidebar Info */}
      <aside className="w-full lg:w-80 flex flex-col gap-4">
        {/* Connection Status Desktop */}
        <div className="hidden lg:flex items-center justify-between glass p-4">
            <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-tighter font-bold">Session</span>
                <span className="font-mono text-sm text-green-400">{gameId}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{connected ? 'Live Sync' : 'Connecting'}</span>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500 pulsate'}`} />
            </div>
        </div>

        {/* Feature Cards Placeholder for "Real App" feel */}
        <div className="glass p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <span className="font-bold">Live Chat</span>
            </div>
            <div className="h-32 bg-white/5 rounded-lg flex items-center justify-center text-gray-600 italic text-sm">
                Chat coming soon...
            </div>
        </div>

        <div className="glass p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-purple-400" />
                <span className="font-bold">Move History</span>
            </div>
            <div className="h-32 bg-white/5 rounded-lg flex items-center justify-center text-gray-600 italic text-sm">
                Log currently empty
            </div>
        </div>
      </aside>

      <style dangerouslySetInnerHTML={{ __html: `
        .pulsate {
          animation: pulse 1s infinite alternate;
        }
        @keyframes pulse {
          from { opacity: 0.3; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}

export default App;
