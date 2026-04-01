
/**
 * Winsorize a dataset to handle outliers.
 * Replaces values below the 5th percentile and above the 95th percentile
 * (or based on IQR) with the nearest boundary value.
 */

export function winsorize(
  values: number[], 
  options: { iqrMultiplier?: number; capMultiplier?: number } = {}
): number[] {
  if (values.length < 4) return values; // Not enough data to determine outliers reliably

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;

  const multiplier = options.iqrMultiplier || 1.5;
  const lowerBound = q1 - (iqr * multiplier);
  const upperBound = q3 + (iqr * multiplier);

  return values.map(v => {
    if (v < lowerBound) return Math.max(v, lowerBound); // Or just lowerBound? Usually we clamp.
    if (v > upperBound) return upperBound;
    return v;
  });
}
