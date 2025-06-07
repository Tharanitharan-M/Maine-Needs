'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  description?: string;
  location?: string;
}

interface RequestItem {
  category?: string;
  inventoryId: string;
  quantity: number;
  notes?: string;
}

export default function RequestItemsForm() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [items, setItems] = useState<RequestItem[]>([{ category: '', inventoryId: '', quantity: 1, notes: '' }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'inventory'));
        setInventory(
          snap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            quantity: doc.data().quantity,
            category: doc.data().category,
            description: doc.data().description,
            location: doc.data().location,
          }))
        );
      } catch {
        toast.error('Failed to fetch inventory');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Helper to get unique categories from inventory
  const getCategories = () =>
    Array.from(new Set(inventory.map(i => i.category).filter(Boolean)));

  // Helper to get inventory for a category
  const getInventoryForCategory = (category: string) =>
    inventory.filter(inv => inv.category === category && (inv.quantity > 0));

  const handleItemFieldChange = (
    idx: number,
    field: 'category' | 'inventoryId' | 'quantity' | 'notes',
    value: string | number
  ) => {
    setItems(items =>
      items.map((item, i) => {
        if (i !== idx) return item;
        if (field === 'category') {
          // Reset inventoryId if category changes
          return { ...item, category: value as string, inventoryId: '', quantity: 1, notes: '' };
        }
        return { ...item, [field]: field === 'quantity' ? Number(value) : value };
      })
    );
  };

  const handleAddItem = () => {
    setItems(items => [...items, { category: '', inventoryId: '', quantity: 1, notes: '' }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items => items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate: only allow items from inventory and check available quantity
    for (const item of items) {
      const inv = inventory.find(inv => inv.id === item.inventoryId);
      if (!inv) {
        toast.error('Please select a valid inventory item.');
        return;
      }
      if (item.quantity < 1 || item.quantity > inv.quantity) {
        toast.error(`Invalid quantity for "${inv.name}". Available: ${inv.quantity}`);
        return;
      }
    }
    try {
      await addDoc(collection(db, 'requests'), {
        items: items.map(item => ({
          inventoryId: item.inventoryId,
          name: inventory.find(inv => inv.id === item.inventoryId)?.name || '',
          quantity: item.quantity,
          notes: item.notes || '',
        })),
        status: 'pending',
        submittedAt: new Date().toISOString(),
        caseworker: user
          ? {
              name: user.displayName || user.email || '',
              email: user.email || '',
              uid: user.uid,
            }
          : {},
      });
      toast.success('Request submitted successfully');
      setItems([{ category: '', inventoryId: '', quantity: 1, notes: '' }]);
    } catch {
      toast.error('Failed to submit request');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-[#003366] mb-2">Request Items</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {items.map((item, idx) => {
          const categories = getCategories();
          const availableInventory = item.category
            ? getInventoryForCategory(item.category)
            : [];
          return (
            <div key={idx} className="flex flex-col md:flex-row gap-4 items-end bg-[#f5f7fa] rounded-lg p-4 border border-[#e0e7ff]">
              <div>
                <label className="block text-sm font-semibold text-[#003366] mb-1">Category</label>
                <select
                  value={item.category || ''}
                  onChange={e => handleItemFieldChange(idx, 'category', e.target.value)}
                  required
                  className="w-40 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] bg-white text-[#003366] font-semibold"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-[#003366] mb-1">Inventory Item</label>
                <select
                  value={item.inventoryId}
                  onChange={e => handleItemFieldChange(idx, 'inventoryId', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] bg-white text-[#003366] font-semibold"
                  disabled={!item.category}
                >
                  <option value="">
                    {item.category ? "Select item" : "Select a category first"}
                  </option>
                  {item.category &&
                    availableInventory.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} (Available: {inv.quantity})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#003366] mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={
                    inventory.find(inv => inv.id === item.inventoryId)?.quantity ?? 1
                  }
                  value={item.quantity}
                  onChange={e => handleItemFieldChange(idx, 'quantity', e.target.value)}
                  required
                  className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-[#003366] font-semibold"
                  placeholder="Qty"
                  disabled={!item.inventoryId}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-[#003366] mb-1">Notes</label>
                <textarea
                  value={item.notes || ''}
                  onChange={e => handleItemFieldChange(idx, 'notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-[#003366]"
                  placeholder="Notes (optional)"
                  rows={2}
                />
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="text-red-600 hover:text-red-800 font-bold px-2 text-xl"
                  aria-label="Remove item"
                  title="Remove item"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleAddItem}
            className="text-blue-600 hover:underline text-sm font-semibold"
          >
            + Add another item
          </button>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="submit"
            className="bg-[#003366] text-white px-6 py-2 rounded-md hover:bg-[#0052A3] font-semibold"
            disabled={loading}
          >
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
