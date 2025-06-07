'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface InventoryItem {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  category: string;
  location?: string;
  lastUpdated?: string;
  tally?: number; // <-- add tally field
}

const CATEGORY_OPTIONS = [
  'Clothing',
  'Shoes',
  'Boots',
  'Food',
  'Hygiene',
  'Household',
  'Toys',
  'Other',
];

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<InventoryItem, 'id' | 'lastUpdated'>>({
    name: '',
    description: '',
    quantity: 1,
    category: '',
    location: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [removingAll, setRemovingAll] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'inventory'));
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    } catch (err) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: Number(e.target.value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'inventory', editingId), {
          ...form,
          lastUpdated: new Date().toISOString(),
        });
        toast.success('Item updated');
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...form,
          tally: 0, // <-- initialize tally on add
          lastUpdated: new Date().toISOString(),
        });
        toast.success('Item added');
      }
      setForm({ name: '', description: '', quantity: 1, category: '', location: '' });
      setEditingId(null);
      fetchItems();
    } catch {
      toast.error('Failed to save item');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setForm({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      category: item.category,
      location: item.location || '',
    });
    setEditingId(item.id!);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'inventory', id));
      toast.success('Item deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleCancel = () => {
    setForm({ name: '', description: '', quantity: 1, category: '', location: '' });
    setEditingId(null);
  };

  // CSV Import
  const handleCSVUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    try {
      const text = await file.text();
      const rows = text.split('\n').filter(Boolean);
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      const itemsToAdd: Omit<InventoryItem, 'id' | 'lastUpdated'>[] = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(c => c.trim());
        const item: any = {};
        headers.forEach((h, idx) => {
          if (h === 'quantity') {
            item[h] = Number(cols[idx]);
          } else {
            item[h] = cols[idx];
          }
        });
        if (item.name && !isNaN(item.quantity)) {
          itemsToAdd.push(item);
        }
      }
      for (const item of itemsToAdd) {
        await addDoc(collection(db, 'inventory'), {
          ...item,
          lastUpdated: new Date().toISOString(),
        });
      }
      toast.success(`Imported ${itemsToAdd.length} items`);
      fetchItems();
    } catch (err) {
      toast.error('Failed to import CSV');
    } finally {
      setCsvLoading(false);
      e.target.value = '';
    }
  };

  // Get unique categories and locations for filter dropdowns
  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));
  const locations = Array.from(new Set(items.map(i => i.location).filter(Boolean)));

  // Filtered items for display
  const filteredItems = items.filter(item =>
    (search === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(search.toLowerCase())
    ) &&
    (categoryFilter === '' || item.category === categoryFilter) &&
    (locationFilter === '' || item.location === locationFilter)
  );

  // Remove all items
  const handleRemoveAll = async () => {
    if (!confirm('Are you sure you want to delete ALL inventory items? This cannot be undone.')) return;
    setRemovingAll(true);
    try {
      const snap = await getDocs(collection(db, 'inventory'));
      const batch = (await import('firebase/firestore')).writeBatch(db);
      snap.docs.forEach(docRef => {
        batch.delete(docRef.ref);
      });
      await batch.commit();
      toast.success('All inventory items deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete all items');
    } finally {
      setRemovingAll(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-[#003366]">Inventory Management</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6 max-w-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900"
              placeholder="e.g. LL BEAN"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 bg-white"
            >
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
            <input
              name="quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={handleNumberChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900"
              placeholder="Enter quantity"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900"
              placeholder="e.g. Main Warehouse"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900"
            placeholder="Add details (e.g. size, color, notes)"
            rows={2}
          />
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="submit"
            className="bg-[#003366] text-white px-6 py-2 rounded-md font-semibold hover:bg-[#0052A3] focus:outline-none focus:ring-2 focus:ring-[#003366]"
          >
            {editingId ? 'Update' : 'Add'} Item
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-200 px-6 py-2 rounded-md font-semibold text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
          <label className="ml-auto flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-700">Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              disabled={csvLoading}
            />
          </label>
        </div>
      </form>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#003366] focus:border-[#003366] text-gray-900 placeholder-gray-400"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 bg-white"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 bg-white"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleRemoveAll}
            disabled={removingAll || items.length === 0}
            className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {removingAll ? 'Removing...' : 'Remove All'}
          </button>
        </div>
        <h3 className="text-lg font-semibold mb-4">Inventory List</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Location</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Tally</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map(item => (
                  <tr key={item.id} className={item.quantity <= 5 ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-2 font-semibold text-base text-[#003366]">{item.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{item.description || '-'}</td>
                    <td className={`px-4 py-2 text-base ${item.quantity <= 5 ? 'text-[#eab308] font-bold' : 'text-[#003366]'}`}>{item.quantity}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{item.category || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{item.location || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{typeof item.tally === 'number' ? item.tally : 0}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(item.id!)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">No inventory items found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-4 text-xs text-gray-500">
        <strong>CSV Format:</strong> name,description,quantity,category,location<br />
        Example: <code>Winter Coat,Adult Large,12,Clothing,Main Warehouse</code>
      </div>
    </div>
  );
}
