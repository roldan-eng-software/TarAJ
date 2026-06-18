// Session API Route Handler
// Provides current session information for client

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/src/domain/auth/auth-service';

// TODO: Implement proper session extraction from cookies/headers
export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const sessionUser = await getSessionUser(token);

    if (!sessionUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json(sessionUser);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }
}
