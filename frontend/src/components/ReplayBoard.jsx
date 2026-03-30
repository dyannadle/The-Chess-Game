import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ChevronLeft, ChevronRight, Download, RotateCcw } from 'lucide-react';

const ReplayBoard = ({ matchId, moves = [], onBack }) => {
  const [game, setGame] = useState(new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  // Initialize game
  useEffect(() => {
    setGame(new Chess());
  }, []);

  const goToMove = (index) => {
    const newGame = new Chess();
    for (let i = 0; i <= index; i++) {
      newGame.move(moves[i]);
    }
    setGame(newGame);
    setCurrentMoveIndex(index);
  };

  const nextMove = () => {
    if (currentMoveIndex < moves.length - 1) {
      goToMove(currentMoveIndex + 1);
    }
  };

  const prevMove = () => {
    if (currentMoveIndex >= 0) {
      goToMove(currentMoveIndex - 1);
    }
  };

  const reset = () => {
    setGame(new Chess());
    setCurrentMoveIndex(-1);
  };

  const downloadPgn = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api/matches/${matchId}/pgn`;
  };

  return (
    <div className="replay-container glass-container">
      <div className="replay-header">
        <button className="btn-secondary" onClick={onBack}>
          <ChevronLeft size={18} /> Back to History
        </button>
        <h3>Match Replay #{matchId}</h3>
        <button className="btn-accent" onClick={downloadPgn}>
          <Download size={18} /> Download PGN
        </button>
      </div>

      <div className="replay-main">
        <div className="board-wrapper shadow-xl">
          <Chessboard 
            position={game.fen()} 
            arePiecesDraggable={false}
            customDarkSquareStyle={{ backgroundColor: '#2e3440' }}
            customLightSquareStyle={{ backgroundColor: '#4c566a' }}
          />
        </div>

        <div className="replay-controls">
          <div className="move-info">
            <span className="text-secondary">Move: {currentMoveIndex + 1} / {moves.length}</span>
            <span className="text-accent">{currentMoveIndex >= 0 ? moves[currentMoveIndex] : 'Start'}</span>
          </div>

          <div className="control-buttons">
            <button className="icon-btn" onClick={reset} disabled={currentMoveIndex === -1}>
              <RotateCcw size={24} />
            </button>
            <button className="icon-btn" onClick={prevMove} disabled={currentMoveIndex === -1}>
              <ChevronLeft size={32} />
            </button>
            <button className="icon-btn" onClick={nextMove} disabled={currentMoveIndex === moves.length - 1}>
              <ChevronRight size={32} />
            </button>
          </div>

          <div className="move-history-scroll">
            {moves.map((move, idx) => (
              <span 
                key={idx} 
                className={`move-chip ${idx === currentMoveIndex ? 'active' : ''}`}
                onClick={() => goToMove(idx)}
              >
                {move}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplayBoard;
