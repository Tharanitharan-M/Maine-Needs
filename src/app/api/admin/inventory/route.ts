import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

// GET /api/admin/inventory - List all inventory items
export async function GET() {
  const snapshot = await getDocs(collection(db, 'inventory'));
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ items });
}

// POST /api/admin/inventory - Add a new inventory item
export async function POST(request: NextRequest) {
  const data = await request.json();
  const ref = await addDoc(collection(db, 'inventory'), {
    ...data,
    lastUpdated: new Date().toISOString(),
  });
  return NextResponse.json({ id: ref.id });
}

// PATCH /api/admin/inventory - Update an inventory item
export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing item id' }, { status: 400 });
  }
  await updateDoc(doc(db, 'inventory', id), {
    ...updates,
    lastUpdated: new Date().toISOString(),
  });
  return NextResponse.json({ message: 'Inventory item updated' });
}

// DELETE /api/admin/inventory - Delete an inventory item
export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing item id' }, { status: 400 });
  }
  await deleteDoc(doc(db, 'inventory', id));
  return NextResponse.json({ message: 'Inventory item deleted' });
}
