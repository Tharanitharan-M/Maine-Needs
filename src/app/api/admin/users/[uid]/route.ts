import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// DELETE /api/admin/users/[uid] - Delete a user
export async function DELETE(
  request: Request,
  context: { params: { uid: string } }
) {
  try {
    await adminAuth.deleteUser(context.params.uid);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 