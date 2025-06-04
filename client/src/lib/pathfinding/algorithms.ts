import { Cell, Position, VisualizationStep } from './types';

export class PathfindingAlgorithms {
  private grid: Cell[][];
  private rows: number;
  private cols: number;

  constructor(grid: Cell[][]) {
    this.grid = grid;
    this.rows = grid.length;
    this.cols = grid[0].length;
  }

  private getNeighbors(cell: Cell): Cell[] {
    const neighbors: Cell[] = [];
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1] // up, down, left, right
    ];

    for (const [dr, dc] of directions) {
      const newRow = cell.row + dr;
      const newCol = cell.col + dc;

      if (
        newRow >= 0 && newRow < this.rows &&
        newCol >= 0 && newCol < this.cols &&
        this.grid[newRow][newCol].type !== 'wall'
      ) {
        neighbors.push(this.grid[newRow][newCol]);
      }
    }

    return neighbors;
  }

  private resetGrid(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        cell.isVisited = false;
        cell.isPath = false;
        cell.distance = Infinity;
        cell.gScore = Infinity;
        cell.fScore = Infinity;
        cell.heuristic = 0;
        cell.parent = null;
      }
    }
  }

  private reconstructPath(endCell: Cell): Position[] {
    const path: Position[] = [];
    let current: Cell | null = endCell;

    while (current && current.parent) {
      path.unshift({ row: current.row, col: current.col });
      current = current.parent;
    }

    return path;
  }

  private manhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  }

  async astar(start: Position, end: Position): Promise<VisualizationStep[]> {
    this.resetGrid();
    const steps: VisualizationStep[] = [];
    
    const startCell = this.grid[start.row][start.col];
    const endCell = this.grid[end.row][end.col];

    const openSet: Cell[] = [startCell];
    const closedSet = new Set<Cell>();

    startCell.gScore = 0;
    startCell.fScore = this.manhattanDistance(start, end);

    while (openSet.length > 0) {
      // Find cell with lowest fScore
      let current = openSet[0];
      let currentIndex = 0;

      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].fScore < current.fScore) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      // Remove current from openSet
      openSet.splice(currentIndex, 1);
      closedSet.add(current);

      if (current.type !== 'start' && current.type !== 'end') {
        current.isVisited = true;
        steps.push({
          type: 'visit',
          position: { row: current.row, col: current.col }
        });
      }

      // Found the goal
      if (current === endCell) {
        const path = this.reconstructPath(current);
        for (const pos of path) {
          if (this.grid[pos.row][pos.col].type !== 'start' && 
              this.grid[pos.row][pos.col].type !== 'end') {
            steps.push({
              type: 'path',
              position: pos
            });
          }
        }
        steps.push({ type: 'complete', position: end });
        return steps;
      }

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor)) continue;

        const tentativeGScore = current.gScore + 1;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= neighbor.gScore) {
          continue;
        }

        neighbor.parent = current;
        neighbor.gScore = tentativeGScore;
        neighbor.fScore = neighbor.gScore + this.manhattanDistance(
          { row: neighbor.row, col: neighbor.col }, end
        );
      }
    }

    steps.push({ type: 'complete', position: end });
    return steps; // No path found
  }

  async dijkstra(start: Position, end: Position): Promise<VisualizationStep[]> {
    this.resetGrid();
    const steps: VisualizationStep[] = [];
    
    const startCell = this.grid[start.row][start.col];
    const endCell = this.grid[end.row][end.col];

    const unvisited: Cell[] = [];
    
    // Initialize all cells
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        if (cell.type !== 'wall') {
          unvisited.push(cell);
        }
      }
    }

    startCell.distance = 0;

    while (unvisited.length > 0) {
      // Sort by distance and get the closest unvisited cell
      unvisited.sort((a, b) => a.distance - b.distance);
      const current = unvisited.shift()!;

      if (current.distance === Infinity) break;

      current.isVisited = true;

      if (current.type !== 'start' && current.type !== 'end') {
        steps.push({
          type: 'visit',
          position: { row: current.row, col: current.col }
        });
      }

      if (current === endCell) {
        const path = this.reconstructPath(current);
        for (const pos of path) {
          if (this.grid[pos.row][pos.col].type !== 'start' && 
              this.grid[pos.row][pos.col].type !== 'end') {
            steps.push({
              type: 'path',
              position: pos
            });
          }
        }
        steps.push({ type: 'complete', position: end });
        return steps;
      }

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (neighbor.isVisited) continue;

        const tentativeDistance = current.distance + 1;

        if (tentativeDistance < neighbor.distance) {
          neighbor.distance = tentativeDistance;
          neighbor.parent = current;
        }
      }
    }

    steps.push({ type: 'complete', position: end });
    return steps;
  }

  async bfs(start: Position, end: Position): Promise<VisualizationStep[]> {
    this.resetGrid();
    const steps: VisualizationStep[] = [];
    
    const startCell = this.grid[start.row][start.col];
    const endCell = this.grid[end.row][end.col];

    const queue: Cell[] = [startCell];
    startCell.isVisited = true;

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.type !== 'start' && current.type !== 'end') {
        steps.push({
          type: 'visit',
          position: { row: current.row, col: current.col }
        });
      }

      if (current === endCell) {
        const path = this.reconstructPath(current);
        for (const pos of path) {
          if (this.grid[pos.row][pos.col].type !== 'start' && 
              this.grid[pos.row][pos.col].type !== 'end') {
            steps.push({
              type: 'path',
              position: pos
            });
          }
        }
        steps.push({ type: 'complete', position: end });
        return steps;
      }

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited) {
          neighbor.isVisited = true;
          neighbor.parent = current;
          queue.push(neighbor);
        }
      }
    }

    steps.push({ type: 'complete', position: end });
    return steps;
  }

  async dfs(start: Position, end: Position): Promise<VisualizationStep[]> {
    this.resetGrid();
    const steps: VisualizationStep[] = [];
    
    const startCell = this.grid[start.row][start.col];
    const endCell = this.grid[end.row][end.col];

    const stack: Cell[] = [startCell];
    startCell.isVisited = true;

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current.type !== 'start' && current.type !== 'end') {
        steps.push({
          type: 'visit',
          position: { row: current.row, col: current.col }
        });
      }

      if (current === endCell) {
        const path = this.reconstructPath(current);
        for (const pos of path) {
          if (this.grid[pos.row][pos.col].type !== 'start' && 
              this.grid[pos.row][pos.col].type !== 'end') {
            steps.push({
              type: 'path',
              position: pos
            });
          }
        }
        steps.push({ type: 'complete', position: end });
        return steps;
      }

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited) {
          neighbor.isVisited = true;
          neighbor.parent = current;
          stack.push(neighbor);
        }
      }
    }

    steps.push({ type: 'complete', position: end });
    return steps;
  }
}
