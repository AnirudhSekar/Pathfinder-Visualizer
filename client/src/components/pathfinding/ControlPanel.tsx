import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Algorithm, DrawingMode, PathfindingStats } from '@/lib/pathfinding/types';
import AlgorithmCard from './AlgorithmCard';
import { Play, Pause, RotateCcw, Rabbit, Turtle, Shuffle, Grid3X3, Eraser } from 'lucide-react';

interface ControlPanelProps {
  selectedAlgorithm: Algorithm;
  onAlgorithmChange: (algorithm: Algorithm) => void;
  drawingMode: DrawingMode;
  onDrawingModeChange: (mode: DrawingMode) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  isRunning: boolean;
  isPaused: boolean;
  onStartVisualization: () => void;
  onPauseVisualization: () => void;
  onResetGrid: () => void;
  onGenerateRandomMaze: () => void;
  onGenerateRecursiveMaze: () => void;
  stats: PathfindingStats;
}

const algorithms = [
  { id: 'astar' as Algorithm, name: 'A* Search', description: 'Optimal & fast heuristic' },
  { id: 'dijkstra' as Algorithm, name: "Dijkstra's", description: 'Guaranteed shortest path' },
  { id: 'bfs' as Algorithm, name: 'Breadth-First', description: 'Unweighted shortest path' },
  { id: 'dfs' as Algorithm, name: 'Depth-First', description: 'Explores deeply first' }
];

export default function ControlPanel({
  selectedAlgorithm,
  onAlgorithmChange,
  drawingMode,
  onDrawingModeChange,
  speed,
  onSpeedChange,
  isRunning,
  isPaused,
  onStartVisualization,
  onPauseVisualization,
  onResetGrid,
  onGenerateRandomMaze,
  onGenerateRecursiveMaze,
  stats
}: ControlPanelProps) {
  const getDrawingModeButton = (mode: DrawingMode, label: string, icon: React.ReactNode, bgColor?: string) => (
    <Button
      variant={drawingMode === mode ? "default" : "outline"}
      size="sm"
      className={`p-3 flex flex-col items-center space-y-2 h-auto ${
        drawingMode === mode ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onClick={() => onDrawingModeChange(mode)}
    >
      {bgColor ? (
        <div className={`w-6 h-6 ${bgColor} rounded`}></div>
      ) : (
        icon
      )}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );

  return (
    <Card className="w-80 h-full shadow-lg border-r border-gray-200">
      <CardContent className="p-6 space-y-6 overflow-y-auto h-full">
        {/* Algorithm Selection */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Algorithm</h2>
          <div className="space-y-3">
            {algorithms.map((algo) => (
              <AlgorithmCard
                key={algo.id}
                algorithm={algo.id}
                name={algo.name}
                description={algo.description}
                isSelected={selectedAlgorithm === algo.id}
                onClick={onAlgorithmChange}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Visualization Controls */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Visualization</h2>
          <div className="space-y-4">
            {/* Speed Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Animation Speed</label>
              <div className="flex items-center space-x-3">
                <Turtle className="w-4 h-4 text-gray-400" />
                <Slider
                  value={[speed]}
                  onValueChange={(value) => onSpeedChange(value[0])}
                  max={100}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <Rabbit className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-center text-sm text-gray-600 mt-1">{speed}ms</div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="control-button w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={isRunning && !isPaused ? onPauseVisualization : onStartVisualization}
                disabled={isRunning && isPaused}
              >
                {isRunning && !isPaused ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Visualization
                  </>
                )}
              </Button>
              <Button
                className="control-button w-full bg-red-600 hover:bg-red-700 text-white font-medium"
                onClick={onResetGrid}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear Grid
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Drawing Tools */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Drawing Tools</h2>
          <div className="grid grid-cols-2 gap-3">
            {getDrawingModeButton('start', 'Start', null, 'bg-green-500')}
            {getDrawingModeButton('end', 'End', null, 'bg-red-500')}
            {getDrawingModeButton('wall', 'Wall', null, 'bg-gray-800')}
            {getDrawingModeButton('erase', 'Erase', <Eraser className="w-4 h-4 text-gray-600" />)}
          </div>
        </div>

        <Separator />

        {/* Maze Generation */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Maze Generation</h2>
          <div className="space-y-3">
            <Button
              className="control-button w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
              onClick={onGenerateRandomMaze}
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle Maze
            </Button>
            <Button
              className="control-button w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              onClick={onGenerateRecursiveMaze}
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Recursive Division
            </Button>
          </div>
        </div>

        <Separator />

        {/* Statistics */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nodes Visited:</span>
              <span className="font-medium">{stats.nodesVisited}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Path Length:</span>
              <span className="font-medium">{stats.pathLength}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time Taken:</span>
              <span className="font-medium">{stats.timeTaken}ms</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
