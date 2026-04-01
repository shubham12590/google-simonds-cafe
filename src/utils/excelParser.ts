import * as XLSX from 'xlsx';
import { RawSaleRecord, SaleRecord } from '../types';
import { parse, isValid, format } from 'date-fns';

// Helper to parse Excel date
function parseExcelDate(excelDate: number | string): Date | null {
  if (typeof excelDate === 'number') {
    // Excel dates are days since 1900-01-01
    // 25569 is the number of days between 1900-01-01 and 1970-01-01
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    // Adjust for timezone offset
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + offset);
  }
  
  if (typeof excelDate === 'string') {
    // Try common formats
    const formats = ['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy'];
    for (const fmt of formats) {
      const parsed = parse(excelDate, fmt, new Date());
      if (isValid(parsed)) return parsed;
    }
    const parsedDate = new Date(excelDate);
    if (isValid(parsedDate)) return parsedDate;
  }
  
  return null;
}

// Helper to parse Excel time
function parseExcelTime(excelTime: number | string): string {
  if (typeof excelTime === 'number') {
    // Fraction of a day
    const totalSeconds = Math.round(excelTime * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  if (typeof excelTime === 'string') {
    // Try to extract HH:mm
    const match = excelTime.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      // Check for PM
      if (excelTime.toLowerCase().includes('pm') && hours < 12) {
        hours += 12;
      }
      if (excelTime.toLowerCase().includes('am') && hours === 12) {
        hours = 0;
      }
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }
  
  return '00:00';
}

function getTimeSlot(timeStr: string): 'Morning' | 'Afternoon' | 'Evening' {
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour >= 6 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 18) return 'Afternoon';
  return 'Evening';
}

function findValue(row: any, possibleKeys: string[]): any {
  if (!row) return undefined;
  const keys = Object.keys(row);
  for (const pk of possibleKeys) {
    const pkl = pk.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const k of keys) {
      if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === pkl) {
        return row[k];
      }
    }
  }
  return undefined;
}

export async function parseExcelFile(file: File): Promise<SaleRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume first sheet is the data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Find the header row by scanning the first 20 rows
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        let headerRowIndex = 0;
        
        for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
          const row = rawRows[i];
          if (!row || !Array.isArray(row)) continue;
          
          const rowString = row.join(' ').toLowerCase();
          // Look for common Petpooja header keywords
          if (
            (rowString.includes('date') && rowString.includes('amount')) ||
            (rowString.includes('item') && rowString.includes('qty')) ||
            (rowString.includes('product') && rowString.includes('total'))
          ) {
            headerRowIndex = i;
            break;
          }
        }
        
        // Convert to JSON starting from the found header row
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { range: headerRowIndex });
        
        console.log(`Found header at row ${headerRowIndex}. Total data rows:`, rawData.length);
        if (rawData.length > 0) {
          console.log('First row keys:', Object.keys(rawData[0]));
        }
        
        const records: SaleRecord[] = [];
        
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          
          const rawBillDate = findValue(row, ['Bill Date', 'Date', 'BillDate', 'Order Date', 'Invoice Date']);
          const rawProductName = findValue(row, ['Product Name', 'Item Name', 'Item', 'Product', 'ItemName']);
          const rawTotalAmount = findValue(row, ['Total Amount', 'Amount', 'Total', 'Net Amount', 'Grand Total', 'Final Amount', 'Item Total', 'Sub Total']);
          const rawBillNo = findValue(row, ['Bill No', 'Order No', 'Invoice No', 'Bill Number', 'Order ID', 'Invoice ID', 'BillNo']);
          
          // Check required columns
          if (rawBillDate === undefined || rawProductName === undefined || rawTotalAmount === undefined) {
            if (i < 5) console.log('Skipping row due to missing required columns:', row);
            continue; // Skip invalid rows
          }
          
          const billDate = parseExcelDate(rawBillDate);
          if (!billDate) {
            if (i < 5) console.log('Skipping row due to invalid date:', rawBillDate);
            continue; // Skip if date is invalid
          }
          
          const rawBillTime = findValue(row, ['Bill Time', 'Time', 'BillTime', 'Order Time']);
          const billTime = parseExcelTime(rawBillTime || '00:00');
          const hour = parseInt(billTime.split(':')[0], 10);
          const timeSlot = getTimeSlot(billTime);
          
          const rawCategory = findValue(row, ['Category', 'Item Category', 'Group', 'Parent Category']);
          const rawQuantity = findValue(row, ['Quantity', 'Qty', 'Item Qty']);
          const rawRate = findValue(row, ['Rate', 'Price', 'Item Price', 'Unit Price']);
          
          records.push({
            id: `row-${i}`,
            billNo: rawBillNo ? String(rawBillNo) : undefined,
            billDate,
            billTime,
            productName: String(rawProductName || 'Unknown'),
            category: String(rawCategory || 'Uncategorized'),
            quantity: Number(rawQuantity) || 1,
            rate: Number(rawRate) || 0,
            totalAmount: Number(rawTotalAmount) || 0,
            timeSlot,
            hour
          });
        }
        
        resolve(records);
      } catch (error) {
        console.error("Excel parsing error:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
