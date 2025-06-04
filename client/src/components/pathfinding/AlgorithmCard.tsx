import { Algorithm } from '@/lib/pathfinding/types';
import { Star, Route, Map, ArrowDown } from 'lucide-react';

interface AlgorithmCardProps {
  algorithm: Algorithm;
  name: string;
  description: string;
  isSelected: boolean;
  onClick: (algorithm: Algorithm) => void;
}

const algorithmIcons = {
  astar: Star,
  dijkstra: Route,
  bfs: Map,
  dfs: ArrowDown
} as const;

const algorithmColors = {
  astar: 'text-blue-600',
  dijkstra: 'text-green-600',
  bfs: 'text-purple-600',
  dfs: 'text-orange-600'
} as const;

export default function AlgorithmCard({
  algorithm,
  name,
  description,
  isSelected,
  onClick
}: AlgorithmCardProps) {
  const Icon = algorithmIcons[algorithm];
  const iconColor = algorithmColors[algorithm];

  return (
    <div
      className={`algorithm-card p-4 rounded-lg cursor-pointer ${
        isSelected ? 'selected' : ''
      }`}
      onClick={() => onClick(algorithm)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}
