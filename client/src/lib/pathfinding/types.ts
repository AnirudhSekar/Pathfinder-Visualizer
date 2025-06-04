export type CellType = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'path';

export interface Cell {
  row: number;
  col: number;
  type: CellType;
  isVisited: boolean;
  isPath: boolean;
  distance: number;
  heuristic: number;
  fScore: number;
  gScore: number;
  parent: Cell | null;
}

export interface Position {
  row: number;
  col: number;
}

export type Algorithm = 'astar' | 'dijkstra' | 'bfs' | 'dfs';

export type DrawingMode = 'wall' | 'erase' | 'start' | 'end';

export interface PathfindingStats {
  nodesVisited: number;
  pathLength: number;
  timeTaken: number;
  totalCells: number;
  wallCells: number;
}

export interface VisualizationStep {
  type: 'visit' | 'path' | 'complete';
  position: Position;
  delay?: number;
}
