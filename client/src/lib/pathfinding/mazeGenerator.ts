import { Cell, Position } from './types';

export class MazeGenerator {
  private grid: Cell[][];
  private rows: number;
  private cols: number;

  constructor(grid: Cell[][]) {
    this.grid = grid;
    this.rows = grid.length;
    this.cols = grid[0].length;
  }

  generateRandomMaze(density: number = 0.3): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        if (cell.type !== 'start' && cell.type !== 'end') {
          if (Math.random() < density) {
            cell.type = 'wall';
          } else {
            cell.type = 'empty';
          }
          cell.isVisited = false;
          cell.isPath = false;
        }
      }
    }
  }

  generateRecursiveDivisionMaze(): void {
    // Clear the grid first
    this.clearWalls();
    
    // Add border walls
    this.addBorderWalls();
    
    // Start recursive division
    this.divide(1, 1, this.cols - 2, this.rows - 2, this.chooseOrientation(this.cols - 2, this.rows - 2));
  }

  private clearWalls(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        if (cell.type !== 'start' && cell.type !== 'end') {
          cell.type = 'empty';
          cell.isVisited = false;
          cell.isPath = false;
        }
      }
    }
  }

  private addBorderWalls(): void {
    // Top and bottom borders
    for (let col = 0; col < this.cols; col++) {
      if (this.grid[0][col].type !== 'start' && this.grid[0][col].type !== 'end') {
        this.grid[0][col].type = 'wall';
      }
      if (this.grid[this.rows - 1][col].type !== 'start' && this.grid[this.rows - 1][col].type !== 'end') {
        this.grid[this.rows - 1][col].type = 'wall';
      }
    }

    // Left and right borders
    for (let row = 0; row < this.rows; row++) {
      if (this.grid[row][0].type !== 'start' && this.grid[row][0].type !== 'end') {
        this.grid[row][0].type = 'wall';
      }
      if (this.grid[row][this.cols - 1].type !== 'start' && this.grid[row][this.cols - 1].type !== 'end') {
        this.grid[row][this.cols - 1].type = 'wall';
      }
    }
  }

  private chooseOrientation(width: number, height: number): 'horizontal' | 'vertical' {
    if (width < height) {
      return 'horizontal';
    } else if (height < width) {
      return 'vertical';
    } else {
      return Math.random() < 0.5 ? 'horizontal' : 'vertical';
    }
  }

  private divide(x: number, y: number, width: number, height: number, orientation: 'horizontal' | 'vertical'): void {
    if (width < 2 || height < 2) {
      return;
    }

    const horizontal = orientation === 'horizontal';

    // Where will the wall be drawn?
    const wx = x + (horizontal ? 0 : Math.floor(Math.random() * (width - 1)));
    const wy = y + (horizontal ? Math.floor(Math.random() * (height - 1)) : 0);

    // Where will the passage through the wall exist?
    const px = wx + (horizontal ? Math.floor(Math.random() * width) : 0);
    const py = wy + (horizontal ? 0 : Math.floor(Math.random() * height));

    // What direction will the wall be drawn?
    const dx = horizontal ? 1 : 0;
    const dy = horizontal ? 0 : 1;

    // How long will the wall be?
    const length = horizontal ? width : height;

    // What direction is perpendicular to the wall?
    const dir = horizontal ? 'vertical' : 'horizontal';

    // Draw the wall
    for (let i = 0; i < length; i++) {
      const wallX = wx + i * dx;
      const wallY = wy + i * dy;

      if (wallX < this.cols && wallY < this.rows) {
        const cell = this.grid[wallY][wallX];
        if (cell.type !== 'start' && cell.type !== 'end' && !(wallX === px && wallY === py)) {
          cell.type = 'wall';
        }
      }
    }

    // Recursively divide the areas on either side of the wall
    const nextOrientation = this.chooseOrientation(width, height);

    if (horizontal) {
      this.divide(x, y, width, wy - y + 1, nextOrientation);
      this.divide(x, wy + 1, width, y + height - wy - 1, nextOrientation);
    } else {
      this.divide(x, y, wx - x + 1, height, nextOrientation);
      this.divide(wx + 1, y, x + width - wx - 1, height, nextOrientation);
    }
  }

  generateSimpleMaze(): void {
    this.clearWalls();
    
    // Create a simple maze pattern
    for (let row = 2; row < this.rows - 2; row += 2) {
      for (let col = 2; col < this.cols - 2; col += 2) {
        const cell = this.grid[row][col];
        if (cell.type !== 'start' && cell.type !== 'end') {
          cell.type = 'wall';
        }

        // Add random extensions
        if (Math.random() < 0.5) {
          const direction = Math.floor(Math.random() * 4);
          let newRow = row;
          let newCol = col;

          switch (direction) {
            case 0: newRow = row - 1; break; // up
            case 1: newRow = row + 1; break; // down
            case 2: newCol = col - 1; break; // left
            case 3: newCol = col + 1; break; // right
          }

          if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
            const extensionCell = this.grid[newRow][newCol];
            if (extensionCell.type !== 'start' && extensionCell.type !== 'end') {
              extensionCell.type = 'wall';
            }
          }
        }
      }
    }
  }
}
