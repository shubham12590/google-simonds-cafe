import { SaleRecord } from '../types';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export interface PeriodStats {
  revenue: number;
  quantity: number;
  orders: number; // Estimated if billNo is missing
  aov: number;
}

export interface ProductGrowthStats {
  productName: string;
  category: string;
  revenueA: number;
  revenueB: number;
  revenueDiff: number;
  revenueGrowth: number;
  quantityA: number;
  quantityB: number;
  quantityGrowth: number;
  contributionA: number;
  contributionB: number;
  contributionShift: number;
}

export interface CategoryGrowthStats {
  category: string;
  revenueA: number;
  revenueB: number;
  revenueDiff: number;
  revenueGrowth: number;
  contributionA: number;
  contributionB: number;
  contributionShift: number;
}

export const filterDataByDateRange = (data: SaleRecord[], start: Date | null, end: Date | null): SaleRecord[] => {
  if (!start || !end) return [];
  const s = startOfDay(start);
  const e = endOfDay(end);
  return data.filter((r) => isWithinInterval(r.billDate, { start: s, end: e }));
};

export const calculatePeriodStats = (data: SaleRecord[]): PeriodStats => {
  const revenue = data.reduce((sum, r) => sum + r.totalAmount, 0);
  const quantity = data.reduce((sum, r) => sum + r.quantity, 0);
  
  // Estimate orders if billNo is missing or use unique billNos
  const uniqueBills = new Set(data.map(r => r.billNo || `${r.billDate.toISOString()}-${r.billTime}`));
  const orders = uniqueBills.size;
  
  const aov = orders > 0 ? revenue / orders : 0;

  return { revenue, quantity, orders, aov };
};

export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current === 0 ? 0 : 100; // Handle zero division
  return ((current - previous) / previous) * 100;
};

export const aggregateByProduct = (dataA: SaleRecord[], dataB: SaleRecord[]): ProductGrowthStats[] => {
  const productMap = new Map<string, { 
    category: string; 
    revA: number; 
    revB: number; 
    qtyA: number; 
    qtyB: number; 
  }>();

  const totalRevA = dataA.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalRevB = dataB.reduce((sum, r) => sum + r.totalAmount, 0);

  // Process Period A
  dataA.forEach(r => {
    if (!productMap.has(r.productName)) {
      productMap.set(r.productName, { category: r.category, revA: 0, revB: 0, qtyA: 0, qtyB: 0 });
    }
    const entry = productMap.get(r.productName)!;
    entry.revA += r.totalAmount;
    entry.qtyA += r.quantity;
  });

  // Process Period B
  dataB.forEach(r => {
    if (!productMap.has(r.productName)) {
      productMap.set(r.productName, { category: r.category, revA: 0, revB: 0, qtyA: 0, qtyB: 0 });
    }
    const entry = productMap.get(r.productName)!;
    entry.revB += r.totalAmount;
    entry.qtyB += r.quantity;
  });

  return Array.from(productMap.entries()).map(([name, stats]) => {
    const contributionA = totalRevA > 0 ? (stats.revA / totalRevA) * 100 : 0;
    const contributionB = totalRevB > 0 ? (stats.revB / totalRevB) * 100 : 0;

    return {
      productName: name,
      category: stats.category,
      revenueA: stats.revA,
      revenueB: stats.revB,
      revenueDiff: stats.revA - stats.revB,
      revenueGrowth: calculateGrowth(stats.revA, stats.revB),
      quantityA: stats.qtyA,
      quantityB: stats.qtyB,
      quantityGrowth: calculateGrowth(stats.qtyA, stats.qtyB),
      contributionA,
      contributionB,
      contributionShift: contributionA - contributionB
    };
  });
};

export const aggregateByCategory = (dataA: SaleRecord[], dataB: SaleRecord[]): CategoryGrowthStats[] => {
  const catMap = new Map<string, { revA: number; revB: number }>();

  const totalRevA = dataA.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalRevB = dataB.reduce((sum, r) => sum + r.totalAmount, 0);

  dataA.forEach(r => {
    if (!catMap.has(r.category)) catMap.set(r.category, { revA: 0, revB: 0 });
    catMap.get(r.category)!.revA += r.totalAmount;
  });

  dataB.forEach(r => {
    if (!catMap.has(r.category)) catMap.set(r.category, { revA: 0, revB: 0 });
    catMap.get(r.category)!.revB += r.totalAmount;
  });

  return Array.from(catMap.entries()).map(([cat, stats]) => {
    const contributionA = totalRevA > 0 ? (stats.revA / totalRevA) * 100 : 0;
    const contributionB = totalRevB > 0 ? (stats.revB / totalRevB) * 100 : 0;

    return {
      category: cat,
      revenueA: stats.revA,
      revenueB: stats.revB,
      revenueDiff: stats.revA - stats.revB,
      revenueGrowth: calculateGrowth(stats.revA, stats.revB),
      contributionA,
      contributionB,
      contributionShift: contributionA - contributionB
    };
  });
};

export const identifyRisks = (products: ProductGrowthStats[]) => {
  return products.filter(p => {
    // Risk criteria: Revenue drop > 15% AND absolute drop > 1000 (configurable)
    // OR Quantity drop > 15%
    // OR Negative contribution shift > 1%
    const significantRevDrop = p.revenueGrowth < -15 && Math.abs(p.revenueDiff) > 500;
    const significantQtyDrop = p.quantityGrowth < -15;
    const significantShift = p.contributionShift < -1;

    return significantRevDrop || significantQtyDrop || significantShift;
  });
};

export const generateInsights = (
  products: ProductGrowthStats[], 
  periodStatsA: PeriodStats, 
  periodStatsB: PeriodStats
): string[] => {
  const insights: string[] = [];
  
  // Overall Revenue
  const revGrowth = calculateGrowth(periodStatsA.revenue, periodStatsB.revenue);
  const direction = revGrowth >= 0 ? 'increased' : 'decreased';
  insights.push(`Total revenue ${direction} by ${Math.abs(revGrowth).toFixed(1)}% (₹${Math.abs(periodStatsA.revenue - periodStatsB.revenue).toLocaleString()}).`);

  // Top Driver
  const topDriver = [...products].sort((a, b) => b.revenueDiff - a.revenueDiff)[0];
  if (topDriver && topDriver.revenueDiff > 0) {
    insights.push(`Growth driven by ${topDriver.productName} (+₹${topDriver.revenueDiff.toLocaleString()}).`);
  }

  // Top Decline
  const topDecline = [...products].sort((a, b) => a.revenueDiff - b.revenueDiff)[0];
  if (topDecline && topDecline.revenueDiff < 0) {
    insights.push(`Major decline in ${topDecline.productName} (-₹${Math.abs(topDecline.revenueDiff).toLocaleString()}).`);
  }

  return insights;
};
