import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pure Web3 Approach:
  // Data is served directly from The Graph subgraph, no manual SQL indexing needed.
  // This endpoint is kept for architecture completeness and fallback triggers.
  return NextResponse.json({ 
    ok: true, 
    message: "Subgraph handles indexing automatically via GraphQL",
    network: "Base Sepolia",
    subgraph: "v0.0.1" 
  });
}
