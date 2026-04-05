// PURPOSE: The React component for the match review/replay feature ("History" tab).
// IMPACT: Uses a list of stored moves (SAN notation) to reconstruct past games step by step.
//         Provides next/prev/reset controls to navigate through a completed match.
// ALTERNATIVE: Rely on external PGN viewers instead of building a replay viewer in-app.

// PURPOSE: Imports React, useState (for current move index), and useEffect (for move application).
import { useState, useEffect } from 'react';

// PURPOSE: Imports chess.js to replay the historical moves on a virtual board.
import { Chess } from 'chess.js';

// PURPOSE: Imports react-chessboard to render the board state.
import { Chessboard } from 'react-chessboard';

// PURPOSE: Imports Lucide icon components for playback controls and UI navigation.
import { SkipBack, ChevronLeft, ChevronRight, SkipForward, ArrowLeft, Download } from 'lucide-react';

// PURPOSE: Component for replaying past matches.
// IMPACT: Receives moves array (e.g., ["e4", "e5", "Nf3"]), matchId (for PGN download), and onBack.
const ReplayBoard = ({ moves = [], matchId, onBack }) => {
  // PURPOSE: The chess.js instance reflecting the board state at the current move index.
  const [game, setGame] = useState(new Chess());

  // PURPOSE: The index of the current move being viewed.
  // IMPACT: -1 = start position, 0 = after first move (White), 1 = after second move (Black).
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  // PURPOSE: Effect that recalculates the board position whenever the move index changes.
  // IMPACT: Since chess.js doesn't easily support moving "backwards", this re-applies all moves
  //         from the start position up to the currentMoveIndex every time the user clicks Next/Prev.
  //         This is fast enough for standard chess games (< 200 moves).
  // ALTERNATIVE: Cache FEN strings at every move index instead of recalculating from start.
  useEffect(() => {
    const newGame = new Chess();
    // PURPOSE: Loop through the move array up to the specifically selected index.
    for (let i = 0; i <= currentMoveIndex; i++) {
        try {
           // PURPOSE: Applies the historical SAN move (e.g., "e4") to the board.
           newGame.move(moves[i]);
        } catch(e) {
           // PURPOSE: Fails silently if the DB move is corrupted (prevents full crash).
           console.error("Move parsing error in replay", e);
        }
    }
    // PURPOSE: Update the visual board to match the replayed position.
    setGame(newGame);
  }, [currentMoveIndex, moves]);

  // PURPOSE: Event handlers for the playback controls (Next, Prev, First, Last).
  // IMPACT: They update the currentMoveIndex state, which triggers the useEffect above.

  // PURPOSE: Go back to the very first move (starting position).
  const goToStart = () => setCurrentMoveIndex(-1);
  
  // PURPOSE: Go back one single move in history, ensuring we don't go below -1.
  const goPrev = () => setCurrentMoveIndex(p => Math.max(-1, p - 1));
  
  // PURPOSE: Go forward one single move, ensuring we don't go past the last move.
  const goNext = () => setCurrentMoveIndex(p => Math.min(moves.length - 1, p + 1));
  
  // PURPOSE: Go to the very last move (end of the game).
  const goToEnd = () => setCurrentMoveIndex(moves.length - 1);

  // PURPOSE: Pre-calculates the move pairs (White/Black) for the move history list UI.
  // IMPACT: Same logic as in ChessBoard.jsx. Converts sequential array into an array of paired objects.
  const getMovePairs = () => {
    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1, // Move turn number.
        white: moves[i],                 // White's move SAN.
        black: moves[i + 1],             // Black's move SAN (might be undefined).
        whiteIdx: i,                     // Absolute index of white's move.
        blackIdx: i + 1                  // Absolute index of black's move.
      });
    }
    return pairs;
  };

  return (
    <div className="replay-main">
      {/* LEFT SIDE: Replay Board and Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* PURPOSE: Header with Back button and Replay title. */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <button onClick={onBack} className="btn-ghost" style={{ padding: '0.5rem 0' }}>
                <ArrowLeft size={18} /> Back to History
             </button>
             <h3 style={{ margin: 0, fontWeight: '600' }}>Match Replay</h3>
          </div>

          {/* PURPOSE: Non-interactive chess board showing the historical position. */}
          {/* IMPACT: No onPieceDrop handler — users cannot make moves here. */}
          <div className="board-wrapper">
             <Chessboard 
               id="ReplayBoard"
               position={game.fen()}               // Display the game at the currentMoveIndex.
               customDarkSquareStyle={{ backgroundColor: '#2d333b' }}
               customLightSquareStyle={{ backgroundColor: '#444c56' }}
               animationDuration={200}             // Faster animation for skipping through moves.
             />
          </div>

          {/* PURPOSE: Playback control buttons (First, Prev, Next, Last). */}
          <div className="flex-center" style={{ gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              {/* SkipBack (First Move) */}
              <button className="btn-secondary" onClick={goToStart} disabled={currentMoveIndex === -1}>
                 <SkipBack size={20} />
              </button>
              {/* ChevronLeft (Previous Move) */}
              <button className="btn-secondary" onClick={goPrev} disabled={currentMoveIndex === -1}>
                 <ChevronLeft size={24} />
              </button>
              {/* ChevronRight (Next Move) */}
              <button className="btn-secondary" onClick={goNext} disabled={currentMoveIndex === moves.length - 1}>
                 <ChevronRight size={24} />
              </button>
              {/* SkipForward (Last Move) */}
              <button className="btn-secondary" onClick={goToEnd} disabled={currentMoveIndex === moves.length - 1}>
                 <SkipForward size={20} />
              </button>
          </div>
      </div>

      {/* RIGHT SIDE: Interactive Move List and Export */}
      <div className="status-box glass-container" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* PURPOSE: Download PGN button pointing to the backend API endpoint. */}
          {/* IMPACT: Hitting this URL triggers the browser to download the text file generated by MatchController. */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <a 
                href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api/matches/${matchId}/pgn`} 
                download
                className="btn-ghost"
                style={{ color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
              >
                  <Download size={16} /> Export PGN
              </a>
          </div>

          {/* PURPOSE: Scrollable move history panel. */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
              <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Move List</h4>
              
              <div className="move-history-scroll" style={{ background: 'transparent', padding: 0 }}>
                 {/* PURPOSE: Iterates through the move pairs and renders clickable move chips. */}
                 {getMovePairs().map((pair) => (
                    <div key={pair.number} style={{ display: 'flex', width: '100%', marginBottom: '0.5rem', alignItems: 'center' }}>
                       {/* Move Number */}
                       <span style={{ color: '#64748b', width: '30px', fontWeight: 'bold', fontSize: '0.9rem' }}>{pair.number}.</span>
                       
                       <div style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
                         {/* PURPOSE: White move chip. Clicking it jumps the board directly to this move. */}
                         {/* IMPACT: Appends 'active' class if this is the currently viewed move. */}
                         <button 
                           className={`move-chip ${currentMoveIndex === pair.whiteIdx ? 'active' : ''}`}
                           style={{ flex: 1, border: 'none', textAlign: 'center' }}
                           onClick={() => setCurrentMoveIndex(pair.whiteIdx)}
                         >
                           {pair.white}
                         </button>
                         
                         {/* PURPOSE: Black move chip. Works same as white. */}
                         {pair.black ? (
                             <button 
                               className={`move-chip ${currentMoveIndex === pair.blackIdx ? 'active' : ''}`}
                               style={{ flex: 1, border: 'none', textAlign: 'center' }}
                               onClick={() => setCurrentMoveIndex(pair.blackIdx)}
                             >
                               {pair.black}
                             </button>
                         ) : <div style={{ flex: 1 }} />} {/* Empty spacer if game ended on white's move. */}
                       </div>
                    </div>
                 ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default ReplayBoard;
