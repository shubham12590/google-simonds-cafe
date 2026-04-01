
import { SaleRecord } from '../../types';
import { startOfDay, format } from 'date-fns';

export function detectClosedDays(data: SaleRecord[]): Set<string> {
  const dailyStats = new Map<string, { revenue: number; orders: number }>();

  data.forEach(record => {
    const dateKey = format(startOfDay(record.billDate), 'yyyy-MM-dd');
    const current = dailyStats.get(dateKey) || { revenue: 0, orders: 0 };
    
    dailyStats.set(dateKey, {
      revenue: current.revenue + record.totalAmount,
      orders: current.orders + 1 // Assuming 1 record = 1 order item line. Ideally we count unique billNos.
    });
  });

  // If we have billNo, we should count unique billNos for 'orders'
  // Let's refine this to count unique billNos if available
  const dailyOrders = new Map<string, Set<string>>();
  data.forEach(record => {
    const dateKey = format(startOfDay(record.billDate), 'yyyy-MM-dd');
    if (record.billNo) {
      const orders = dailyOrders.get(dateKey) || new Set();
      orders.add(record.billNo);
      dailyOrders.set(dateKey, orders);
    }
  });

  const closedDays = new Set<string>();
  
  dailyStats.forEach((stats, dateKey) => {
    const uniqueOrders = dailyOrders.get(dateKey)?.size || stats.orders; // Fallback to record count if billNo missing
    
    // Criteria: Revenue <= 10 OR Orders == 0
    if (stats.revenue <= 10 || uniqueOrders === 0) {
      closedDays.add(dateKey);
    }
  });

  return closedDays;
}
