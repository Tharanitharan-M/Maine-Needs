import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// PATCH /api/admin/users/[uid]/admin - Toggle admin status
export async function PATCH(
  request: NextRequest,
  context: { params: { uid: string } }
): Promise<NextResponse> {
  try {
    const { isAdmin } = await request.json();
    
    // Get current user claims
    const user = await adminAuth.getUser(context.params.uid);
    const currentClaims = user.customClaims || {};
    
    // Update admin claim
    await adminAuth.setCustomUserClaims(context.params.uid, {
      ...currentClaims,
      admin: isAdmin
    });

    return NextResponse.json({ message: 'Admin status updated successfully' });
  } catch (error) {
    console.error('Error updating admin status:', error);
    return NextResponse.json(
      { error: 'Failed to update admin status' },
      { status: 500 }
    );
  }
} 