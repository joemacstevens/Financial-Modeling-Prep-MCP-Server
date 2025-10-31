import express from "express";
import serverless from "serverless-http";
import { FmpMcpServer } from "../dist/server/FmpMcpServer.js"; // points to compiled output

// Initialize Express
const app = express();

// Create the MCP server using your environment variable
const mcpServer = new FmpMcpServer({
  accessToken: process.env.FMP_ACCESS_TOKEN, // set this in Vercel → Settings → Environment Variables
  cacheOptions: {
    maxSize: 25,
    ttl: 1000 * 60 * 60 * 2, // 2 hours
  },
});

// Instead of starting a standalone listener, just mount it to Express
// The class exposes an internal Express instance at mcpServer.app
app.use("/", mcpServer.app);

// Export handler for Vercel’s serverless runtime
export const handler = serverless(app);
