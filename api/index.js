import express from "express";
import serverless from "serverless-http";
import { FmpMcpServer } from "../dist/server/FmpMcpServer.js";

// Create an Express app
const app = express();

// Simple health check route
app.get("/", (req, res) => {
  res.json({ status: "ok", source: "vercel", time: new Date().toISOString() });
});

// Initialize FMP MCP server
const mcpServer = new FmpMcpServer({
  accessToken: process.env.FMP_ACCESS_TOKEN,
  cacheOptions: {
    maxSize: 25,
    ttl: 1000 * 60 * 60 * 2,
  },
});

// Instead of mcpServer.start(PORT), mount its router directly
app.use("/mcp", mcpServer.app);

// Export for Vercel
export default serverless(app);
