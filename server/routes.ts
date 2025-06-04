import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGridSchema, insertAlgorithmRunSchema, type AlgorithmRun } from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Grid routes
  app.get("/api/grids", async (req: any, res) => {
    try {
      const publicGrids = await storage.getPublicGrids();
      res.json(publicGrids);
    } catch (error) {
      console.error("Error fetching grids:", error);
      res.status(500).json({ error: "Failed to fetch grids" });
    }
  });

  app.get("/api/grids/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const grid = await storage.getGrid(id);
      
      if (!grid) {
        return res.status(404).json({ error: "Grid not found" });
      }
      
      res.json(grid);
    } catch (error) {
      console.error("Error fetching grid:", error);
      res.status(500).json({ error: "Failed to fetch grid" });
    }
  });

  app.post("/api/grids", async (req: any, res) => {
    try {
      const gridData = insertGridSchema.parse({
        ...req.body,
        userId: null // Allow anonymous saves
      });

      const grid = await storage.createGrid(gridData);
      res.status(201).json(grid);
    } catch (error) {
      console.error("Error creating grid:", error);
      res.status(400).json({ error: "Failed to create grid" });
    }
  });

  app.post("/api/algorithm-runs", async (req: any, res) => {
    try {
      const runData = insertAlgorithmRunSchema.parse({
        ...req.body,
        userId: null // Allow anonymous saves
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
