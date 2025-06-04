import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const grids = pgTable("grids", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  gridData: jsonb("grid_data").notNull(), // Stores the complete grid configuration
  rows: integer("rows").notNull().default(25),
  cols: integer("cols").notNull().default(50),
  startPoint: jsonb("start_point").notNull(), // {row: number, col: number}
  endPoint: jsonb("end_point").notNull(), // {row: number, col: number}
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const algorithmRuns = pgTable("algorithm_runs", {
  id: serial("id").primaryKey(),
  gridId: integer("grid_id").references(() => grids.id),
  userId: integer("user_id").references(() => users.id),
  algorithm: text("algorithm").notNull(), // 'astar', 'dijkstra', 'bfs', 'dfs'
  nodesVisited: integer("nodes_visited").notNull(),
  pathLength: integer("path_length").notNull(),
  timeTaken: integer("time_taken").notNull(), // in milliseconds
  success: boolean("success").notNull(),
  pathData: jsonb("path_data"), // Stores the path coordinates
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  grids: many(grids),
  algorithmRuns: many(algorithmRuns),
}));

export const gridsRelations = relations(grids, ({ one, many }) => ({
  user: one(users, {
    fields: [grids.userId],
    references: [users.id],
  }),
  algorithmRuns: many(algorithmRuns),
}));

export const algorithmRunsRelations = relations(algorithmRuns, ({ one }) => ({
  grid: one(grids, {
    fields: [algorithmRuns.gridId],
    references: [grids.id],
  }),
  user: one(users, {
    fields: [algorithmRuns.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGridSchema = createInsertSchema(grids).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlgorithmRunSchema = createInsertSchema(algorithmRuns).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGrid = z.infer<typeof insertGridSchema>;
export type Grid = typeof grids.$inferSelect;
export type InsertAlgorithmRun = z.infer<typeof insertAlgorithmRunSchema>;
export type AlgorithmRun = typeof algorithmRuns.$inferSelect;
