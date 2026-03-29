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
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-4 md:p-8 glass shadow-2xl">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium text-gray-400">White's Turn</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">Black's Turn</span>
            <div className={`w-3 h-3 rounded-full ${game.turn() === 'b' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
        </div>
      </div>

      <div className="w-full aspect-square relative rounded-lg overflow-hidden border-4 border-gray-800 shadow-inner bg-slate-900">
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

      <div className="w-full mt-4 flex flex-col gap-3">
        {game.isGameOver() && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3 text-yellow-500">
            <Trophy className="w-6 h-6" />
            <div className="flex-1">
              <p className="font-bold">Game Over!</p>
              <p className="text-sm">
                {game.isCheckmate() ? 'Checkmate!' : 
                 game.isDraw() ? 'Draw!' : 
                 game.isStalemate() ? 'Stalemate!' : 'Game ended.'}
              </p>
            </div>
            <button 
                onClick={() => setGame(new Chess())}
                className="p-2 hover:bg-yellow-500/20 rounded-full transition-colors"
                title="Restart"
            >
                <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {game.inCheck() && !game.isGameOver() && (
           <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-500">
             <AlertCircle className="w-5 h-5" />
             <p className="font-semibold">Check!</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default ChessBoard;
