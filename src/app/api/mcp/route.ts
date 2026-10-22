import { handleMcpRequest } from "@/lib/mcp-server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit(request, "mcp", 120, 60);
  if (limited) return limited;
  return handleMcpRequest(request);
}

export async function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
