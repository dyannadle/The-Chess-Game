// PURPOSE: The main interactive chess board component — renders the board, handles moves, manages timers and chat.
// IMPACT: This is the CORE gameplay component. It integrates chess.js (game logic), react-chessboard (UI),
//         WebSocket move sync (multiplayer), AI opponent (vs bot), timers, move history, and live chat.
//         The most complex component in the frontend — ~450 lines.
// ALTERNATIVE: Use Lichess's open-source board component, or chessground (Lichess's rendering library).

// PURPOSE: Imports React hooks: useState (state), useEffect (side effects), useRef (DOM refs and persistent values).
import { useState, useEffect, useRef } from 'react';

// PURPOSE: Imports the Chess class from chess.js — a full chess engine in JavaScript.
// IMPACT: Handles all chess rules: legal move generation, check/checkmate/stalemate detection, FEN parsing,
//         move validation, PGN generation. The SINGLE SOURCE OF TRUTH for game state.
// ALTERNATIVE: Write custom chess logic (huge effort), or use Stockfish WASM for server-grade analysis.
import { Chess } from 'chess.js';

// PURPOSE: Imports the Chessboard component from react-chessboard — renders an interactive SVG chess board.
// IMPACT: Handles piece rendering, drag-and-drop, click-to-move, board orientation, and custom square styles.
//         Communicates position via FEN and move events.
// ALTERNATIVE: chessboard.js (jQuery-based), chessground (Lichess's library), or a custom SVG/Canvas board.
import { Chessboard } from 'react-chessboard';

// PURPOSE: Imports Lucide icon components for the game UI.
import { Trophy, RefreshCw, AlertCircle, Flag, Send } from 'lucide-react';

// PURPOSE: The ChessBoard component with all game-related props.
// IMPACT: Destructures all configuration from App.jsx: gameId, move callbacks, chat data, user info, game settings.
const ChessBoard = ({ gameId, onMoveMade, lastMove, onHistoryUpdate, gameMode, difficulty, playerColor, onGameOver, chats = [], sendChat, currentUser, matchDuration = 10 }) => {
  // ========================= STATE =========================

  // PURPOSE: The chess.js Game instance — holds the COMPLETE game state (board position, history, turn, etc.).
  // IMPACT: Every move, check, and game-over condition is computed from this object.
  //         Initialized to a new game (standard starting position).
  const [game, setGame] = useState(new Chess());

  // PURPOSE: The currently selected "from" square (click-to-move flow).
  // IMPACT: When a player clicks a piece, its square is stored here. The next click attempts the move.
  const [moveFrom, setMoveFrom] = useState('');

  // PURPOSE: Visual indicators for legal moves — highlights squares where the selected piece can move.
  // IMPACT: Object mapping square IDs to CSS styles (radial gradients for dots, yellow for selection).
  //         Passed to Chessboard's customSquareStyles prop.
  const [optionSquares, setOptionSquares] = useState({});

  // PURPOSE: The current text in the chat input field (controlled input).
  const [chatInput, setChatInput] = useState('');

  // PURPOSE: Whether the game clock is running.
  // IMPACT: When false, timers are paused. Set to true on the first move or "Start Game" button.
  const [isGameActive, setIsGameActive] = useState(false);

  // PURPOSE: White player's remaining time in seconds.
  // IMPACT: Initialized from matchDuration (minutes * 60). Counts down when it's white's turn.
  //         When it reaches 0, black wins on time.
  const [whiteTime, setWhiteTime] = useState(matchDuration * 60);

  // PURPOSE: Black player's remaining time in seconds. Same logic as whiteTime.
  const [blackTime, setBlackTime] = useState(matchDuration * 60);

  // PURPOSE: DOM reference to the chat messages container — used for auto-scrolling.
  const chatMessagesRef = useRef(null);

  // PURPOSE: DOM reference to the move history container — used for auto-scrolling.
  const moveHistoryRef = useRef(null);

  // PURPOSE: Gets the full move history with verbose details (from, to, piece, capture, SAN).
  // IMPACT: This runs on every render — game.history() creates a new array each time.
  //         Used for rendering the move history table and for the getMovePairs() function.
  // ALTERNATIVE: Memoize with useMemo(() => game.history({ verbose: true }), [game]) for performance.
  const liveMoves = game.history({ verbose: true });

  // ========================= EFFECTS =========================

  // PURPOSE: Auto-scrolls the chat panel to the bottom when new messages arrive.
  // IMPACT: Ensures the latest message is always visible without manual scrolling.
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chats]); // Re-runs when chat messages change.

  // PURPOSE: Auto-scrolls the move history to the bottom when new moves are made.
  useEffect(() => {
    if (moveHistoryRef.current) {
      moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
    }
  }, [liveMoves]); // Re-runs when moves change.

  // PURPOSE: Notifies the parent component when the game history updates.
  // IMPACT: Calls onHistoryUpdate callback (if provided) with the latest move list.
  //         Currently, App.jsx doesn't pass onHistoryUpdate, so this is a no-op.
  useEffect(() => {
    if (onHistoryUpdate) {
      onHistoryUpdate(game.history({ verbose: true }));
    }
  }, [game, onHistoryUpdate]);

  // ========================= CHESS CLOCK (TIMER) =========================

  // PURPOSE: Timer effect — counts down the active player's clock every second.
  // IMPACT: Runs a 1-second interval that decrements the current player's time.
  //         Stops when the game is not active or when the game is over.
  //         When time runs out, declares the opponent the winner.
  // ALTERNATIVE: Use the backend for authoritative timekeeping (prevents client-side manipulation).
  useEffect(() => {
    let interval = null;
    // PURPOSE: Only run the timer if the game is active and not over.
    if (isGameActive && !game.isGameOver()) {
      interval = setInterval(() => {
        // PURPOSE: Decrements the CURRENT player's time based on whose turn it is.
        if (game.turn() === 'w') {
          setWhiteTime((p) => {
            // PURPOSE: If white's time reaches 0, black wins on time.
            if (p <= 0) { setIsGameActive(false); onGameOver('BLACK_WIN'); return 0; }
            return p - 1;
          });
        } else {
          setBlackTime((p) => {
            // PURPOSE: If black's time reaches 0, white wins on time.
            if (p <= 0) { setIsGameActive(false); onGameOver('WHITE_WIN'); return 0; }
            return p - 1;
          });
        }
      }, 1000); // Fires every 1000ms (1 second).
    }
    // PURPOSE: Cleanup — clears the interval when the effect re-runs or the component unmounts.
    // IMPACT: Prevents memory leaks and stale timers.
    return () => clearInterval(interval);
  }, [isGameActive, game, onGameOver]);

  // ========================= UTILITY FUNCTIONS =========================

  // PURPOSE: Formats seconds into "M:SS" display format (e.g., 540 → "9:00", 61 → "1:01").
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);      // Minutes.
    const s = seconds % 60;                   // Remaining seconds.
    return `${m}:${s.toString().padStart(2, '0')}`; // Pads seconds to 2 digits.
  };

  // PURPOSE: Converts single-letter piece codes to full names for the move history display.
  // IMPACT: "p" → "Pawn", "n" → "Knight", etc. Shown in the move detail text.
  const getFullPieceName = (p) => {
    const names = { 'p': 'Pawn', 'n': 'Knight', 'b': 'Bishop', 'r': 'Rook', 'q': 'Queen', 'k': 'King' };
    return names[p] || p;
  };

  // PURPOSE: Safely mutates the chess game state by creating a copy, applying changes, then updating state.
  // IMPACT: React state should be immutable — this pattern creates a new Chess instance for each update.
  //         Loads the current game's PGN into a fresh instance, applies the modification, then sets state.
  // ALTERNATIVE: Use game.copy() if chess.js supports it, or game.undo() for specific operations.
  function safeGameMutate(modify) {
    setGame((g) => {
      const update = new Chess();
      update.loadPgn(g.pgn()); // Copies the current game state via PGN.
      modify(update);           // Applies the caller's modification.
      return update;            // Returns the new game instance as the new state.
    });
  }

  // ========================= OPPONENT MOVE SYNC (WebSocket) =========================

  // PURPOSE: Processes incoming moves from the opponent via WebSocket.
  // IMPACT: When the opponent makes a move, it arrives as lastMove. This effect applies it to the local board.
  //         Also syncs timer values and game-active state from the opponent.
  useEffect(() => {
    if (lastMove && lastMove.gameId === gameId) {
      // PURPOSE: Syncs timer values from the opponent's move data.
      if (lastMove.whiteTime !== undefined) setWhiteTime(lastMove.whiteTime);
      if (lastMove.blackTime !== undefined) setBlackTime(lastMove.blackTime);
      if (lastMove.gameActive !== undefined) setIsGameActive(lastMove.gameActive);

      // PURPOSE: Applies the opponent's move to the local chess.js instance.
      safeGameMutate((game) => {
        try {
          game.move({
            from: lastMove.from,
            to: lastMove.to,
            promotion: lastMove.promotion || 'q', // Default to queen promotion.
          });
        } catch (e) {
          console.error('Invalid move received', e); // Handles invalid/corrupted moves gracefully.
        }
      });
    }
  }, [lastMove, gameId]); // Re-runs when a new move is received or gameId changes.

  // ========================= AI OPPONENT =========================

  // PURPOSE: Triggers the AI to make a move after the human player moves (AI mode only).
  // IMPACT: When it's not the player's turn (AI's turn), waits 500ms then makes an AI move.
  //         The 500ms delay simulates "thinking" time for a more natural gameplay feel.
  useEffect(() => {
    // PURPOSE: Only trigger AI when: mode is 'ai', game isn't over, and it's NOT the player's turn.
    if (gameMode === 'ai' && !game.isGameOver() && game.turn() !== playerColor[0]) {
      const timer = setTimeout(() => {
        makeAiMove();
      }, 500); // 500ms delay for natural feel.
      return () => clearTimeout(timer); // Cleanup if the effect re-runs.
    }
  }, [game, gameMode, playerColor]);

  // PURPOSE: Executes an AI move using simple heuristics based on difficulty.
  // IMPACT: Selects a move, applies it to the game, and sends it via WebSocket.
  //         AI quality: Easy = pure random, Medium/Hard = prefers captures (70% chance).
  // ALTERNATIVE: Integrate Stockfish WASM for real chess engine analysis (much stronger but resource-heavy).
  function makeAiMove() {
      // PURPOSE: Gets all legal moves in the current position.
      const moves = game.moves();
      if (game.isGameOver() || moves.length === 0) return; // No moves available.

      let move;
      if (difficulty === 'easy') {
        // PURPOSE: Easy AI — picks a completely random legal move.
        move = moves[Math.floor(Math.random() * moves.length)];
      } else {
        // PURPOSE: Medium/Hard AI — picks random, but prefers captures 70% of the time.
        // IMPACT: Makes the AI slightly more aggressive by prioritizing piece captures.
        // NOTE: Medium and Hard use the same logic — should be differentiated for better difficulty scaling.
        move = moves[Math.floor(Math.random() * moves.length)]; 
        const captures = moves.filter(m => m.includes('x')); // Moves with 'x' are captures (SAN notation).
        if (captures.length > 0 && Math.random() > 0.3) {    // 70% chance to play a capture if available.
          move = captures[Math.floor(Math.random() * captures.length)];
        }
      }

      // PURPOSE: Applies the selected AI move to a copy of the game.
      const gameCopy = new Chess();
      gameCopy.loadPgn(game.pgn());
      const moveResult = gameCopy.move(move);
      
      // PURPOSE: Updates the game state with the AI's move.
      setGame(gameCopy);
      setIsGameActive(true); // Ensure the clock is running.

      // PURPOSE: Sends the AI move via WebSocket (for history persistence and multiplayer compatibility).
      onMoveMade({
        from: moveResult.from,
        to: moveResult.to,
        fen: gameCopy.fen(),
        san: moveResult.san,
        piece: moveResult.piece,
        color: moveResult.color,
        captured: moveResult.captured,
        userId: currentUser?.id,
        whiteTime: whiteTime,
        blackTime: blackTime,
        gameActive: true
      });
  }

  // ========================= MOVE OPTION HIGHLIGHTING =========================

  // PURPOSE: Calculates and displays legal move options for a selected piece.
  // IMPACT: Shows dot indicators on squares where the selected piece can legally move.
  //         Larger dots on squares with enemy pieces (capture moves).
  function getMoveOptions(square) {
    // PURPOSE: Gets all legal moves for the piece on the given square.
    const moves = game.moves({
      square,
      verbose: true, // Returns detailed move objects with from, to, captured, etc.
    });

    // PURPOSE: If no legal moves exist for this piece, clear any existing highlights.
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    // PURPOSE: Creates CSS style objects for each legal move destination.
    const newSquares = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        // PURPOSE: Radial gradient dot — large dot (85%) for captures, small dot (25%) for empty squares.
        background:
          game.get(move.to) && game.get(move.to).color !== game.get(square).color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'  // Capture square.
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)', // Empty square.
        borderRadius: '50%',
      };
    });

    // PURPOSE: Highlights the selected piece's square with yellow.
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };

    setOptionSquares(newSquares);
    return true;
  }

  // ========================= MOVE EXECUTION (Click & Drag) =========================

  // PURPOSE: Handles click-to-move interaction (two-click: select piece, then select destination).
  function onSquareClick(square) {
    // PURPOSE: First click — select the "from" square.
    if (!moveFrom) {
      const hasOptions = getMoveOptions(square);
      if (hasOptions) setMoveFrom(square); // Only set if the piece has legal moves.
      return;
    }

    // PURPOSE: Second click — attempt to make the move from moveFrom to the clicked square.
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    try {
      const move = gameCopy.move({
        from: moveFrom,
        to: square,
        promotion: 'q', // Auto-promote to queen (most common choice).
      });

      // PURPOSE: If the move is invalid (returns null), try selecting a new piece instead.
      if (move === null) {
        const hasOptions = getMoveOptions(square);
        if (hasOptions) setMoveFrom(square);
        return;
      }

      // PURPOSE: Valid move — update game state and notify other systems.
      setGame(gameCopy);       // Update the chess board.
      setIsGameActive(true);   // Start the clock on first move.
      setMoveFrom('');         // Reset selection.
      setOptionSquares({});    // Clear move indicators.

      // PURPOSE: Sends the move via WebSocket to the backend (for multiplayer sync and history).
      onMoveMade({
        from: move.from,
        to: move.to,
        fen: gameCopy.fen(),
        san: move.san,
        piece: move.piece,
        color: move.color,
        captured: move.captured,
        userId: currentUser?.id
      });
    } catch (e) {
      // PURPOSE: If the move throws an error, try selecting the clicked square as a new "from".
      const hasOptions = getMoveOptions(square);
      if (hasOptions) setMoveFrom(square);
      else {
        setMoveFrom('');
        setOptionSquares({});
      }
    }
  }

  // PURPOSE: Handles drag-and-drop move interaction.
  // IMPACT: Called by react-chessboard when a piece is dropped. Returns true if valid, false if rejected.
  function onDrop(sourceSquare, targetSquare) {
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false; // Invalid move — piece snaps back.

      setGame(gameCopy);
      setIsGameActive(true);
      setOptionSquares({});

      // PURPOSE: Same WebSocket notification as click-to-move.
      onMoveMade({
        from: move.from,
        to: move.to,
        fen: gameCopy.fen(),
        san: move.san,
        piece: move.piece,
        color: move.color,
        captured: move.captured,
        userId: currentUser?.id
      });
      return true; // Valid move — piece stays at the new position.
    } catch (e) {
      return false; // Error — piece snaps back.
    }
  }

  // ========================= MOVE HISTORY FORMATTING =========================

  // PURPOSE: Removed duplicate liveMoves from here to fix ReferenceError (was declared at top).

  // PURPOSE: Groups individual moves into white/black pairs for the move history table.
  // IMPACT: Converts [e4, e5, Nf3, Nc6] into [{number:1, white:e4, black:e5}, {number:2, white:Nf3, black:Nc6}].
  const getMovePairs = () => {
    const pairs = [];
    for (let i = 0; i < liveMoves.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1, // Move number (1, 2, 3, ...).
        white: liveMoves[i],            // White's move (always at even index).
        black: liveMoves[i + 1],        // Black's move (may be undefined for the last incomplete pair).
      });
    }
    return pairs;
  };

  // ========================= CHAT HANDLER =========================

  // PURPOSE: Sends a chat message via WebSocket.
  const handleSendChat = (e) => {
      e.preventDefault(); // Prevents form submission page reload.
      if (chatInput.trim() && sendChat) {
          const senderName = currentUser?.username || 'Player';
          sendChat({
              sender: senderName,
              text: chatInput.trim()
          });
          setChatInput(''); // Clears the input after sending.
      }
  };

  // ========================= RENDER =========================

  return (
    <div className="live-game-layout">
      {/* LEFT SIDE: Chess Board with turn indicators and status messages */}
      <div className="game-board-area">
        {/* PURPOSE: Shows whose turn it is with active/inactive indicators. */}
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

        {/* PURPOSE: The actual chess board rendered by react-chessboard. */}
        <div className="board-wrapper">
          <Chessboard 
            id="MainBoard"
            position={game.fen()}                 // Current position from chess.js.
            onPieceDrop={onDrop}                  // Drag-and-drop move handler.
            onSquareClick={onSquareClick}          // Click-to-move handler.
            boardOrientation={playerColor || 'white'} // Which side faces the player.
            customDarkSquareStyle={{ backgroundColor: '#2d333b' }}   // Dark square color.
            customLightSquareStyle={{ backgroundColor: '#444c56' }}  // Light square color.
            customSquareStyles={optionSquares}     // Legal move indicators.
            animationDuration={300}                // Piece animation duration in ms.
          />
        </div>

        {/* PURPOSE: Status messages — game over alerts and check warnings. */}
        <div className="status-messages">
          {/* PURPOSE: Game over banner with result type (checkmate, draw, stalemate). */}
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
              {/* PURPOSE: Rematch button — resets the game to starting position. */}
              <button onClick={() => setGame(new Chess())} className="restart-btn" title="Rematch">
                  <RefreshCw width={20} height={20} />
              </button>
            </div>
          )}
          
          {/* PURPOSE: Check alert — shown when the current player's king is in check. */}
          {game.inCheck() && !game.isGameOver() && (
             <div className="status-alert check">
               <AlertCircle className="status-alert-icon" />
               <p className="status-alert-title">Check!</p>
             </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Status panel with timers, move history, and chat */}
      <div className="game-side-panel">
        <div className="status-box glass-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
           {/* PURPOSE: Match info header — shows game mode/room code. */}
           <h3 className="section-title mb-4">
              Live Match
              <span className="text-xs text-secondary mt-1 tracking-wider" style={{ color: '#10b981', fontSize: '0.8rem' }}>
                {gameMode === 'ai' ? `vs Master Stockfish (LVL ${difficulty})` : `Room Code: ${gameId}`}
              </span>
           </h3>
           
           {/* PURPOSE: Chess clocks — shows remaining time for each player. */}
           <div className="game-timers" style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div className={`timer ${game.turn() === 'w' ? 'active-timer' : ''}`} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>White</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatTime(whiteTime)}</span>
              </div>
              <div className={`timer ${game.turn() === 'b' ? 'active-timer' : ''}`} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Black</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatTime(blackTime)}</span>
              </div>
            </div>

           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
             
             {/* PURPOSE: Move history table — shows all moves in White/Black pairs. */}
             <div className="move-history-scroll" ref={moveHistoryRef} style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
               {liveMoves.length === 0 ? (
                 <p className="text-secondary italic text-center" style={{ fontSize: '0.875rem', marginTop: '1rem' }}>Making the first move...</p>
               ) : (
                 <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>#</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>White</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Black</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getMovePairs().map((pair) => (
                        <tr key={pair.number} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.6rem 0.5rem', color: '#94a3b8', width: '35px', textAlign: 'center', fontWeight: 'bold' }}>{pair.number}.</td>
                          <td style={{ padding: '0.6rem 0.5rem', fontWeight: '600', color: '#e2e8f0' }}>
                            {pair.white ? (
                              <div className="move-info-box">
                                <span className="move-san">{pair.white.san}</span>
                                <span className="move-text-detail" style={{ fontSize: '0.7rem', display: 'block', color: '#64748b' }}>{getFullPieceName(pair.white.piece)}: {pair.white.from} → {pair.white.to}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', fontWeight: '600', color: '#e2e8f0' }}>
                            {pair.black ? (
                              <div className="move-info-box">
                                <span className="move-san">{pair.black.san}</span>
                                <span className="move-text-detail" style={{ fontSize: '0.7rem', display: 'block', color: '#64748b' }}>{getFullPieceName(pair.black.piece)}: {pair.black.from} → {pair.black.to}</span>
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               )}
             </div>

             {/* PURPOSE: Live chat panel — only shown in multiplayer mode. */}
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

           {/* PURPOSE: Action buttons at the bottom — Start Game and Resign. */}
           <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
             {/* PURPOSE: "Start Game" button — only shown when the clock hasn't started yet. */}
             {!isGameActive && !game.isGameOver() && (
                 <button className="btn-accent w-full mb-2" onClick={() => setIsGameActive(true)}>Start Game</button>
             )}
             {/* PURPOSE: Resign button — ends the game immediately. */}
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

// PURPOSE: Exports the component for use in App.jsx.
export default ChessBoard;
