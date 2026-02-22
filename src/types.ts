export type GameMode = 'classic' | 'time';
export type GameStatus = 'menu' | 'playing' | 'gameover';

export interface Block {
  id: string;
  value: number;
  isSelected: boolean;
}

export interface GameState {
  grid: Block[][]; // rows[cols]
  target: number;
  score: number;
  level: number;
  status: GameStatus;
  mode: GameMode;
  timeLeft: number;
  maxTime: number;
}

export const GRID_COLS = 6;
export const GRID_ROWS = 10;
export const INITIAL_ROWS = 4;
export const MAX_TIME = 10; // seconds for time mode
