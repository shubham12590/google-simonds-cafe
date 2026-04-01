
import { NormalizedRow, AggregatedProductData } from './types';
import { subYears, isAfter, parseISO } from 'date-fns';

export function aggregateByDateProduct(rows: NormalizedRow[]): Record<string, Record<string, { quantity: number; revenue: number; category: string }>> {
  const aggregated: Record<string, Record<string, { quantity: number; revenue: number; category: string }>> = {};

  for (const row of rows) {
    const { dateKey, productName, quantity, totalAmount, category } = row;

    if (!aggregated[dateKey]) {
      aggregated[dateKey] = {};
    }

    if (!aggregated[dateKey][productName]) {
      aggregated[dateKey][productName] = { quantity: 0, revenue: 0, category };
    }

    aggregated[dateKey][productName].quantity += quantity;
    aggregated[dateKey][productName].revenue += totalAmount;
  }

  return aggregated;
}

export function getMatchingWeekdayDates(
  rows: NormalizedRow[],
  targetWeekday: number, // 0-6
  windowYears: number = 1,
  excludeDates: Set<string> = new Set() // For closed days
): string[] {
  const cutoffDate = subYears(new Date(), windowYears);
  const uniqueDates = new Set<string>();

  for (const row of rows) {
    if (row.dayOfWeek === targetWeekday) {
      const date = new Date(row.billDate);
      if (isAfter(date, cutoffDate) && !excludeDates.has(row.dateKey)) {
        uniqueDates.add(row.dateKey);
      }
    }
  }

  return Array.from(uniqueDates).sort();
}

export function aggregateProductAcrossDates(
  agg: Record<string, Record<string, { quantity: number; revenue: number; category: string }>>,
  dateKeys: string[]
): Record<string, AggregatedProductData> {
  const productData: Record<string, AggregatedProductData> = {};

  for (const dateKey of dateKeys) {
    const dayData = agg[dateKey];
    if (!dayData) continue;

    for (const [productName, data] of Object.entries(dayData)) {
      if (!productData[productName]) {
        productData[productName] = {
          productName,
          category: data.category,
          totalQuantity: 0,
          daysAppeared: 0,
          dailyQuantities: [],
          dates: [],
          revenue: 0,
        };
      }

      productData[productName].totalQuantity += data.quantity;
      productData[productName].daysAppeared += 1;
      productData[productName].dailyQuantities.push(data.quantity);
      productData[productName].dates.push(dateKey);
      productData[productName].revenue += data.revenue;
    }
  }
  
  return productData;
}
