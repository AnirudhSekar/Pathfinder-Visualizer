import { Algorithm, PathfindingStats } from '@/lib/pathfinding/types';

interface StatusBarProps {
  algorithm: Algorithm;
  status: 'ready' | 'running' | 'paused' | 'completed';
  stats: PathfindingStats;
  gridSize: { rows: number; cols: number };
}

const algorithmNames = {
  astar: 'A* Search',
  dijkstra: "Dijkstra's",
  bfs: 'Breadth-First',
  dfs: 'Depth-First'
};

const statusInfo = {
  ready: { color: 'bg-green-500', text: 'Ready to visualize' },
  running: { color: 'bg-orange-500 animate-pulse', text: 'Visualizing...' },
  paused: { color: 'bg-yellow-500', text: 'Paused' },
  completed: { color: 'bg-green-500', text: 'Pathfinding complete!' }
};

export default function StatusBar({ algorithm, status, stats, gridSize }: StatusBarProps) {
  const statusDisplay = statusInfo[status];

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${statusDisplay.color} rounded-full`}></div>
            <span className="text-gray-600">{statusDisplay.text}</span>
          </div>
          <div className="text-gray-500">
            Algorithm: {algorithmNames[algorithm]}
          </div>
        </div>
        <div className="flex items-center space-x-4 text-gray-500">
          <span>Grid: {gridSize.rows}×{gridSize.cols}</span>
          <span>|</span>
          <span>{stats.totalCells.toLocaleString()} cells</span>
          <span>|</span>
          <span>{stats.wallCells} walls</span>
        </div>
      </div>
    </footer>
  );
}
