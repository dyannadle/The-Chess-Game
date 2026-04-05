// PURPOSE: The React component for the tactical training feature ("Training" tab).
// IMPACT: Renders chess puzzles, validates player moves against the correct solution, and provides feedback.
//         Provides an interactive way for players to improve their chess tactics without playing full games.
// ALTERNATIVE: Use a third-party training widget, or load puzzles entirely client-side without a backend.

// PURPOSE: Imports React, useState (for board/puzzle state), useEffect (for puzzle loading).
import { useState, useEffect } from 'react';

// PURPOSE: Imports chess.js to handle legal move validation and FEN parsing for the puzzle.
import { Chess } from 'chess.js';

// PURPOSE: Imports react-chessboard for rendering the interactive SVG puzzle board.
import { Chessboard } from 'react-chessboard';

// PURPOSE: Imports Lucide icon components for UI buttons and alerts.
// IMPACT: Lightbulb = header icon, ChevronRight = "Next Puzzle" button, CheckCircle = success alert, XCircle = error alert.
import { Lightbulb, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

// PURPOSE: The PuzzleBoard component function.
// IMPACT: Receives puzzle object (from backend), onNext callback (to fetch next puzzle), and onBack callback.
const PuzzleBoard = ({ puzzle, onNext, onBack }) => {
  // PURPOSE: The chess.js instance representing the current state of the puzzle board.
  // IMPACT: Initialized to a new game. Overwritten with the puzzle's FEN position when the puzzle loads.
  const [game, setGame] = useState(new Chess());

  // PURPOSE: The current step index in the puzzle's solution array.
  // IMPACT: Tracks which move the player needs to make next. 0 = first move, 1 = second move, etc.
  const [step, setStep] = useState(0);

  // PURPOSE: The parsed array of correct moves (e.g., ["a7e7"]).
  // IMPACT: The player's move is compared against solutionMoves[step] to determine if it's correct.
  const [solutionMoves, setSolutionMoves] = useState([]);

  // PURPOSE: The validation status of the player's last move.
  // IMPACT: null = haven't moved yet. 'correct' = move matches solution. 'wrong' = move is incorrect.
  const [status, setStatus] = useState(null); // null, 'correct', 'wrong'

  // PURPOSE: Whether the puzzle is fully solved (all steps completed).
  // IMPACT: When true, shows the success message and enables the "Next Puzzle" button.
  const [solved, setSolved] = useState(false);

  // PURPOSE: Safe mutation helper for chess.js (same pattern as ChessBoard.jsx).
  // IMPACT: Clones the game, applies the modification, and sets the new state. Keeps React state immutable.
  function safeGameMutate(modify) {
    setGame((g) => {
      const update = new Chess();
      update.loadPgn(g.pgn());
      modify(update);
      return update;
    });
  }

  // PURPOSE: Effect that initializes the board when a new puzzle is received.
  // IMPACT: Resets all state, loads the puzzle FEN into chess.js, and parses the solution string.
  //         Dependency: [puzzle] — runs whenever the parent component passes a new puzzle.
  useEffect(() => {
    if (puzzle) {
      const newGame = new Chess();
      // PURPOSE: Loads the starting position of the puzzle using FEN.
      newGame.load(puzzle.fen);
      setGame(newGame);
      setStep(0);
      setStatus(null);
      setSolved(false);
      // PURPOSE: Parses the comma-separated solution string (e.g., "e2e4,e7e5") into an array.
      setSolutionMoves(puzzle.solution.split(',').map(s => s.trim()));
    }
  }, [puzzle]);

  // PURPOSE: Handles drag-and-drop piece movement by the player.
  // IMPACT: Called by react-chessboard. Returns true if valid, false if rejected (snaps back).
  function onDrop(sourceSquare, targetSquare) {
    // PURPOSE: If the puzzle is already solved, prevent further moves.
    if (solved) return false;

    // PURPOSE: Constructs the UCI (Universal Chess Interface) move string (e.g., "e2e4").
    // IMPACT: UCI format is used because that's how the solutions are stored in the database.
    const moveStr = sourceSquare + targetSquare;

    // PURPOSE: Check if the player's move matches the expected correct move at the current step.
    if (moveStr === solutionMoves[step]) {
      // PURPOSE: The move IS correct. Apply it to the chessboard.
      safeGameMutate((game) => {
         game.move({
           from: sourceSquare,
           to: targetSquare,
           promotion: 'q', // Always promotes to queen for simplicity in puzzles.
         });
      });

      // PURPOSE: Display the "Correct" success UI state.
      setStatus('correct');

      // PURPOSE: Check if there are more moves in the solution.
      if (step + 1 < solutionMoves.length) {
         // PURPOSE: Multi-move puzzle — AI responds automatically after 500ms.
         // IMPACT: The user plays white, the AI plays the "correct" black response move from the solution.
         //         Advances the step counter by 2 (User's move + AI's response).
         setStep(s => s + 1);
         setTimeout(() => {
             // PURPOSE: The AI's response is the NEXT move in the solution array.
             const autoMove = solutionMoves[step + 1];
             if (autoMove) {
                 safeGameMutate((game) => {
                     game.move({
                         from: autoMove.substring(0, 2), // Extracts 'e7' from 'e7e5'
                         to: autoMove.substring(2, 4),   // Extracts 'e5' from 'e7e5'
                         promotion: 'q'
                     });
                 });
                 // PURPOSE: Advance the step again so it's ready for the user's next move.
                 setStep(s => s + 2);
             }
         }, 500); // 500ms delay for realism.
      } else {
         // PURPOSE: The final move was made. Mark the puzzle as fully solved.
         setSolved(true);
      }
      return true; // Valid drop — piece stays put.
    } else {
      // PURPOSE: The player's move was WRONG (didn't match the solution).
      // IMPACT: Shows the "Wrong Move" error state. The piece snaps back (returns false).
      setStatus('wrong');
      return false; // Invalid drop — piece snaps back to origin.
    }
  }

  // PURPOSE: Handles skipping/proceeding to the next puzzle.
  const handleNext = () => {
      // PURPOSE: Resets status UI before loading the next puzzle.
      setStatus(null);
      // PURPOSE: Calls the parent's (App.jsx) callback which fetches a new puzzle from the API.
      if (onNext) onNext();
  };

  // PURPOSE: Main render block for the puzzle UI.
  return (
    <div className="puzzle-main">
      {/* LEFT SIDE: Interactive Chessboard */}
      <div className="board-wrapper">
         <Chessboard 
           id="PuzzleBoard"
           position={game.fen()}               // Current position.
           onPieceDrop={onDrop}                // Validates moves against the solution.
           customDarkSquareStyle={{ backgroundColor: '#2d333b' }}
           customLightSquareStyle={{ backgroundColor: '#444c56' }}
           animationDuration={300}
         />
      </div>

      {/* RIGHT SIDE: Puzzle metadata, status, and controls */}
      <div className="status-box glass-container" style={{ display: 'flex', flexDirection: 'column' }}>
         {/* PURPOSE: Header block mapping to the puzzle description and difficulty. */}
         <div style={{ marginBottom: '2rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                 <Lightbulb className="text-accent" size={24} />
                 <h3 className="section-title" style={{ margin: 0 }}>Tactical Training</h3>
             </div>
             
             {/* PURPOSE: Displays the puzzle description (e.g., "Find the checkmate"). */}
             <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#f8fafc', marginBottom: '0.5rem' }}>
               {puzzle.description}
             </p>
             
             {/* PURPOSE: Displays the difficulty badge, colors matching the text. */}
             <span className={`badge ${puzzle.difficulty.toLowerCase()}`}>
               {puzzle.difficulty} Difficulty
             </span>
         </div>
         
         {/* PURPOSE: Status indicator panel — shows correct/wrong feedback. */}
         <div style={{ flex: 1 }}>
            {/* PURPOSE: Success message when the player makes a correct move but puzzle isn't over yet. */}
            {status === 'correct' && !solved && (
              <div className="status-alert check" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle size={20} />
                <p>Correct! Keep going...</p>
              </div>
            )}
            
            {/* PURPOSE: Failure message when the player makes the wrong move. */}
            {status === 'wrong' && (
              <div className="status-alert error" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <XCircle size={20} />
                <p>Not quite. Try finding a stronger move.</p>
              </div>
            )}
            
            {/* PURPOSE: Success message when the entire puzzle sequence is solved. */}
            {solved && (
              <div className="status-alert check" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Trophy size={20} />
                <div>
                   <p style={{ fontWeight: 'bold' }}>Brilliant Move!</p>
                   <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>You solved the puzzle.</p>
                </div>
              </div>
            )}
         </div>

         {/* PURPOSE: Action controls — Start Over and Next Puzzle buttons. */}
         <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
            {/* PURPOSE: Start Over button — resets the board to the puzzle's starting position. */}
            <button 
              className="btn-secondary" 
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => {
                 const newGame = new Chess();
                 newGame.load(puzzle.fen); // Reloads the initial FEN.
                 setGame(newGame);
                 setStep(0);
                 setStatus(null);
                 setSolved(false);
              }}
            >
              Start Over
            </button>
            {/* PURPOSE: Next Puzzle / Skip button — fetches a new puzzle from the backend. */}
            {/* IMPACT: Text changes from 'Next Puzzle' to 'Skip Puzzle' depending on whether it's solved. */}
            {/*         Uses the text-accent class if solved (green), otherwise normal styling. */}
            <button 
              className={`btn-secondary ${solved ? 'text-accent' : ''}`} 
              style={{ flex: 1, justifyContent: 'center', borderColor: solved ? '#10b981' : undefined }}
              onClick={handleNext}
            >
              {solved ? 'Next Puzzle' : 'Skip Puzzle'} <ChevronRight size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default PuzzleBoard;
