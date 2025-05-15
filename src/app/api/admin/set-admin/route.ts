import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await adminAuth.getUserByEmail(email);

    // Set custom claims
    await adminAuth.setCustomUserClaims(user.uid, {
      admin: true
    });

    return NextResponse.json({
      message: `Success! ${email} has been set as an admin.`
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 