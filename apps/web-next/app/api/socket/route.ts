import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Socket.IO endpoint',
    instructions: 'Connect using Socket.IO client with path: /api/socket',
  });
}
