import { createHash, randomBytes } from "node:crypto";

export const MCP_TOKEN_PREFIX = "dropy_mcp_";

export function generateMcpToken() {
  const token = `${MCP_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  return { token, hash: hashMcpToken(token), prefix: token.slice(0, MCP_TOKEN_PREFIX.length + 6) };
}

export function hashMcpToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
