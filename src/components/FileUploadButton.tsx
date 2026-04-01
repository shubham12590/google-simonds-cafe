import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, FileText, Loader2, MapPin, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseExcelFile } from '../utils/excelParser';
import { useData } from '../context/DataContext';
import { useToast } from './Toast';

interface FileUploadButtonProps {
  variant?: 'compact' | 'full' | 'bottom-bar';
  className?: string;
}

interface FileSummary {
  file: File;
  status: 'pending' | 'parsing' | 'valid' | 'invalid' | 'uploaded' | 'error';
  rows?: number;
  error?: string;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({ variant = 'compact', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSummaries, setFileSummaries] = useState<FileSummary[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationCity, setNewLocationCity] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { files, uploadFiles, locations, createLocation } = useData();
  const { addToast } = useToast();

  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;
    
    const currentTotalFiles = files.length;
    const availableSlots = Math.max(0, 50 - currentTotalFiles);
    
    if (availableSlots === 0) {
      addToast({ 
        message: 'Cannot upload — app already has 50 files. Delete old files to add more.', 
        type: 'error' 
      });
      return;
    }

    let filesToProcess = filesArray;
    if (filesArray.length > availableSlots) {
      filesToProcess = filesArray.slice(0, availableSlots);
      addToast({ 
        message: `Upload limit reached — ${availableSlots} of 50 files uploaded.`, 
        type: 'info' 
      });
    }

    const newSummaries: FileSummary[] = filesToProcess.map(file => ({
      file,
      status: 'pending'
    }));

    setFileSummaries(prev => [...prev, ...newSummaries]);
    setIsOpen(true);
    
    if (locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }

    // Quick parse to validate and get row counts
    for (let i = 0; i < newSummaries.length; i++) {
      const summary = newSummaries[i];
      
      if (summary.file.size > 10 * 1024 * 1024) {
        updateFileSummary(summary.file.name, { status: 'invalid', error: 'File exceeds 10 MB limit.' });
        continue;
      }

      const ext = summary.file.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
        updateFileSummary(summary.file.name, { status: 'invalid', error: 'Unsupported file type. Please upload .xlsx, .xls, or .csv.' });
        continue;
      }

      updateFileSummary(summary.file.name, { status: 'parsing' });
      
      try {
        const records = await parseExcelFile(summary.file);
        if (records.length > 0) {
          updateFileSummary(summary.file.name, { status: 'valid', rows: records.length });
        } else {
          updateFileSummary(summary.file.name, { status: 'invalid', error: 'No valid records found or missing required columns.' });
        }
      } catch (err) {
        updateFileSummary(summary.file.name, { status: 'invalid', error: 'Failed to parse file.' });
      }
    }
  };

  const updateFileSummary = (filename: string, updates: Partial<FileSummary>) => {
    setFileSummaries(prev => prev.map(s => s.file.name === filename ? { ...s, ...updates } : s));
  };

  const removeFile = (filename: string) => {
    setFileSummaries(prev => prev.filter(s => s.file.name !== filename));
  };

  const handleCreateLocation = async () => {
    if (!newLocationName.trim() || !newLocationCity.trim()) {
      addToast({ message: 'Please enter both name and city', type: 'error' });
      return;
    }
    
    const id = newLocationName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    
    try {
      await createLocation({
        id,
        displayName: newLocationName,
        city: newLocationCity,
        timezone: 'Asia/Kolkata'
      });
      setSelectedLocationId(id);
      setIsAddingLocation(false);
      setNewLocationName('');
      setNewLocationCity('');
    } catch (e) {
      // Error handled in context
    }
  };

  const processFiles = async () => {
    const validFiles = fileSummaries.filter(s => s.status === 'valid');
    if (validFiles.length === 0 || !selectedLocationId) return;

    setIsUploading(true);

    try {
      const filesData = [];
      for (const summary of validFiles) {
        try {
          const records = await parseExcelFile(summary.file);
          filesData.push({ filename: summary.file.name, records, locationId: selectedLocationId });
          updateFileSummary(summary.file.name, { status: 'uploaded' });
        } catch (err) {
          updateFileSummary(summary.file.name, { status: 'error', error: 'Failed during final upload.' });
        }
      }
      
      if (filesData.length > 0) {
        await uploadFiles(filesData);
        setTimeout(() => {
          setIsOpen(false);
          setFileSummaries([]);
          setIsUploading(false);
        }, 1000);
      } else {
        setIsUploading(false);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {variant === 'bottom-bar' ? (
        <button
          onClick={triggerFileInput}
          className={`flex flex-col items-center justify-center p-2 rounded-lg w-full text-slate-500 hover:text-orange-500 transition-colors ${className}`}
          aria-label="Upload sales files"
        >
          <UploadCloud size={24} />
          <span className="text-[10px] font-medium mt-1">Upload</span>
        </button>
      ) : variant === 'compact' ? (
        <button
          onClick={triggerFileInput}
          className={`flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors text-sm font-medium ${className}`}
          aria-label="Upload sales files"
          title="Upload sales files (.xlsx .xls .csv)"
        >
          <UploadCloud size={18} />
          <span className="hidden sm:inline">Upload</span>
        </button>
      ) : (
        <button
          onClick={triggerFileInput}
          className={`flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white hover:bg-orange-600 rounded-xl transition-colors font-medium shadow-sm ${className}`}
          aria-label="Upload sales files"
        >
          <UploadCloud size={20} />
          <span>Upload Files</span>
        </button>
      )}

      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept=".xlsx, .xls, .csv" 
        multiple 
        onChange={(e) => {
          if (e.target.files) handleFilesSelected(e.target.files);
          e.target.value = '';
        }} 
      />

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div 
            className={`bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${isDragging ? 'ring-2 ring-orange-500 scale-[1.01]' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-orange-500" />
                Upload Sales Data
              </h3>
              {!isUploading && (
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    setFileSummaries([]);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isDragging && (
                <div className="absolute inset-0 bg-orange-50/90 z-10 flex items-center justify-center border-2 border-dashed border-orange-500 m-6 rounded-xl">
                  <p className="text-orange-600 font-medium text-lg">Drop files here to add them</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Location Selection */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <MapPin size={16} className="text-slate-500" />
                    1. Select Location for these files
                  </h4>
                  
                  {isAddingLocation ? (
                    <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Location Name</label>
                          <input 
                            type="text" 
                            value={newLocationName}
                            onChange={e => setNewLocationName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            placeholder="e.g. Downtown Cafe"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                          <input 
                            type="text" 
                            value={newLocationCity}
                            onChange={e => setNewLocationCity(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            placeholder="e.g. Mumbai"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button 
                          onClick={handleCreateLocation}
                          className="px-4 py-1.5 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setIsAddingLocation(false)}
                          className="px-4 py-1.5 bg-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <select
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                      >
                        <option value="" disabled>Select a location...</option>
                        {locations.filter(l => l.isActive).map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.displayName} ({loc.city})
                          </option>
                        ))}
                      </select>
                      <button 
                        onClick={() => setIsAddingLocation(true)}
                        className="px-3 py-2 flex items-center gap-1 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
                      >
                        <Plus size={16} />
                        New
                      </button>
                    </div>
                  )}
                </div>

                {/* File List */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <h4 className="text-sm font-medium text-slate-800">
                      2. Selected Files ({fileSummaries.length})
                    </h4>
                    <button 
                      onClick={triggerFileInput}
                      className="text-xs text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1"
                      disabled={isUploading}
                    >
                      <Plus size={14} /> Add more
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {fileSummaries.map((summary, idx) => (
                      <div key={`${summary.file.name}-${idx}`} className={`flex items-center justify-between p-3 rounded-lg border ${summary.status === 'invalid' || summary.status === 'error' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className={`shrink-0 ${summary.status === 'invalid' || summary.status === 'error' ? 'text-red-400' : 'text-slate-400'}`} size={20} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate" title={summary.file.name}>
                              {summary.file.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs mt-0.5">
                              <span className="text-slate-500">{(summary.file.size / 1024 / 1024).toFixed(2)} MB</span>
                              {summary.status === 'parsing' && <span className="text-orange-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Parsing...</span>}
                              {summary.status === 'valid' && <span className="text-green-600">{summary.rows} rows detected</span>}
                              {(summary.status === 'invalid' || summary.status === 'error') && <span className="text-red-600 truncate" title={summary.error}>{summary.error}</span>}
                              {summary.status === 'uploaded' && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> Uploaded</span>}
                            </div>
                          </div>
                        </div>
                        
                        {!isUploading && summary.status !== 'uploaded' && (
                          <button 
                            onClick={() => removeFile(summary.file.name)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                            title="Remove file"
                          >
                            <X size={16} />
                          </button>
                        )}
                        {summary.status === 'uploaded' && (
                          <CheckCircle2 className="text-green-500 shrink-0 mr-2" size={20} />
                        )}
                      </div>
                    ))}
                    
                    {fileSummaries.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <p className="text-sm text-slate-500">No files selected yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                {fileSummaries.filter(s => s.status === 'valid').length} valid files ready
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    setFileSummaries([]);
                  }}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={processFiles}
                  disabled={!selectedLocationId || isAddingLocation || fileSummaries.filter(s => s.status === 'valid').length === 0 || isUploading}
                  className="px-6 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                >
                  {isUploading ? (
                    <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                  ) : (
                    'Confirm & Upload'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
