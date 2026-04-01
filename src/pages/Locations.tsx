import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { MapPin, Plus, Edit2, X, AlertCircle } from 'lucide-react';
import { Location } from '../types';

export const Locations: React.FC = () => {
  const { locations, createLocation, updateLocation } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ displayName: '', city: '', timezone: 'Asia/Kolkata', isActive: true });
  const [error, setError] = useState<string | null>(null);

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({ displayName: '', city: '', timezone: 'Asia/Kolkata', isActive: true });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (loc: Location) => {
    setModalMode('edit');
    setEditingId(loc.id);
    setFormData({
      displayName: loc.displayName,
      city: loc.city,
      timezone: loc.timezone,
      isActive: loc.isActive
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setError(null);
  };

  const handleSave = async () => {
    const trimmedName = formData.displayName.trim();
    const trimmedCity = formData.city.trim();

    if (!trimmedName) {
      setError('Location name cannot be empty.');
      return;
    }
    if (!trimmedCity) {
      setError('City cannot be empty.');
      return;
    }

    // Check for uniqueness
    const isDuplicate = locations.some(
      loc => loc.displayName.toLowerCase() === trimmedName.toLowerCase() && loc.id !== editingId
    );

    if (isDuplicate) {
      setError('Location name must be unique.');
      return;
    }

    if (modalMode === 'edit' && editingId) {
      await updateLocation(editingId, {
        displayName: trimmedName,
        city: trimmedCity,
        timezone: formData.timezone,
        isActive: formData.isActive
      });
    } else {
      const newId = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
      await createLocation({
        id: newId,
        displayName: trimmedName,
        city: trimmedCity,
        timezone: formData.timezone,
        isActive: formData.isActive
      });
    }
    closeModal();
  };

  const handleToggleActive = async (loc: Location) => {
    await updateLocation(loc.id, { isActive: !loc.isActive });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Locations</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your cafe locations and outlets.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Add Location
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location Name</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timezone</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {locations.map(loc => (
              <tr key={loc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-800">{loc.displayName}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-600">{loc.city}</td>
                <td className="p-4 text-sm text-slate-500">{loc.timezone}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleActive(loc)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      loc.isActive 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {loc.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => openEditModal(loc)}
                    className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {locations.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No locations found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">
                {modalMode === 'add' ? 'Add Location' : 'Edit Location'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Downtown Cafe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  value={formData.displayName}
                  onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Timezone
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                </select>
              </div>

              {modalMode === 'edit' && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-slate-700">Active Status</span>
                  </label>
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    Inactive locations will be hidden from the main selector but their historical data remains intact.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
