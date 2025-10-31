// api/index.js
import express from "express";
import serverless from "serverless-http";
import { FmpMcpServer } from "../dist/server/FmpMcpServer.js";

const app = express();

// ✅ Health check route so /api shows a confirmation
app.get("/", (req, res) => {
  res.json({
    status: "✅ FMP MCP Server running",
    time: new Date().toISOString(),
  });
});

// ✅ Create and mount your FMP MCP server
const mcpServer = new FmpMcpServer({
  accessToken: process.env.FMP_ACCESS_TOKEN,
  cacheOptions: {
    maxSize: 25,
    ttl: 1000 * 60 * 60 * 2, // 2 hours
  },
});

// Mount MCP routes at /api/mcp or root-level if you prefer
app.use("/mcp", mcpServer.app);

// ✅ Vercel requires a *default export* that is a function
export default serverless(app);
