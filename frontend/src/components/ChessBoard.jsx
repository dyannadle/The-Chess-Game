import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';

const ChessBoard = ({ gameId, onMoveMade, lastMove, onHistoryUpdate, gameMode, difficulty, playerColor }) => {
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});

  useEffect(() => {
    if (onHistoryUpdate) {
      onHistoryUpdate(game.history({ verbose: true }));
    }
  }, [game, onHistoryUpdate]);

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = new Chess();
      update.loadPgn(g.pgn());
      modify(update);
      return update;
    });
  }

  useEffect(() => {
    if (lastMove && lastMove.gameId === gameId) {
      safeGameMutate((game) => {
        try {
          game.move({
            from: lastMove.from,
            to: lastMove.to,
            promotion: lastMove.promotion || 'q',
          });
        } catch (e) {
          console.error('Invalid move received', e);
        }
      });
    }
  }, [lastMove, gameId]);

  // AI Move logic
  useEffect(() => {
    if (gameMode === 'ai' && !game.isGameOver() && game.turn() !== playerColor[0]) {
      const timer = setTimeout(() => {
        makeAiMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game, gameMode, playerColor]);

  function makeAiMove() {
      const moves = game.moves();
      if (game.isGameOver() || moves.length === 0) return;

      let move;
      if (difficulty === 'easy') {
        move = moves[Math.floor(Math.random() * moves.length)];
      } else {
        move = moves[Math.floor(Math.random() * moves.length)]; 
        const captures = moves.filter(m => m.includes('x'));
        if (captures.length > 0 && Math.random() > 0.3) {
          move = captures[Math.floor(Math.random() * captures.length)];
        }
      }

      const gameCopy = new Chess();
      gameCopy.loadPgn(game.pgn());
      const moveResult = gameCopy.move(move);
      
      setGame(gameCopy);
      onMoveMade({
        from: moveResult.from,
        to: moveResult.to,
        fen: gameCopy.fen(),
        san: moveResult.san,
        piece: moveResult.piece,
        color: moveResult.color,
        captured: moveResult.captured
      });
  }

  function getMoveOptions(square) {
    const moves = game.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) && game.get(move.to).color !== game.get(square).color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square) {
    // from square
    if (!moveFrom) {
      const hasOptions = getMoveOptions(square);
      if (hasOptions) setMoveFrom(square);
      return;
    }

    // attempt to make move
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    try {
      const move = gameCopy.move({
        from: moveFrom,
        to: square,
        promotion: 'q',
      });

      if (move === null) {
        const hasOptions = getMoveOptions(square);
        if (hasOptions) setMoveFrom(square);
        return;
      }

      setGame(gameCopy);
      setMoveFrom('');
      setOptionSquares({});
      onMoveMade({
        from: move.from,
        to: move.to,
        fen: gameCopy.fen(),
        san: move.san,
        piece: move.piece,
        color: move.color,
        captured: move.captured
      });
    } catch (e) {
      const hasOptions = getMoveOptions(square);
      if (hasOptions) setMoveFrom(square);
      else {
        setMoveFrom('');
        setOptionSquares({});
      }
    }
  }

  function onDrop(sourceSquare, targetSquare) {
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;

      setGame(gameCopy);
      setOptionSquares({});
      onMoveMade({
        from: move.from,
        to: move.to,
        fen: gameCopy.fen(),
        san: move.san,
        piece: move.piece,
        color: move.color,
        captured: move.captured
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
            <div className={`turn-marker ${(game.turn() === 'w') ? 'active' : ''}`} />
            <span className="turn-text">White's Turn</span>
        </div>
        <div className="turn-indicator">
            <span className="turn-text">Black's Turn</span>
            <div className={`turn-marker ${(game.turn() === 'b') ? 'active' : ''}`} />
        </div>
      </div>

      <div className="board-wrapper">
        <Chessboard 
          id="MainBoard"
          position={game.fen()} 
          onPieceDrop={onDrop} 
          onSquareClick={onSquareClick}
          boardOrientation={playerColor}
          customDarkSquareStyle={{ backgroundColor: '#2d333b' }}
          customLightSquareStyle={{ backgroundColor: '#444c56' }}
          customSquareStyles={optionSquares}
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
