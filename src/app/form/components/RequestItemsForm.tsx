'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface Item {
  name: string;
  quantity: number;
}

interface FamilyRequest {
  clientName: string;
  items: Item[];
  notes: string;
}

export default function RequestItemsForm() {
  const { user } = useAuth();
  const [families, setFamilies] = useState<FamilyRequest[]>([
    { clientName: '', items: [{ name: '', quantity: 1 }], notes: '' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleFamilyChange = (idx: number, field: keyof FamilyRequest, value: any) => {
    setFamilies(families =>
      families.map((fam, i) =>
        i === idx ? { ...fam, [field]: value } : fam
      )
    );
  };

  const handleItemChange = (familyIdx: number, itemIdx: number, field: keyof Item, value: string | number) => {
    setFamilies(families =>
      families.map((fam, i) =>
        i === familyIdx
          ? {
              ...fam,
              items: fam.items.map((item, j) =>
                j === itemIdx ? { ...item, [field]: field === 'quantity' ? Number(value) : value } : item
              ),
            }
          : fam
      )
    );
  };

  const handleAddItem = (familyIdx: number) => {
    setFamilies(families =>
      families.map((fam, i) =>
        i === familyIdx
          ? { ...fam, items: [...fam.items, { name: '', quantity: 1 }] }
          : fam
      )
    );
  };

  const handleRemoveItem = (familyIdx: number, itemIdx: number) => {
    setFamilies(families =>
      families.map((fam, i) =>
        i === familyIdx
          ? { ...fam, items: fam.items.filter((_, j) => j !== itemIdx) }
          : fam
      )
    );
  };

  const handleAddFamily = () => {
    setFamilies([
      ...families,
      { clientName: '', items: [{ name: '', quantity: 1 }], notes: '' }
    ]);
  };

  const handleRemoveFamily = (idx: number) => {
    setFamilies(families => families.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'requests'), {
        families,
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
      toast.success('Request submitted!');
      setFamilies([{ clientName: '', items: [{ name: '', quantity: 1 }], notes: '' }]);
    } catch (err) {
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#003366] mb-4">Request Items for Multiple Families</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {families.map((family, familyIdx) => (
          <div key={familyIdx} className="border-b pb-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-[#003366]">
                Family {familyIdx + 1}
              </h3>
              {families.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveFamily(familyIdx)}
                  className="text-red-600 hover:text-red-800 font-bold px-2"
                  aria-label="Remove family"
                >
                  × Remove Family
                </button>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input
                type="text"
                value={family.clientName}
                onChange={e => handleFamilyChange(familyIdx, 'clientName', e.target.value)}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900"
                placeholder="Enter client name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Requested Items</label>
              {family.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => handleItemChange(familyIdx, itemIdx, 'name', e.target.value)}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900"
                    placeholder="Item name"
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e => handleItemChange(familyIdx, itemIdx, 'quantity', e.target.value)}
                    required
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900"
                    placeholder="Qty"
                  />
                  {family.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(familyIdx, itemIdx)}
                      className="text-red-600 hover:text-red-800 font-bold px-2"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddItem(familyIdx)}
                className="mt-1 text-blue-600 hover:underline text-sm"
              >
                + Add another item
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                value={family.notes}
                onChange={e => handleFamilyChange(familyIdx, 'notes', e.target.value)}
                rows={2}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900"
                placeholder="Any special instructions or context?"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddFamily}
          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md font-semibold hover:bg-blue-200"
        >
          + Add Another Family
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#003366] text-white px-6 py-2 rounded-md hover:bg-[#0052A3] font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] disabled:opacity-60 ml-4"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
