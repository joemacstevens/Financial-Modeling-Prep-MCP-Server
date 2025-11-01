import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { createMcpHandler } from "mcp-handler";
import { McpServerFactory } from "../dist/mcp-server-factory/index.js";
import { ServerModeEnforcer } from "../dist/server-mode-enforcer/index.js";
import type { SessionConfig } from "../dist/mcp-server-factory/McpServerFactory.js";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

ServerModeEnforcer.initialize(process.env, {});

const factory = new McpServerFactory();

const baseSessionConfig: SessionConfig = {
  FMP_TOOL_SETS: process.env.FMP_TOOL_SETS,
  DYNAMIC_TOOL_DISCOVERY: process.env.DYNAMIC_TOOL_DISCOVERY,
};

const resolvedMode = factory.determineMode(baseSessionConfig);
const serverInfo = factory.getServerInfo(resolvedMode);

const fetchHandler = createMcpHandler(
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

async function nodeRequestToWebRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? "localhost";
  const protocol = host.includes("localhost") ? "http" : "https";
  const url = `${protocol}://${host}${req.url ?? ""}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else {
      headers.set(key, value);
    }
  }

  const method = req.method ?? "GET";
  if (method === "GET" || method === "HEAD") {
    return new Request(url, { method, headers });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  return new Request(url, {
    method,
    headers,
    body,
  });
}

async function writeWebResponseToNode(
  res: ServerResponse,
  response: Response
): Promise<void> {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = response.body;
  if (!body) {
    res.end();
    return;
  }

  if (typeof Readable.fromWeb === "function") {
    const stream = Readable.fromWeb(body as unknown as NodeReadableStream);
    stream.on("error", (error) => {
      res.destroy(error as Error);
    });
    stream.pipe(res);
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const webRequest = await nodeRequestToWebRequest(req);
    const webResponse = await fetchHandler(webRequest);
    await writeWebResponseToNode(res, webResponse);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    );
  }
}
