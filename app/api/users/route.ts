// API Route to fetch active users list (accessible to any authenticated user)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { adminDb } from '@/src/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const snapshot = await adminDb
      .collection('users')
      .where('status', '==', 'active')
      .get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        displayName: data.displayName || 'Sem nome',
        email: data.email || '',
        roleId: data.roleId || 'internal_reader',
      };
    });

    // Sort by name in memory
    users.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users list:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
