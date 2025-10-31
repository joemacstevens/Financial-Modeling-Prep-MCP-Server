import express from "express";
import serverless from "serverless-http";
import { FmpMcpServer } from "../dist/server/FmpMcpServer.js";

const app = express();

const mcpServer = new FmpMcpServer({
  accessToken: process.env.FMP_ACCESS_TOKEN,
  cacheOptions: {
    maxSize: 25,
    ttl: 1000 * 60 * 60 * 2, // 2 hours
  },
});

app.use("/", mcpServer.app);

// ✅ Vercel requires a default export
export default serverless(app);
