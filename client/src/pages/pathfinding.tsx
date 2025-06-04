import { useState, useEffect, useCallback } from 'react';
import { Route } from 'lucide-react';
import Grid from '@/components/pathfinding/Grid';
import ControlPanel from '@/components/pathfinding/ControlPanel';
import StatusBar from '@/components/pathfinding/StatusBar';
import SaveLoadGrid from '@/components/pathfinding/SaveLoadGrid';
import { 
  Cell, 
  Algorithm, 
  DrawingMode, 
  Position, 
  PathfindingStats,
  VisualizationStep 
} from '@/lib/pathfinding/types';
import { PathfindingAlgorithms } from '@/lib/pathfinding/algorithms';
import { MazeGenerator } from '@/lib/pathfinding/mazeGenerator';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const GRID_ROWS = 25;
const GRID_COLS = 50;

export default function PathfindingPage() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('astar');
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('wall');
  const [speed, setSpeed] = useState(50);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startPoint, setStartPoint] = useState<Position>({ row: 12, col: 5 });
  const [endPoint, setEndPoint] = useState<Position>({ row: 12, col: 44 });
  const [stats, setStats] = useState<PathfindingStats>({
    nodesVisited: 0,
    pathLength: 0,
    timeTaken: 0,
    totalCells: GRID_ROWS * GRID_COLS,
    wallCells: 0
  });
  const [status, setStatus] = useState<'ready' | 'running' | 'paused' | 'completed'>('ready');
  const [animationCleanup, setAnimationCleanup] = useState<(() => void) | null>(null);

  // Algorithm run saving mutation
  const saveAlgorithmRunMutation = useMutation({
    mutationFn: async (runData: any) => {
      const response = await fetch('/api/algorithm-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runData),
      });
      if (!response.ok) throw new Error('Failed to save algorithm run');
      return response.json();
    },
  });

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      const currentRow: Cell[] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        currentRow.push({
          row,
          col,
          type: 'empty',
          isVisited: false,
          isPath: false,
          distance: Infinity,
          heuristic: 0,
          fScore: Infinity,
          gScore: Infinity,
          parent: null
        });
      }
      newGrid.push(currentRow);
    }

    // Set start and end points
    newGrid[startPoint.row][startPoint.col].type = 'start';
    newGrid[endPoint.row][endPoint.col].type = 'end';

    setGrid(newGrid);
  }, [startPoint, endPoint]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  // Update wall count
  const updateWallCount = useCallback(() => {
    const wallCount = grid.flat().filter(cell => cell.type === 'wall').length;
    setStats(prev => ({ ...prev, wallCells: wallCount }));
  }, [grid]);

  useEffect(() => {
    updateWallCount();
  }, [grid, updateWallCount]);

  // Handle cell clicks
  const handleCellClick = (row: number, col: number) => {
    if (isRunning) return;

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      const cell = newGrid[row][col];

      switch (drawingMode) {
        case 'wall':
          if (cell.type !== 'start' && cell.type !== 'end') {
            cell.type = cell.type === 'wall' ? 'empty' : 'wall';
            cell.isVisited = false;
            cell.isPath = false;
          }
          break;
        case 'erase':
          if (cell.type !== 'start' && cell.type !== 'end') {
            cell.type = 'empty';
            cell.isVisited = false;
            cell.isPath = false;
          }
          break;
        case 'start':
          // Remove previous start
          newGrid.forEach(row => row.forEach(c => {
            if (c.type === 'start') c.type = 'empty';
          }));
          cell.type = 'start';
          cell.isVisited = false;
          cell.isPath = false;
          setStartPoint({ row, col });
          break;
        case 'end':
          // Remove previous end
          newGrid.forEach(row => row.forEach(c => {
            if (c.type === 'end') c.type = 'empty';
          }));
          cell.type = 'end';
          cell.isVisited = false;
          cell.isPath = false;
          setEndPoint({ row, col });
          break;
      }

      return newGrid;
    });
  };

  // Clear visited and path cells
  const clearVisualization = () => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => 
        row.map(cell => ({
          ...cell,
          isVisited: false,
          isPath: false
        }))
      );
      return newGrid;
    });
  };

  // Start visualization
  const startVisualization = async () => {
    if (isRunning) return;

    clearVisualization();
    setIsRunning(true);
    setIsPaused(false);
    setStatus('running');
    setStats(prev => ({ ...prev, nodesVisited: 0, pathLength: 0, timeTaken: 0 }));

    const startTime = Date.now();
    const algorithms = new PathfindingAlgorithms(grid);
    
    let steps: VisualizationStep[] = [];

    try {
      switch (selectedAlgorithm) {
        case 'astar':
          steps = await algorithms.astar(startPoint, endPoint);
          break;
        case 'dijkstra':
          steps = await algorithms.dijkstra(startPoint, endPoint);
          break;
        case 'bfs':
          steps = await algorithms.bfs(startPoint, endPoint);
          break;
        case 'dfs':
          steps = await algorithms.dfs(startPoint, endPoint);
          break;
      }

      console.log('Steps generated:', steps.length);

      // Animate the steps
      let visitedCount = 0;
      let pathLength = 0;
      let isAnimating = true;

      // Store cleanup function
      const cleanup = () => {
        isAnimating = false;
      };
      setAnimationCleanup(() => cleanup);

      for (let i = 0; i < steps.length && isAnimating; i++) {
        const step = steps[i];
        
        // Wait for delay
        await new Promise(resolve => setTimeout(resolve, 101 - speed));
        
        if (!isAnimating) break;

        setGrid(prevGrid => {
          const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
          const cell = newGrid[step.position.row][step.position.col];

          if (step.type === 'visit') {
            cell.isVisited = true;
            visitedCount++;
          } else if (step.type === 'path') {
            cell.isPath = true;
            pathLength++;
          }

          return newGrid;
        });

        setStats(prev => ({
          ...prev,
          nodesVisited: visitedCount,
          pathLength: pathLength
        }));
      }

      if (isAnimating) {
        const endTime = Date.now();
        const finalStats = {
          ...stats,
          timeTaken: endTime - startTime
        };
        setStats(finalStats);
        setStatus('completed');

        // Save algorithm run results to database
        const pathData = steps
          .filter(step => step.type === 'path')
          .map(step => step.position);

        saveAlgorithmRunMutation.mutate({
          algorithm: selectedAlgorithm,
          nodesVisited: visitedCount,
          pathLength: pathLength,
          timeTaken: endTime - startTime,
          success: pathLength > 0,
          pathData: pathData,
          gridId: null // Not associated with a saved grid
        });
      }

    } catch (error) {
      console.error('Pathfinding error:', error);
      setStatus('ready');
    } finally {
      setIsRunning(false);
      setAnimationCleanup(null);
    }
  };

  // Reset grid
  const resetGrid = () => {
    clearVisualization();
    setStats(prev => ({ ...prev, nodesVisited: 0, pathLength: 0, timeTaken: 0 }));
    setStatus('ready');
    setIsRunning(false);
    setIsPaused(false);
  };

  // Clear entire grid
  const clearGrid = () => {
    setGrid(prevGrid => {
      return prevGrid.map(row => 
        row.map(cell => {
          const newCell: Cell = {
            ...cell,
            type: (cell.type === 'start' || cell.type === 'end') ? cell.type : 'empty',
            isVisited: false,
            isPath: false
          };
          return newCell;
        })
      );
    });
    resetGrid();
  };

  // Generate random maze
  const generateRandomMaze = () => {
    if (isRunning) return;
    
    const mazeGenerator = new MazeGenerator(grid);
    mazeGenerator.generateRandomMaze(0.3);
    setGrid([...grid]);
    resetGrid();
  };

  // Generate recursive division maze
  const generateRecursiveMaze = () => {
    if (isRunning) return;
    
    const mazeGenerator = new MazeGenerator(grid);
    mazeGenerator.generateRecursiveDivisionMaze();
    setGrid([...grid]);
    resetGrid();
  };

  const pauseVisualization = () => {
    setIsPaused(true);
    setStatus('paused');
  };

  // Handle loading a saved grid
  const handleLoadGrid = (loadedGrid: Cell[][], loadedStart: Position, loadedEnd: Position) => {
    setGrid(loadedGrid);
    setStartPoint(loadedStart);
    setEndPoint(loadedEnd);
    resetGrid();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Route className="text-white w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pathfinding Visualizer</h1>
          </div>
          <div className="flex items-center space-x-4">
            <SaveLoadGrid
              grid={grid}
              startPoint={startPoint}
              endPoint={endPoint}
              onLoadGrid={handleLoadGrid}
            />
          </div>
          <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Start</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>End</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-800 rounded"></div>
              <span>Wall</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 rounded"></div>
              <span>Visited</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Path</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Control Panel */}
        <ControlPanel
          selectedAlgorithm={selectedAlgorithm}
          onAlgorithmChange={setSelectedAlgorithm}
          drawingMode={drawingMode}
          onDrawingModeChange={setDrawingMode}
          speed={speed}
          onSpeedChange={setSpeed}
          isRunning={isRunning}
          isPaused={isPaused}
          onStartVisualization={startVisualization}
          onPauseVisualization={pauseVisualization}
          onResetGrid={clearGrid}
          onGenerateRandomMaze={generateRandomMaze}
          onGenerateRecursiveMaze={generateRecursiveMaze}
          stats={stats}
        />

        {/* Grid Container */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Grid Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Grid Visualization</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Click and drag to draw walls</span>
                <div className="hidden sm:flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Shift</kbd>
                  <span>+ Click for start/end</span>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1">
              <Grid
                grid={grid}
                onCellClick={handleCellClick}
                drawingMode={drawingMode}
                isRunning={isRunning}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar
        algorithm={selectedAlgorithm}
        status={status}
        stats={stats}
        gridSize={{ rows: GRID_ROWS, cols: GRID_COLS }}
      />
    </div>
  );
}
