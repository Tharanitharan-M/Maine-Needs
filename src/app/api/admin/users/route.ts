import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// GET /api/admin/users - List all users
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const listUsersResult = await adminAuth.listUsers();
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.customClaims?.admin || false,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { email, name, isAdmin } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      displayName: name,
    });

    if (isAdmin) {
      await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        isAdmin,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 