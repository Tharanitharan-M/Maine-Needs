'use client';

export default function NewRequest() {
  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-[#003366] mb-6">New Request Form</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
          <input
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 text-base"
            placeholder="Enter client name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
          <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 text-base">
            <option value="" className="text-gray-500">Select request type</option>
            <option value="housing" className="text-gray-900">Housing</option>
            <option value="food" className="text-gray-900">Food</option>
            <option value="medical" className="text-gray-900">Medical</option>
            <option value="other" className="text-gray-900">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 text-base"
            rows={4}
            placeholder="Enter request description"
          />
        </div>
        <button
          type="submit"
          className="bg-[#003366] text-white px-6 py-2 rounded-md hover:bg-[#0052A3] font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366]"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
} 