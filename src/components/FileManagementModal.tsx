import React, { useState, useMemo } from 'react';
import { X, Trash2, Search, FileText, Calendar, Database, ArrowUpDown, MapPin } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { ConfirmModal } from './ConfirmModal';
import { FileUploadButton } from './FileUploadButton';

interface FileManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FileManagementModal: React.FC<FileManagementModalProps> = ({ isOpen, onClose }) => {
  const { files, deleteFile, locations, reassignFileLocation } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'filename' | 'uploadDate' | 'locationId'; direction: 'asc' | 'desc' }>({
    key: 'uploadDate',
    direction: 'desc',
  });
  const [fileToDelete, setFileToDelete] = useState<{ id: number; filename: string } | null>(null);

  const filteredFiles = useMemo(() => {
    let result = [...files];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((file) => file.filename.toLowerCase().includes(lowerQuery));
    }

    result.sort((a, b) => {
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';
      if (valA < valB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [files, searchQuery, sortConfig]);

  const handleSort = (key: 'filename' | 'uploadDate' | 'locationId') => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Database className="text-orange-500" size={20} sm:size={24} />
            Manage Uploaded Files
          </h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <FileUploadButton variant="compact" />
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-3 sm:py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex justify-between w-full sm:w-auto items-center">
            <div className="text-sm text-slate-500">
              {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
            </div>
            <div className="sm:hidden">
              <FileUploadButton variant="compact" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 sm:bg-white">
          {/* Mobile Card View */}
          <div className="block sm:hidden p-4 space-y-4">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <div key={file.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                        <FileText size={18} />
                      </div>
                      <span className="text-sm font-medium text-slate-900 break-all">{file.filename}</span>
                    </div>
                    <button
                      onClick={() => setFileToDelete({ id: file.id, filename: file.filename })}
                      className="text-slate-400 hover:text-red-600 p-2 -mr-2 -mt-2 rounded-full hover:bg-red-50 transition-colors shrink-0"
                      title="Delete file"
                      aria-label={`Delete ${file.filename}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <select
                        value={file.locationId || ''}
                        onChange={(e) => reassignFileLocation(file.id, e.target.value)}
                        className="text-sm text-slate-700 bg-transparent border border-slate-200 focus:ring-orange-500 rounded px-2 py-1 w-full"
                      >
                        <option value="" disabled>No Location</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.displayName} {!loc.isActive ? '(Inactive)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar size={14} className="shrink-0" />
                      {format(new Date(file.uploadDate), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 text-slate-500 italic bg-white rounded-xl border border-slate-200">
                No files found matching your search.
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('filename')}>
                  <div className="flex items-center gap-1">
                    Filename <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('locationId')}>
                  <div className="flex items-center gap-1">
                    Location <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('uploadDate')}>
                  <div className="flex items-center gap-1">
                    Upload Date <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                          <FileText size={18} />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{file.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <select
                          value={file.locationId || ''}
                          onChange={(e) => reassignFileLocation(file.id, e.target.value)}
                          className="text-sm text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5"
                        >
                          <option value="" disabled>No Location</option>
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.displayName} {!loc.isActive ? '(Inactive)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {format(new Date(file.uploadDate), 'MMM d, yyyy HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setFileToDelete({ id: file.id, filename: file.filename })}
                        className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete file"
                        aria-label={`Delete ${file.filename}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                    No files found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={() => {
          if (fileToDelete) {
            deleteFile(fileToDelete.id);
            setFileToDelete(null);
          }
        }}
        title="Delete File"
        message={`Are you sure you want to permanently delete "${fileToDelete?.filename}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
