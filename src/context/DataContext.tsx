
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback, useRef } from 'react';
import { SaleRecord, GlobalFilters, Location } from '../types';
import { isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { useToast } from '../components/Toast';
import { detectClosedDays } from '../utils/prediction/closedDays';

export interface UploadedFile {
  id: number;
  filename: string;
  uploadDate: string;
  locationId?: string;
}

interface DataContextType {
  data: SaleRecord[];
  filteredData: SaleRecord[];
  setData: (data: SaleRecord[]) => void;
  filters: GlobalFilters;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>;
  availableCategories: string[];
  availableProducts: string[];
  files: UploadedFile[];
  isLoading: boolean;
  uploadFile: (filename: string, records: SaleRecord[], locationId: string) => Promise<void>;
  uploadFiles: (filesData: { filename: string; records: SaleRecord[]; locationId: string }[]) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  reassignFileLocation: (fileId: number, locationId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  closedDays: Set<string>;
  toggleClosedDay: (date: string) => void;
  locations: Location[];
  activeLocationId: string;
  setActiveLocationId: (id: string) => void;
  createLocation: (location: Omit<Location, 'isActive'>) => Promise<void>;
  updateLocation: (id: string, location: Partial<Location>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SaleRecord[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<GlobalFilters>({
    dateRange: { start: null, end: null },
    categories: [],
    productNames: [],
  });
  const [closedDays, setClosedDays] = useState<Set<string>>(new Set());
  const { addToast } = useToast();
  const deleteTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Auto-detect closed days when data changes
  useEffect(() => {
    if (data.length > 0) {
      const detected = detectClosedDays(data);
      setClosedDays(prev => {
        return detected;
      });
    }
  }, [data]);

  const toggleClosedDay = useCallback((date: string) => {
    setClosedDays(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [filesRes, recordsRes, locationsRes] = await Promise.all([
        fetch('/api/files'),
        fetch('/api/records'),
        fetch('/api/locations')
      ]);
      
      if (filesRes.ok && recordsRes.ok && locationsRes.ok) {
        const filesData = await filesRes.json();
        const recordsData = await recordsRes.json();
        const locationsData = await locationsRes.json();
        
        setFiles(filesData);
        setLocations(locationsData);
        
        // Convert ISO strings back to Date objects
        const parsedRecords = recordsData.map((r: any) => ({
          ...r,
          billDate: new Date(r.billDate)
        }));
        
        setData(parsedRecords);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      addToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const uploadFile = async (filename: string, records: SaleRecord[], locationId: string) => {
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename, records, locationId })
      });
      
      if (!res.ok) throw new Error('Failed to upload');
      const data = await res.json();
      await refreshData();
      
      if (data.insertedCount !== undefined && data.insertedCount < data.totalCount) {
        const skipped = data.totalCount - data.insertedCount;
        addToast({ message: `Uploaded ${filename}. Inserted ${data.insertedCount} records (skipped ${skipped} duplicates).`, type: 'success' });
      } else {
        addToast({ message: `Uploaded ${filename}`, type: 'success' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      addToast({ message: `Failed to upload ${filename}`, type: 'error' });
      throw error;
    }
  };

  const uploadFiles = async (filesData: { filename: string; records: SaleRecord[]; locationId: string }[]) => {
    try {
      // Upload sequentially to avoid overwhelming the server, but don't refresh data until the end
      let totalInserted = 0;
      let totalDuplicates = 0;

      for (const fileData of filesData) {
        const res = await fetch('/api/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fileData)
        });
        if (!res.ok) throw new Error(`Failed to upload ${fileData.filename}`);
        const data = await res.json();
        if (data.insertedCount !== undefined) {
          totalInserted += data.insertedCount;
          totalDuplicates += (data.totalCount - data.insertedCount);
        }
      }
      await refreshData();
      
      if (totalDuplicates > 0) {
        addToast({ message: `Uploaded ${filesData.length} files. Inserted ${totalInserted} records (skipped ${totalDuplicates} duplicates).`, type: 'success' });
      } else {
        addToast({ message: `Successfully uploaded ${filesData.length} files`, type: 'success' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      addToast({ message: 'Failed to upload some files', type: 'error' });
      // Even if one fails, we should refresh to get the ones that succeeded
      await refreshData();
      throw error;
    }
  };

  const reassignFileLocation = async (fileId: number, locationId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}/reassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId })
      });
      if (!res.ok) throw new Error('Failed to reassign location');
      await refreshData();
      addToast({ message: 'Location reassigned successfully', type: 'success' });
    } catch (error) {
      console.error('Reassign error:', error);
      addToast({ message: 'Failed to reassign location', type: 'error' });
      throw error;
    }
  };

  const createLocation = async (location: Omit<Location, 'isActive'>) => {
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location)
      });
      if (!res.ok) throw new Error('Failed to create location');
      await refreshData();
      addToast({ message: 'Location created successfully', type: 'success' });
    } catch (error) {
      console.error('Create location error:', error);
      addToast({ message: 'Failed to create location', type: 'error' });
      throw error;
    }
  };

  const updateLocation = async (id: string, location: Partial<Location>) => {
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location)
      });
      if (!res.ok) throw new Error('Failed to update location');
      await refreshData();
      addToast({ message: 'Location updated successfully', type: 'success' });
    } catch (error) {
      console.error('Update location error:', error);
      addToast({ message: 'Failed to update location', type: 'error' });
      throw error;
    }
  };

  const deleteFile = async (id: number) => {
    const fileToDelete = files.find((f) => f.id === id);
    if (!fileToDelete) return;

    // Optimistic update
    const previousFiles = [...files];
    const previousData = [...data];

    setFiles((prev) => prev.filter((f) => f.id !== id));
    setData((prev) => prev.filter((r) => r.fileId !== id));

    const undoDelete = () => {
      if (deleteTimeouts.current[id]) {
        clearTimeout(deleteTimeouts.current[id]);
        delete deleteTimeouts.current[id];
      }
      setFiles(previousFiles);
      setData(previousData);
      addToast({ message: `Restored ${fileToDelete.filename}`, type: 'info' });
    };

    // Delay actual deletion
    deleteTimeouts.current[id] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/files/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete');
        delete deleteTimeouts.current[id];
      } catch (error) {
        console.error('Delete error:', error);
        // Revert optimistic update on error
        setFiles(previousFiles);
        setData(previousData);
        addToast({ message: `Failed to delete ${fileToDelete.filename}`, type: 'error' });
      }
    }, 5000);

    addToast({
      message: `${fileToDelete.filename} deleted`,
      type: 'info',
      duration: 5000,
      onUndo: undoDelete
    });
  };

  const availableCategories = useMemo(() => {
    const filteredByLocation = activeLocationId === 'all' ? data : data.filter(r => r.locationId === activeLocationId);
    return Array.from(new Set(filteredByLocation.map((r) => r.category))).sort();
  }, [data, activeLocationId]);

  const availableProducts = useMemo(() => {
    const filteredByLocation = activeLocationId === 'all' ? data : data.filter(r => r.locationId === activeLocationId);
    return Array.from(new Set(filteredByLocation.map((r) => r.productName))).sort();
  }, [data, activeLocationId]);

  const filteredData = useMemo(() => {
    return data.filter((record) => {
      // Location filter
      if (activeLocationId !== 'all' && record.locationId !== activeLocationId) {
        return false;
      }

      // Date filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const recordDate = startOfDay(record.billDate);
        const start = startOfDay(filters.dateRange.start);
        const end = endOfDay(filters.dateRange.end);
        if (!isWithinInterval(recordDate, { start, end })) {
          return false;
        }
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(record.category)) {
        return false;
      }

      // Product filter
      if (filters.productNames.length > 0 && !filters.productNames.includes(record.productName)) {
        return false;
      }

      return true;
    });
  }, [data, filters, activeLocationId]);

  return (
    <DataContext.Provider
      value={{
        data,
        filteredData,
        setData,
        filters,
        setFilters,
        availableCategories,
        availableProducts,
        files,
        isLoading,
        uploadFile,
        uploadFiles,
        deleteFile,
        reassignFileLocation,
        refreshData,
        closedDays,
        toggleClosedDay,
        locations,
        activeLocationId,
        setActiveLocationId,
        createLocation,
        updateLocation
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
