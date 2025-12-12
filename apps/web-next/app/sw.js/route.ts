import { NextResponse } from 'next/server';

// Return 404 for service worker requests to prevent errors
export async function GET() {
  return new NextResponse(null, { status: 404 });
}
