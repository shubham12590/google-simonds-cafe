
import { format } from 'date-fns';
import { SaleRecord } from '../../types';
import { NormalizedRow } from './types';

export function normalizeRows(rows: SaleRecord[]): NormalizedRow[] {
  return rows.map(row => {
    const date = new Date(row.billDate);
    return {
      ...row,
      dayOfWeek: date.getDay(), // 0 = Sunday, 1 = Monday, etc.
      dateKey: format(date, 'yyyy-MM-dd'),
    };
  });
}

export function validateSchema(rows: NormalizedRow[]): { isValid: boolean; missingFields: string[] } {
  if (rows.length === 0) return { isValid: false, missingFields: ['No data'] };

  const sample = rows[0];
  const missingFields: string[] = [];

  if (sample.billDate === undefined) missingFields.push('Bill Date');
  if (sample.productName === undefined) missingFields.push('Product Name');
  if (sample.quantity === undefined) missingFields.push('Quantity');
  if (sample.totalAmount === undefined) missingFields.push('Total Amount');

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}
