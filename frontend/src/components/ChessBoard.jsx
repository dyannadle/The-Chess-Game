import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Trophy, RefreshCw, AlertCircle, Flag, Send } from 'lucide-react';

const ChessBoard = ({ gameId, onMoveMade, lastMove, onHistoryUpdate, gameMode, difficulty, playerColor, onGameOver, chats = [], sendChat, currentUser }) => {
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});
  const [chatInput, setChatInput] = useState('');
  const chatMessagesRef = useRef(null);
  const moveHistoryRef = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chats]);

  useEffect(() => {
    if (moveHistoryRef.current) {
      moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
    }
  }, [liveMoves]);

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


  const liveMoves = game.history();

  const getMovePairs = () => {
    const pairs = [];
    for (let i = 0; i < liveMoves.length; i += 2) {
        pairs.push({
            turn: (i / 2) + 1,
            white: liveMoves[i],
            black: liveMoves[i + 1] || ''
        });
    }
    return pairs;
  };

  const handleSendChat = (e) => {
      e.preventDefault();
      if (chatInput.trim() && sendChat) {
          const senderName = currentUser?.username || 'Player';
          sendChat({
              sender: senderName,
              text: chatInput.trim()
          });
          setChatInput('');
      }
  };

  return (
    <div className="live-game-layout">
      {/* LEFT: Chess Board Area */}
      <div className="game-board-area">
        <div className="turn-indicator-wrapper">
          <div className={`turn-indicator ${game.turn() === 'w' ? 'active' : ''}`}>
              <div className="turn-marker" />
              <span className="turn-text">White</span>
          </div>
          <div className={`turn-indicator ${game.turn() === 'b' ? 'active' : ''}`}>
              <span className="turn-text">Black</span>
              <div className="turn-marker" />
          </div>
        </div>

        <div className="board-wrapper">
          <Chessboard 
            id="MainBoard"
            position={game.fen()} 
            onPieceDrop={onDrop} 
            onSquareClick={onSquareClick}
            boardOrientation={playerColor || 'white'}
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
              <button onClick={() => setGame(new Chess())} className="restart-btn" title="Rematch">
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

      {/* RIGHT: Status, History & Chat Panel */}
      <div className="game-side-panel">
        <div className="status-box glass-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
           <h3 className="section-title mb-4">
              Live Match
              {gameMode === 'multiplayer' && (
                <div className="text-xs text-secondary mt-1 tracking-wider" style={{ color: '#10b981', fontSize: '0.8rem' }}>Room Code: {gameId}</div>
              )}
           </h3>
           
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
             
             {/* Moves History */}
             <div className="move-history-scroll" ref={moveHistoryRef} style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
               {liveMoves.length === 0 ? (
                 <p className="text-secondary italic text-center" style={{ fontSize: '0.875rem', marginTop: '1rem' }}>Making the first move...</p>
               ) : (
                 <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      {getMovePairs().map((pair) => (
                        <tr key={pair.turn} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.6rem 0.5rem', color: '#94a3b8', width: '35px', textAlign: 'center', fontWeight: 'bold' }}>{pair.turn}.</td>
                          <td style={{ padding: '0.6rem 0.5rem', fontWeight: '600', color: '#e2e8f0' }}>{pair.white}</td>
                          <td style={{ padding: '0.6rem 0.5rem', fontWeight: '600', color: '#e2e8f0' }}>{pair.black}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               )}
             </div>

             {/* Live Chat */}
             {gameMode === 'multiplayer' && (
               <div className="chat-container">
                 <div className="chat-messages" ref={chatMessagesRef}>
                    {chats.length === 0 ? (
                      <p className="no-msgs">No messages yet</p>
                    ) : (
                      chats.map((msg, idx) => {
                        const isSelf = msg.sender === (currentUser?.username || 'Player');
                        return (
                          <div key={idx} className={`chat-row ${isSelf ? 'row-self' : 'row-other'}`}>
                            <div className={`chat-bubble ${isSelf ? 'bubble-self' : 'bubble-other'}`}>
                               {!isSelf && <div className="sender-name">{msg.sender}</div>}
                               {isSelf && <div className="sender-name">You</div>}
                               <div className="message-text">{msg.text}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                 </div>
                  <form onSubmit={handleSendChat} className="chat-input-wrapper">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type message..." 
                      className="chat-input"
                    />
                    <button type="submit" className="chat-send-btn">
                       <Send size={16} />
                    </button>
                  </form>
                </div>
             )}

           </div>

           <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
             <button 
               onClick={() => onGameOver && onGameOver('Resigned')} 
               className="btn-secondary w-full"
               style={{ justifyContent: 'center', color: '#f87171' }}
             >
               <Flag size={18} /> Resign Game
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
