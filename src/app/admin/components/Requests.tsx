'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getDocs, collection, query, orderBy, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Requests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [deliveryItems, setDeliveryItems] = useState<{ name: string; quantity: number }[]>([]);
  const [inventory, setInventory] = useState<{ name: string; quantity: number; category?: string; description?: string; location?: string }[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('');
  const [inventoryLocationFilter, setInventoryLocationFilter] = useState('');
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
  const [pdfOpenIdx, setPdfOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchInventory();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'requests'), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
    } catch (error) {
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const snap = await getDocs(collection(db, 'inventory'));
      setInventory(
        snap.docs.map(doc => ({
          name: doc.data().name,
          quantity: doc.data().quantity,
          category: doc.data().category,
          description: doc.data().description,
          location: doc.data().location,
        }))
      );
    } catch {
      toast.error('Failed to fetch inventory');
    }
  };

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, 'requests', id), { status });
      toast.success(`Request ${status === 'approved' ? 'approved' : 'denied'}.`);
      await fetchRequests();
    } catch (err) {
      toast.error('Failed to update request status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'requests', id));
      toast.success('Request deleted.');
      await fetchRequests();
    } catch (err) {
      toast.error('Failed to delete request');
    } finally {
      setDeletingId(null);
    }
  };

  // Simple search: search all string values in the request
  const filteredRequests = requests.filter(request =>
    Object.values(request)
      .filter(v => typeof v === 'string')
      .some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Define columns for the new model
  const columns = [
    { key: 'families', label: 'Families' },
    { key: 'caseworker', label: 'Case Worker' },
    { key: 'status', label: 'Status' },
    { key: 'submittedAt', label: 'Submitted At' },
    { key: 'pdf', label: 'PDF Report' }, // <-- Add PDF column
    { key: 'actions', label: 'Actions' }, // <-- Add Actions column
  ];

  const openApproveModal = (request: any) => {
    setSelectedRequest(request);
    setDeliveryItems([{ name: '', quantity: 1 }]);
  };

  const handleDeliveryItemChange = (idx: number, field: 'name' | 'quantity', value: string | number) => {
    setDeliveryItems(items =>
      items.map((item, i) =>
        i === idx ? { ...item, [field]: field === 'quantity' ? Number(value) : value } : item
      )
    );
  };

  const handleAddDeliveryItem = () => {
    setDeliveryItems(items => [...items, { name: '', quantity: 1 }]);
  };

  const handleRemoveDeliveryItem = (idx: number) => {
    setDeliveryItems(items => items.filter((_, i) => i !== idx));
  };

  const handleApproveWithDelivery = async () => {
    if (!selectedRequest) return;
    setUpdatingId(selectedRequest.id);

    // Prepare to update inventory quantities
    const batchUpdates: { docRef: any; newQty: number }[] = [];
    let insufficientStock = false;

    try {
      // Check and prepare inventory updates
      for (const item of deliveryItems) {
        // Find the inventory doc with all unique fields (name, category, location)
        const invDoc = inventory.find(
          inv =>
            inv.name === item.name &&
            (inventoryCategoryFilter === '' || inv.category === inventoryCategoryFilter) &&
            (inventoryLocationFilter === '' || inv.location === inventoryLocationFilter)
        ) || inventory.find(inv => inv.name === item.name);

        if (!invDoc) {
          toast.error(`Inventory item not found: ${item.name}`);
          insufficientStock = true;
          break;
        }
        if (invDoc.quantity < item.quantity) {
          toast.error(`Not enough stock for ${invDoc.name}`);
          insufficientStock = true;
          break;
        }

        // Find the Firestore doc id for this inventory item
        const snap = await getDocs(
          query(
            collection(db, 'inventory'),
            where('name', '==', invDoc.name),
            invDoc.category ? where('category', '==', invDoc.category) : undefined,
            invDoc.location ? where('location', '==', invDoc.location) : undefined
          )._queryOptions
            ? query(
                collection(db, 'inventory'),
                where('name', '==', invDoc.name),
                invDoc.category ? where('category', '==', invDoc.category) : undefined,
                invDoc.location ? where('location', '==', invDoc.location) : undefined
              )
            : query(collection(db, 'inventory'), where('name', '==', invDoc.name))
        );
        const docRefId = snap.docs.find(
          d =>
            d.data().name === invDoc.name &&
            (invDoc.category ? d.data().category === invDoc.category : true) &&
            (invDoc.location ? d.data().location === invDoc.location : true)
        )?.id;

        if (!docRefId) {
          toast.error(`Inventory document not found for ${invDoc.name}`);
          insufficientStock = true;
          break;
        }

        batchUpdates.push({ docRef: doc(db, 'inventory', docRefId), newQty: invDoc.quantity - item.quantity });
      }

      if (insufficientStock) {
        setUpdatingId(null);
        return;
      }

      // Update request status and deliveredItems
      await updateDoc(doc(db, 'requests', selectedRequest.id), {
        status: 'approved',
        deliveredItems: deliveryItems,
      });

      // Update inventory quantities
      for (const update of batchUpdates) {
        if (update.docRef && update.newQty >= 0) {
          await updateDoc(update.docRef, { quantity: update.newQty });
        }
      }

      // Generate PDF and store in state for preview
      const docPDF = generateDeliveryPDF(selectedRequest, deliveryItems);
      setPdfDoc(docPDF);
      setPdfOpenIdx(selectedRequest.id);

      toast.success('Request approved and inventory updated.');
      setSelectedRequest(null);
      setDeliveryItems([]);
      await fetchRequests();
      await fetchInventory();
    } catch (err) {
      toast.error('Failed to approve request');
      // Optionally log error for debugging
      // console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  // PDF generation function (returns jsPDF instance)
  function generateDeliveryPDF(request: any, items: { name: string; quantity: number }[]) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Delivery Receipt', 14, 18);
    doc.setFontSize(12);
    doc.text(`Request ID: ${request.id}`, 14, 28);
    doc.text(`Caseworker: ${request.caseworker?.name || request.caseworker?.email || '-'}`, 14, 36);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 44);

    autoTable(doc, {
      startY: 52,
      head: [['Item', 'Quantity']],
      body: items.map(item => [item.name, String(item.quantity)]),
    });

    return doc;
  }

  // Get unique categories and locations for filter dropdowns
  const inventoryCategories = Array.from(new Set(inventory.map(i => i.category).filter(Boolean)));
  const inventoryLocations = Array.from(new Set(inventory.map(i => i.location).filter(Boolean)));

  // --- Make sure the return statement is not inside any function and is at the root of the component ---
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#003366]">Requests</h2>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0066CC] focus:border-[#0066CC] text-gray-900 placeholder-gray-400"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request, rowIdx) => (
                <tr key={request.id}>
                  {/* Families column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Array.isArray(request.families) && request.families.length > 0 ? (
                      <div className="space-y-2">
                        {request.families.map((fam: any, idx: number) => (
                          <div key={idx} className="border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                            <div>
                              <span className="font-semibold">Client Name:</span> {fam.clientName || '-'}
                            </div>
                            <div>
                              <span className="font-semibold">Items:</span>{' '}
                              {Array.isArray(fam.items)
                                ? fam.items.map((item: any, i: number) => (
                                    <span key={i}>
                                      {item.name} {item.quantity ? `x${item.quantity}` : ''}
                                      {i < fam.items.length - 1 ? ', ' : ''}
                                    </span>
                                  ))
                                : '-'}
                            </div>
                            <div>
                              <span className="font-semibold">Notes:</span> {fam.notes || '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Fallback for legacy requests
                      <div>
                        <div>
                          <span className="font-semibold">Client Name:</span> {request.clientName || '-'}
                        </div>
                        <div>
                          <span className="font-semibold">Items:</span>{' '}
                          {Array.isArray(request.items)
                            ? request.items.map((item: any, idx: number) => (
                                <span key={idx}>
                                  {item.name} {item.quantity ? `x${item.quantity}` : ''}
                                  {idx < request.items.length - 1 ? ', ' : ''}
                                </span>
                              ))
                            : typeof request.items === 'string'
                            ? request.items.split('\n').map((item: string, idx: number) => (
                                <span key={idx}>{item}{idx < request.items.split('\n').length - 1 ? ', ' : ''}</span>
                              ))
                            : '-'}
                        </div>
                        <div>
                          <span className="font-semibold">Notes:</span> {request.notes || '-'}
                        </div>
                      </div>
                    )}
                  </td>
                  {/* Caseworker */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.caseworker?.name || request.caseworker?.email || '-'}
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                    </span>
                  </td>
                  {/* Submitted At */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.submittedAt).toLocaleString()}
                  </td>
                  {/* PDF Report column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                        onClick={() => {
                          if (request.deliveredItems && request.deliveredItems.length > 0) {
                            const doc = generateDeliveryPDF(request, request.deliveredItems);
                            setPdfDoc(doc);
                            setPdfOpenIdx(rowIdx);
                          } else {
                            toast.error('No delivered items for this request');
                          }
                        }}
                        title="View PDF"
                      >
                        PDF
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                        onClick={() => {
                          // Only clear if this PDF is open
                          if (pdfOpenIdx === rowIdx) {
                            setPdfDoc(null);
                            setPdfOpenIdx(null);
                            toast.success('PDF deleted. You can generate a new one.');
                          }
                        }}
                        title="Delete PDF"
                        disabled={pdfOpenIdx !== rowIdx}
                      >
                        Delete PDF
                      </button>
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                        disabled={request.status === 'approved' || updatingId === request.id}
                        onClick={() => openApproveModal(request)}
                      >
                        Approve & Deliver
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                        disabled={request.status === 'rejected' || updatingId === request.id}
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                      >
                        Deny
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-gray-200 text-red-600 hover:bg-red-100 disabled:opacity-50 flex items-center"
                        disabled={deletingId === request.id}
                        onClick={() => handleDelete(request.id)}
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        {deletingId === request.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-gray-400">No requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Approve & Deliver Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-xl w-full relative">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-[#003366] flex items-center gap-2">
              <span>Set Items to Deliver</span>
              <span className="text-base font-normal text-gray-500">(from Inventory)</span>
            </h2>
            {/* Only filters, no search */}
            <div className="mb-4 flex flex-col md:flex-row gap-2">
              <select
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 bg-white"
                value={inventoryCategoryFilter}
                onChange={e => setInventoryCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {inventoryCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 bg-white"
                value={inventoryLocationFilter}
                onChange={e => setInventoryLocationFilter(e.target.value)}
              >
                <option value="">All Locations</option>
                {inventoryLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleApproveWithDelivery();
              }}
              className="space-y-6"
            >
              {deliveryItems.map((item, idx) => {
                // Filter inventory by category and location for the dropdown
                const filteredInventory = inventory.filter(inv =>
                  (inventoryCategoryFilter === '' || inv.category === inventoryCategoryFilter) &&
                  (inventoryLocationFilter === '' || inv.location === inventoryLocationFilter)
                );
                // Always include the selected item in the dropdown, even if it doesn't match the current filter
                const selectedInv =
                  item.name &&
                  !filteredInventory.some(
                    inv =>
                      inv.name === item.name &&
                      (inventoryCategoryFilter === '' || inv.category === inventoryCategoryFilter) &&
                      (inventoryLocationFilter === '' || inv.location === inventoryLocationFilter)
                  )
                    ? inventory.find(inv => inv.name === item.name)
                    : undefined;
                const dropdownInventory = selectedInv
                  ? [selectedInv, ...filteredInventory.filter(inv => inv !== selectedInv)]
                  : filteredInventory;

                // Use index in key to guarantee uniqueness even for duplicate items
                const inv = dropdownInventory.find(inv => inv.name === item.name);

                return (
                  <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 items-center border-b pb-3">
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Item</label>
                      <select
                        value={item.name}
                        onChange={e => handleDeliveryItemChange(idx, 'name', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] bg-white"
                      >
                        <option value="">Select item</option>
                        {dropdownInventory.map((inv, i) => (
                          <option
                            key={
                              inv.name +
                              '-' +
                              (inv.location || '') +
                              '-' +
                              (inv.category || '') +
                              '-' +
                              i
                            }
                            value={inv.name}
                          >
                            {inv.name} (Available: {inv.quantity}){inv.category ? ` - ${inv.category}` : ''}
                            {inv.description ? ` - ${inv.description}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        max={inv?.quantity ?? undefined}
                        value={item.quantity}
                        onChange={e => handleDeliveryItemChange(idx, 'quantity', e.target.value)}
                        required
                        className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366]"
                        placeholder="Qty"
                      />
                    </div>
                    {deliveryItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliveryItem(idx)}
                        className="text-red-600 hover:text-red-800 font-bold px-2 mt-6"
                        aria-label="Remove item"
                        title="Remove item"
                      >
                        ×
                      </button>
                    )}
                    {/* Details */}
                    {inv && item.name && (
                      <div className="w-full md:w-auto mt-2 md:mt-0 text-xs text-gray-600 bg-blue-50 rounded p-2 ml-0 md:ml-2">
                        <div><span className="font-semibold">Category:</span> {inv.category || '-'}</div>
                        <div><span className="font-semibold">Description:</span> {inv.description || '-'}</div>
                        <div><span className="font-semibold">Location:</span> {inv.location || '-'}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleAddDeliveryItem}
                  className="text-blue-600 hover:underline text-sm font-semibold"
                >
                  + Add another item
                </button>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#003366] text-white px-6 py-2 rounded-md hover:bg-[#0052A3] font-semibold"
                  disabled={updatingId === selectedRequest.id}
                >
                  {updatingId === selectedRequest.id ? 'Approving...' : 'Approve & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* PDF Modal */}
      {pdfDoc && pdfOpenIdx !== null && (() => {
  // Find the correct request by id or index
  const request =
    typeof pdfOpenIdx === 'number'
      ? requests.find(r => r.id === pdfOpenIdx || requests.indexOf(r) === pdfOpenIdx)
      : undefined;

  // Fallback: if not found, do not render modal
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <button
          onClick={() => setPdfDoc(null)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
        >
          ×
        </button>
        <h3 className="text-lg font-semibold mb-4 text-[#003366]">Delivery Receipt</h3>
        <div className="mb-4">
          <strong>Request ID:</strong> {request.id}
        </div>
        <div className="mb-4">
          <strong>Caseworker:</strong> {request.caseworker?.name || request.caseworker?.email}
        </div>
        <div className="mb-4">
          <strong>Date:</strong> {new Date().toLocaleString()}
        </div>
        <div className="mb-4">
          <strong>Items Delivered:</strong>
          <ul className="list-disc list-inside">
            {(request.deliveredItems || []).map((item: any, idx: number) => (
              <li key={idx}>
                {item.name} x {item.quantity}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              const doc = generateDeliveryPDF(request, request.deliveredItems || []);
              doc.save(`delivery_receipt_${request.id}.pdf`);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold"
          >
            Download PDF
          </button>
          <button
            onClick={() => setPdfDoc(null)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
})()}
    </div>
  );
}