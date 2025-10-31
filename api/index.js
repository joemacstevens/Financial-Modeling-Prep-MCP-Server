import express from "express";
import serverless from "serverless-http";
import { FmpMcpServer } from "../dist/server/FmpMcpServer.js";

const app = express();

// ✅ Health check route — keeps your /api endpoint working
app.get("/", (req, res) => {
  res.json({
    status: "✅ FMP MCP Server running",
    time: new Date().toISOString(),
  });
});

// ✅ Initialize your MCP server and mount it under /mcp
const mcpServer = new FmpMcpServer({
  accessToken: process.env.FMP_ACCESS_TOKEN,
  cacheOptions: {
    maxSize: 25,
    ttl: 1000 * 60 * 60 * 2, // 2 hours
  },
});

app.use("/mcp", mcpServer.app);

// ✅ Vercel requires a default export that is a function
export default serverless(app);
