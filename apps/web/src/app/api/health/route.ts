import { NextResponse } from 'next/server';

/**
 * Health check endpoint for NetworkMonitor reachability probing
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'structpaper-web',
    timestamp: new Date().toISOString(),
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Service-Status': 'healthy',
    },
  });
}
