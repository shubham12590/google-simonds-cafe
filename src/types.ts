export interface Location {
  id: string;
  displayName: string;
  city: string;
  timezone: string;
  isActive: boolean;
}

export interface RawSaleRecord {
  'Bill Date': string | number;
  'Bill Time': string | number;
  'Product Name': string;
  'Category': string;
  'Quantity': number;
  'Rate': number;
  'Total Amount': number;
  [key: string]: any;
}

export interface SaleRecord {
  id: string | number;
  fileId?: number; // Added for file management
  locationId?: string;
  billNo?: string;
  billDate: Date;
  billTime: string; // HH:mm format
  productName: string;
  category: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  // Calculated fields
  timeSlot: 'Morning' | 'Afternoon' | 'Evening';
  hour: number;
}

export interface GlobalFilters {
  dateRange: { start: Date | null; end: Date | null };
  categories: string[];
  productNames: string[];
}
