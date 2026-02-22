/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Play, 
  RotateCcw, 
  Timer, 
  Zap, 
  ChevronLeft,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { 
  GameMode, 
  GameStatus, 
  Block, 
  GRID_COLS, 
  GRID_ROWS, 
  INITIAL_ROWS, 
  MAX_TIME 
} from './types';

const generateId = () => Math.random().toString(36).substring(2, 9);
const getRandomValue = () => Math.floor(Math.random() * 9) + 1;

export default function App() {
  const [status, setStatus] = useState<GameStatus>('menu');
  const [mode, setMode] = useState<GameMode>('classic');
  const [grid, setGrid] = useState<Block[][]>([]);
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [highScore, setHighScore] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game
  const initGame = useCallback((selectedMode: GameMode) => {
    const initialGrid: Block[][] = [];
    for (let r = 0; r < INITIAL_ROWS; r++) {
      const row: Block[] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        row.push({ id: generateId(), value: getRandomValue(), isSelected: false });
      }
      initialGrid.push(row);
    }
    
    setGrid(initialGrid);
    setMode(selectedMode);
    setTarget(Math.floor(Math.random() * 15) + 10);
    setScore(0);
    setTimeLeft(MAX_TIME);
    setStatus('playing');
  }, []);

  // Add a new row at the bottom
  const addRow = useCallback(() => {
    setGrid(prev => {
      if (prev.length >= GRID_ROWS) {
        setStatus('gameover');
        return prev;
      }
      const newRow: Block[] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        newRow.push({ id: generateId(), value: getRandomValue(), isSelected: false });
      }
      return [newRow, ...prev];
    });
    setTimeLeft(MAX_TIME);
  }, []);

  // Handle block selection
  const toggleBlock = (rowIdx: number, colIdx: number) => {
    if (status !== 'playing') return;

    const newGrid = [...grid];
    const block = newGrid[rowIdx][colIdx];
    block.isSelected = !block.isSelected;
    setGrid(newGrid);

    // Check sum
    const selectedBlocks: {r: number, c: number, val: number}[] = [];
    newGrid.forEach((row, r) => {
      row.forEach((b, c) => {
        if (b.isSelected) selectedBlocks.push({r, c, val: b.value});
      });
    });

    const currentSum = selectedBlocks.reduce((acc, b) => acc + b.val, 0);

    if (currentSum === target) {
      // Success!
      handleMatch(selectedBlocks);
    } else if (currentSum > target) {
      // Failed, deselect all
      setTimeout(() => {
        setGrid(prev => prev.map(row => row.map(b => ({ ...b, isSelected: false }))));
      }, 200);
    }
  };

  const handleMatch = (selected: {r: number, c: number, val: number}[]) => {
    setScore(prev => prev + target);
    
    // Remove blocks
    setGrid(prev => {
      const nextGrid = prev.map(row => row.filter(b => !b.isSelected));
      // Remove empty rows
      return nextGrid.filter(row => row.length > 0);
    });

    // New target
    setTarget(Math.floor(Math.random() * 15) + 10);

    // Effect
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7']
    });

    // Classic mode: add row after match
    if (mode === 'classic') {
      setTimeout(addRow, 300);
    }
  };

  // Timer logic for Time Mode
  useEffect(() => {
    if (status === 'playing' && mode === 'time') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            addRow();
            return MAX_TIME;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, mode, addRow]);

  // High score persistence
  useEffect(() => {
    const saved = localStorage.getItem('sumstack_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('sumstack_highscore', score.toString());
    }
  }, [score, highScore]);

  // Render Menu
  if (status === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-neutral-900 text-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 max-w-md w-full"
        >
          <div className="space-y-2">
            <h1 className="text-6xl font-bold tracking-tighter italic font-mono text-emerald-400">SUMSTACK</h1>
            <p className="text-neutral-400 font-medium uppercase tracking-widest text-xs">The Math Elimination Challenge</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => initGame('classic')}
              className="group relative flex items-center justify-between p-6 bg-neutral-800 border border-neutral-700 rounded-2xl hover:bg-emerald-500 hover:border-emerald-400 transition-all duration-300 overflow-hidden"
            >
              <div className="text-left z-10">
                <h3 className="text-xl font-bold group-hover:text-white">Classic Mode</h3>
                <p className="text-sm text-neutral-400 group-hover:text-emerald-100">Add a row after every match. Survive as long as possible.</p>
              </div>
              <Play className="w-8 h-8 text-emerald-400 group-hover:text-white z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={() => initGame('time')}
              className="group relative flex items-center justify-between p-6 bg-neutral-800 border border-neutral-700 rounded-2xl hover:bg-amber-500 hover:border-amber-400 transition-all duration-300 overflow-hidden"
            >
              <div className="text-left z-10">
                <h3 className="text-xl font-bold group-hover:text-white">Time Mode</h3>
                <p className="text-sm text-neutral-400 group-hover:text-amber-100">Add a row every {MAX_TIME} seconds. Speed is everything.</p>
              </div>
              <Timer className="w-8 h-8 text-amber-400 group-hover:text-white z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <div className="pt-8 border-t border-neutral-800 flex justify-between items-center text-neutral-500">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-mono">BEST: {highScore}</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="hover:text-white transition-colors"><Info className="w-5 h-5" /></button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Game Over
  if (status === 'gameover') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-neutral-900 text-white">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-8 max-w-sm w-full"
        >
          <div className="space-y-2">
            <h2 className="text-5xl font-bold text-red-500 font-mono italic">GAME OVER</h2>
            <p className="text-neutral-400 uppercase tracking-widest text-xs">The stack reached the top</p>
          </div>

          <div className="bg-neutral-800 p-8 rounded-3xl border border-neutral-700 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Final Score</span>
              <span className="text-3xl font-bold font-mono">{score}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-neutral-700">
              <span className="text-neutral-400 font-medium">High Score</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{highScore}</span>
            </div>
            <button 
              onClick={() => setStatus('menu')}
              className="w-full py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Playing
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col max-w-2xl mx-auto shadow-2xl relative">
      {/* Header */}
      <header className="p-4 bg-white border-b border-neutral-200 flex items-center justify-between sticky top-0 z-20">
        <button 
          onClick={() => setStatus('menu')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Target</span>
          <motion.div 
            key={target}
            initial={{ scale: 1.5, color: '#10b981' }}
            animate={{ scale: 1, color: '#171717' }}
            className="text-4xl font-black font-mono leading-none"
          >
            {target}
          </motion.div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Score</span>
          <div className="text-xl font-bold font-mono leading-none">{score}</div>
        </div>
      </header>

      {/* Timer Bar (Time Mode Only) */}
      {mode === 'time' && (
        <div className="h-1.5 w-full bg-neutral-200 overflow-hidden">
          <motion.div 
            initial={false}
            animate={{ width: `${(timeLeft / MAX_TIME) * 100}%` }}
            className={cn(
              "h-full transition-colors duration-1000",
              timeLeft < 3 ? "bg-red-500" : "bg-amber-500"
            )}
          />
        </div>
      )}

      {/* Game Board */}
      <main className="flex-1 p-4 flex flex-col-reverse overflow-hidden bg-neutral-100/50">
        <div className="grid grid-cols-6 gap-2 w-full max-w-md mx-auto">
          <AnimatePresence mode="popLayout">
            {grid.map((row, rIdx) => (
              row.map((block, cIdx) => (
                <motion.button
                  key={block.id}
                  layout
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, rotate: 15 }}
                  onClick={() => toggleBlock(rIdx, cIdx)}
                  className={cn(
                    "aspect-square rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 shadow-sm border-b-4 active:border-b-0 active:translate-y-1",
                    block.isSelected 
                      ? "bg-emerald-500 text-white border-emerald-700" 
                      : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  {block.value}
                </motion.button>
              ))
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Info */}
      <footer className="p-4 bg-white border-t border-neutral-200 flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-amber-500" />
          {mode} Mode
        </div>
        <div>
          {grid.length} / {GRID_ROWS} Rows
        </div>
      </footer>

      {/* Warning Overlay */}
      {grid.length >= GRID_ROWS - 2 && status === 'playing' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none border-4 border-red-500/30 animate-pulse z-10"
        />
      )}
    </div>
  );
}

