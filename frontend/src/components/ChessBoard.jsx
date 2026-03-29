import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';

const ChessBoard = ({ gameId, onMoveMade, lastMove }) => {
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState('');
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});

  useEffect(() => {
    if (lastMove && lastMove.gameId === gameId) {
      const gameCopy = new Chess(game.fen());
      try {
        const result = gameCopy.move({
          from: lastMove.from,
          to: lastMove.to,
          promotion: lastMove.promotion || 'q',
        });
        if (result) {
          setGame(gameCopy);
        }
      } catch (e) {
        console.error('Invalid move received:', e);
      }
    }
  }, [lastMove, gameId]);

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = new Chess(g.fen());
      modify(update);
      return update;
    });
  }

  function onDrop(sourceSquare, targetSquare) {
    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to queen for now
      });

      if (move === null) return false;

      setGame(gameCopy);
      onMoveMade({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
        fen: gameCopy.fen()
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  return (
    <div className="chessboard-container">
      <div className="turn-indicator-wrapper">
        <div className="turn-indicator">
            <div className={`turn-marker ${game.turn() === 'w' ? 'active' : ''}`} />
            <span className="turn-text">White's Turn</span>
        </div>
        <div className="turn-indicator">
            <span className="turn-text">Black's Turn</span>
            <div className={`turn-marker ${game.turn() === 'b' ? 'active' : ''}`} />
        </div>
      </div>

      <div className="board-wrapper">
        <Chessboard 
          id="MainBoard"
          position={game.fen()} 
          onPieceDrop={onDrop} 
          boardOrientation="white"
          customDarkSquareStyle={{ backgroundColor: '#2d333b' }}
          customLightSquareStyle={{ backgroundColor: '#444c56' }}
          animationDuration={300}
        />
      </div>

      <div className="status-messages">
        {game.isGameOver() && (
          <div className="status-alert game-over">
            <Trophy className="status-alert-icon" />
            <div className="status-alert-content">
              <p className="status-alert-title">Game Over!</p>
              <p className="status-alert-text">
                {game.isCheckmate() ? 'Checkmate!' : 
                 game.isDraw() ? 'Draw!' : 
                 game.isStalemate() ? 'Stalemate!' : 'Game ended.'}
              </p>
            </div>
            <button 
                onClick={() => setGame(new Chess())}
                className="restart-btn"
                title="Restart"
            >
                <RefreshCw width={20} height={20} />
            </button>
          </div>
        )}
        
        {game.inCheck() && !game.isGameOver() && (
           <div className="status-alert check">
             <AlertCircle className="status-alert-icon" />
             <p className="status-alert-title">Check!</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default ChessBoard;
