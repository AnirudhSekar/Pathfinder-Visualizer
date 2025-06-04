import { useEffect, useRef, useState } from 'react';
import { Cell, DrawingMode, Position } from '@/lib/pathfinding/types';

interface GridProps {
  grid: Cell[][];
  onCellClick: (row: number, col: number) => void;
  drawingMode: DrawingMode;
  isRunning: boolean;
}

export default function Grid({ grid, onCellClick, drawingMode, isRunning }: GridProps) {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const getCellClasses = (cell: Cell): string => {
    const baseClasses = 'grid-cell w-3 h-3 border border-gray-200';
    
    if (cell.type === 'start') return `${baseClasses} start`;
    if (cell.type === 'end') return `${baseClasses} end`;
    if (cell.type === 'wall') return `${baseClasses} wall`;
    if (cell.isPath) return `${baseClasses} path`;
    if (cell.isVisited) return `${baseClasses} visited`;
    
    return `${baseClasses} bg-white`;
  };

  const handleMouseDown = (row: number, col: number) => {
    if (isRunning) return;
    setIsMouseDown(true);
    onCellClick(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isRunning) return;
    if (isMouseDown && (drawingMode === 'wall' || drawingMode === 'erase')) {
      setIsDragging(true);
      onCellClick(row, col);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      setIsDragging(false);
    };

    const handleSelectStart = (e: Event) => {
      if (isDragging) e.preventDefault();
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [isDragging]);

  const getCellTitle = (cell: Cell): string => {
    if (cell.type === 'start') return 'Start Point';
    if (cell.type === 'end') return 'End Point';
    if (cell.type === 'wall') return 'Wall';
    if (cell.isPath) return 'Shortest Path';
    if (cell.isVisited) return 'Visited';
    return `Cell (${cell.row}, ${cell.col})`;
  };

  if (!grid || grid.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p>Grid not initialized</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-full max-h-full overflow-auto">
        <div
          ref={gridRef}
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${grid[0]?.length || 50}, 12px)`,
            userSelect: 'none'
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getCellClasses(cell)}
                title={getCellTitle(cell)}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                onMouseUp={handleMouseUp}
                style={{
                  cursor: isRunning ? 'not-allowed' : 'pointer'
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
