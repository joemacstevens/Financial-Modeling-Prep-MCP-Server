import { createMcpHandler } from "mcp-handler";
import { McpServerFactory } from "../../../dist/mcp-server-factory/index.js";
import { ServerModeEnforcer } from "../../../dist/server-mode-enforcer/index.js";
import type { SessionConfig } from "../../../dist/mcp-server-factory/McpServerFactory.js";

// Ensure server mode enforcement is initialized using environment defaults
ServerModeEnforcer.initialize(process.env, {});

const factory = new McpServerFactory();

const baseSessionConfig: SessionConfig = {
  FMP_TOOL_SETS: process.env.FMP_TOOL_SETS,
  DYNAMIC_TOOL_DISCOVERY: process.env.DYNAMIC_TOOL_DISCOVERY,
};

const resolvedMode = factory.determineMode(baseSessionConfig);
const serverInfo = factory.getServerInfo(resolvedMode);

const handler = createMcpHandler(
  async (server) => {
    factory.configureServer(
      server,
      {
        config: baseSessionConfig,
        serverAccessToken: process.env.FMP_ACCESS_TOKEN,
      },
      resolvedMode
    );
  },
  {
    serverInfo,
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== "production",
  }
);

export const runtime = "nodejs";
export const preferredRegion = "iad1";

export { handler as GET, handler as POST, handler as DELETE };
