import { users, grids, algorithmRuns, type User, type InsertUser, type Grid, type InsertGrid, type AlgorithmRun, type InsertAlgorithmRun } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Grid operations
  getGrid(id: number): Promise<Grid | undefined>;
  getGridsByUser(userId: number): Promise<Grid[]>;
  getPublicGrids(): Promise<Grid[]>;
  createGrid(grid: InsertGrid): Promise<Grid>;
  updateGrid(id: number, grid: Partial<InsertGrid>): Promise<Grid | undefined>;
  deleteGrid(id: number): Promise<boolean>;
  
  // Algorithm run operations
  getAlgorithmRun(id: number): Promise<AlgorithmRun | undefined>;
  getAlgorithmRunsByGrid(gridId: number): Promise<AlgorithmRun[]>;
  getAlgorithmRunsByUser(userId: number): Promise<AlgorithmRun[]>;
  createAlgorithmRun(run: InsertAlgorithmRun): Promise<AlgorithmRun>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Grid operations
  async getGrid(id: number): Promise<Grid | undefined> {
    const [grid] = await db.select().from(grids).where(eq(grids.id, id));
    return grid || undefined;
  }

  async getGridsByUser(userId: number): Promise<Grid[]> {
    return await db.select().from(grids).where(eq(grids.userId, userId));
  }

  async getPublicGrids(): Promise<Grid[]> {
    return await db.select().from(grids).where(eq(grids.isPublic, true));
  }

  async createGrid(grid: InsertGrid): Promise<Grid> {
    const [newGrid] = await db
      .insert(grids)
      .values(grid)
      .returning();
    return newGrid;
  }

  async updateGrid(id: number, grid: Partial<InsertGrid>): Promise<Grid | undefined> {
    const [updatedGrid] = await db
      .update(grids)
      .set({ ...grid, updatedAt: new Date() })
      .where(eq(grids.id, id))
      .returning();
    return updatedGrid || undefined;
  }

  async deleteGrid(id: number): Promise<boolean> {
    const result = await db.delete(grids).where(eq(grids.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Algorithm run operations
  async getAlgorithmRun(id: number): Promise<AlgorithmRun | undefined> {
    const [run] = await db.select().from(algorithmRuns).where(eq(algorithmRuns.id, id));
    return run || undefined;
  }

  async getAlgorithmRunsByGrid(gridId: number): Promise<AlgorithmRun[]> {
    return await db.select().from(algorithmRuns).where(eq(algorithmRuns.gridId, gridId));
  }

  async getAlgorithmRunsByUser(userId: number): Promise<AlgorithmRun[]> {
    return await db.select().from(algorithmRuns).where(eq(algorithmRuns.userId, userId));
  }

  async createAlgorithmRun(run: InsertAlgorithmRun): Promise<AlgorithmRun> {
    const [newRun] = await db
      .insert(algorithmRuns)
      .values(run)
      .returning();
    return newRun;
  }
}

export const storage = new DatabaseStorage();
