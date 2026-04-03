import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { CheckCircle2, ChevronLeft, Lightbulb, RotateCcw, XCircle } from 'lucide-react';

const PuzzleBoard = ({ puzzle, onNext, onBack }) => {
  const [game, setGame] = useState(new Chess(puzzle.fen));
  const [status, setStatus] = useState('solve'); // solve, success, fail
  const [currentStep, setCurrentStep] = useState(0);
  const [hintSquare, setHintSquare] = useState(null);
  const solution = puzzle.solution.split(',');

  useEffect(() => {
    setGame(new Chess(puzzle.fen));
    setStatus('solve');
    setCurrentStep(0);
  }, [puzzle]);

  function onDrop(sourceSquare, targetSquare) {
    if (status !== 'solve') return false;

    const moveString = `${sourceSquare}${targetSquare}`;
    const expectedMove = solution[currentStep];

    if (moveString === expectedMove) {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;

      setGame(new Chess(game.fen()));
      
      if (currentStep + 1 === solution.length) {
        setStatus('success');
      } else {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        
        // Automate opponent's move (AI)
        setTimeout(() => {
          const aiMoveStr = solution[nextStep];
          const from = aiMoveStr.substring(0, 2);
          const to = aiMoveStr.substring(2, 4);
          
          safeGameMutate((game) => {
             game.move({ from, to, promotion: 'q' });
          });
          
          if (nextStep + 1 === solution.length) {
            setStatus('success');
          } else {
            setCurrentStep(nextStep + 1);
          }
        }, 600);
      }
      return true;
    } else {
      setStatus('fail');
      return false;
    }
  }

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = new Chess();
      update.loadPgn(g.pgn());
      modify(update);
      return update;
    });
  }

  const showHint = () => {
    const nextMove = solution[currentStep];
    if (nextMove) {
      setHintSquare(nextMove.substring(0, 2));
      setTimeout(() => setHintSquare(null), 2000);
    }
  };

  const resetPuzzle = () => {
    setGame(new Chess(puzzle.fen));
    setStatus('solve');
    setCurrentStep(0);
  };

  return (
    <div className="puzzle-container glass-container">
      <div className="puzzle-header">
        <button className="btn-secondary" onClick={onBack}>
          <ChevronLeft size={18} /> Back Overview
        </button>
        <h3>Daily Puzzle: {puzzle.description}</h3>
        <span className={`badge ${puzzle.difficulty.toLowerCase()}`}>
          {puzzle.difficulty}
        </span>
      </div>

      <div className="puzzle-main">
        <div className="board-wrapper">
          <Chessboard 
            position={game.fen()} 
            onPieceDrop={onDrop}
            boardOrientation={puzzle.fen.includes(' w ') ? 'white' : 'black'}
            customSquareStyles={hintSquare ? { [hintSquare]: { background: 'rgba(255, 255, 0, 0.4)' } } : {}}
          />
        </div>

        <div className="puzzle-sidebar">
          {status === 'solve' && (
            <div className="status-box info">
              <Lightbulb className="text-accent" />
              <p>Your turn! Find the best move for {game.turn() === 'w' ? 'White' : 'Black'}.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="status-box success">
              <CheckCircle2 color="#10b981" />
              <h3>Solved!</h3>
              <p>Excellent tactical vision. You've completed this challenge!</p>
              <button className="btn-accent mt-4" onClick={onNext}>Next Puzzle</button>
            </div>
          )}

          {status === 'fail' && (
            <div className="status-box error">
              <XCircle color="#ef4444" />
              <h3>Wrong move!</h3>
              <p>That's not the best solution. Try again!</p>
              <button className="btn-secondary mt-4" onClick={resetPuzzle}>
                <RotateCcw size={18} /> Try Again
              </button>
            </div>
          )}

          <div className="hint-section mt-auto">
            <button className="btn-ghost w-full" onClick={showHint}>
               Need a hint? (Reveal Piece)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleBoard;
