import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, FolderOpen, Download, Upload } from 'lucide-react';
import { Cell, Position } from '@/lib/pathfinding/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SaveLoadGridProps {
  grid: Cell[][];
  startPoint: Position;
  endPoint: Position;
  onLoadGrid: (grid: Cell[][], startPoint: Position, endPoint: Position) => void;
}

interface SavedGrid {
  id: number;
  name: string;
  description: string;
  gridData: Cell[][];
  rows: number;
  cols: number;
  startPoint: Position;
  endPoint: Position;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SaveLoadGrid({ grid, startPoint, endPoint, onLoadGrid }: SaveLoadGridProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [gridName, setGridName] = useState('');
  const [gridDescription, setGridDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch saved grids
  const { data: savedGrids, isLoading } = useQuery({
    queryKey: ['/api/grids'],
    enabled: loadDialogOpen,
  });

  // Save grid mutation
  const saveGridMutation = useMutation({
    mutationFn: async (gridData: any) => {
      const response = await fetch('/api/grids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gridData),
      });
      if (!response.ok) throw new Error('Failed to save grid');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grids'] });
      setSaveDialogOpen(false);
      setGridName('');
      setGridDescription('');
      toast({
        title: "Grid Saved",
        description: "Your grid configuration has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save grid configuration.",
        variant: "destructive",
      });
    },
  });

  const handleSaveGrid = () => {
    if (!gridName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your grid.",
        variant: "destructive",
      });
      return;
    }

    const gridData = {
      name: gridName.trim(),
      description: gridDescription.trim(),
      gridData: grid,
      rows: grid.length,
      cols: grid[0]?.length || 0,
      startPoint,
      endPoint,
      isPublic,
    };

    saveGridMutation.mutate(gridData);
  };

  const handleLoadGrid = (savedGrid: SavedGrid) => {
    onLoadGrid(savedGrid.gridData, savedGrid.startPoint, savedGrid.endPoint);
    setLoadDialogOpen(false);
    toast({
      title: "Grid Loaded",
      description: `Loaded grid: ${savedGrid.name}`,
    });
  };

  const exportGrid = () => {
    const exportData = {
      name: gridName || 'Exported Grid',
      gridData: grid,
      startPoint,
      endPoint,
      rows: grid.length,
      cols: grid[0]?.length || 0,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportData.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Grid Exported",
      description: "Grid has been downloaded as a JSON file.",
    });
  };

  const importGrid = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.gridData && importData.startPoint && importData.endPoint) {
          onLoadGrid(importData.gridData, importData.startPoint, importData.endPoint);
          toast({
            title: "Grid Imported",
            description: `Imported grid: ${importData.name || 'Unknown'}`,
          });
        } else {
          throw new Error('Invalid grid format');
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "The selected file is not a valid grid export.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="flex space-x-2">
      {/* Save Grid Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save Grid</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Grid Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grid Name *
              </label>
              <Input
                value={gridName}
                onChange={(e) => setGridName(e.target.value)}
                placeholder="Enter grid name..."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={gridDescription}
                onChange={(e) => setGridDescription(e.target.value)}
                placeholder="Optional description..."
                className="w-full h-20"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this grid public
              </label>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleSaveGrid}
                disabled={saveGridMutation.isPending}
                className="flex-1"
              >
                {saveGridMutation.isPending ? 'Saving...' : 'Save Grid'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Grid Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4" />
            <span>Load Grid</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Load Saved Grid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading saved grids...</div>
            ) : savedGrids && Array.isArray(savedGrids) && savedGrids.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {savedGrids.map((savedGrid: SavedGrid) => (
                  <Card
                    key={savedGrid.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleLoadGrid(savedGrid)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{savedGrid.name}</CardTitle>
                        <div className="flex space-x-2">
                          {savedGrid.isPublic && (
                            <Badge variant="secondary" className="text-xs">
                              Public
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {savedGrid.rows}×{savedGrid.cols}
                          </Badge>
                        </div>
                      </div>
                      {savedGrid.description && (
                        <CardDescription className="text-sm">
                          {savedGrid.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-gray-500">
                        Created: {new Date(savedGrid.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No saved grids found. Save your first grid configuration!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Grid */}
      <Button
        variant="outline"
        size="sm"
        onClick={exportGrid}
        className="flex items-center space-x-2"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </Button>

      {/* Import Grid */}
      <label className="cursor-pointer">
        <Button variant="outline" size="sm" className="flex items-center space-x-2" asChild>
          <div>
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </div>
        </Button>
        <input
          type="file"
          accept=".json"
          onChange={importGrid}
          className="hidden"
        />
      </label>
    </div>
  );
}