import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGridSchema, insertAlgorithmRunSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Grid routes
  app.get("/api/grids", async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (userId) {
        // Get user's grids and public grids
        const [userGrids, publicGrids] = await Promise.all([
          storage.getGridsByUser(userId),
          storage.getPublicGrids()
        ]);
        
        // Combine and deduplicate
        const allGrids = [...userGrids];
        publicGrids.forEach(grid => {
          if (!allGrids.find(g => g.id === grid.id)) {
            allGrids.push(grid);
          }
        });
        
        res.json(allGrids);
      } else {
        // Only public grids for non-authenticated users
        const publicGrids = await storage.getPublicGrids();
        res.json(publicGrids);
      }
    } catch (error) {
      console.error("Error fetching grids:", error);
      res.status(500).json({ error: "Failed to fetch grids" });
    }
  });

  app.get("/api/grids/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const grid = await storage.getGrid(id);
      
      if (!grid) {
        return res.status(404).json({ error: "Grid not found" });
      }
      
      // Check if user can access this grid
      const userId = req.user?.id;
      if (!grid.isPublic && grid.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(grid);
    } catch (error) {
      console.error("Error fetching grid:", error);
      res.status(500).json({ error: "Failed to fetch grid" });
    }
  });

  app.post("/api/grids", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const gridData = insertGridSchema.parse({
        ...req.body,
        userId
      });

      const grid = await storage.createGrid(gridData);
      res.status(201).json(grid);
    } catch (error) {
      console.error("Error creating grid:", error);
      res.status(400).json({ error: "Failed to create grid" });
    }
  });

  app.put("/api/grids/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user owns this grid
      const existingGrid = await storage.getGrid(id);
      if (!existingGrid || existingGrid.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateData = insertGridSchema.partial().parse(req.body);
      const grid = await storage.updateGrid(id, updateData);
      
      if (!grid) {
        return res.status(404).json({ error: "Grid not found" });
      }
      
      res.json(grid);
    } catch (error) {
      console.error("Error updating grid:", error);
      res.status(400).json({ error: "Failed to update grid" });
    }
  });

  app.delete("/api/grids/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user owns this grid
      const existingGrid = await storage.getGrid(id);
      if (!existingGrid || existingGrid.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const success = await storage.deleteGrid(id);
      if (!success) {
        return res.status(404).json({ error: "Grid not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting grid:", error);
      res.status(500).json({ error: "Failed to delete grid" });
    }
  });

  // Algorithm run routes
  app.get("/api/algorithm-runs", async (req, res) => {
    try {
      const userId = req.user?.id;
      const gridId = req.query.gridId ? parseInt(req.query.gridId as string) : undefined;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      let runs;
      if (gridId) {
        runs = await storage.getAlgorithmRunsByGrid(gridId);
        // Filter to only show runs from grids the user can access
        const grid = await storage.getGrid(gridId);
        if (grid && (grid.isPublic || grid.userId === userId)) {
          runs = runs.filter(run => run.gridId === gridId);
        } else {
          runs = [];
        }
      } else {
        runs = await storage.getAlgorithmRunsByUser(userId);
      }
      
      res.json(runs);
    } catch (error) {
      console.error("Error fetching algorithm runs:", error);
      res.status(500).json({ error: "Failed to fetch algorithm runs" });
    }
  });

  app.post("/api/algorithm-runs", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const runData = insertAlgorithmRunSchema.parse({
        ...req.body,
        userId
      });

      const run = await storage.createAlgorithmRun(runData);
      res.status(201).json(run);
    } catch (error) {
      console.error("Error creating algorithm run:", error);
      res.status(400).json({ error: "Failed to create algorithm run" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
