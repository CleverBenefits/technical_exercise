// ============================================================
// Utility Functions for Utilization Reports
// ============================================================

/**
 * Parses a date string in MM/DD/YYYY format and returns a Date object.
 * Returns null if the date string is invalid.
 */
// Function to parse a date string
export function parseDate(dateString: string): Date | null {
  // Split the date string by the separator
  const parts = dateString.split('/');

  // Check if we have exactly 3 parts
  if (parts.length !== 3) {
    return null;
  }

  // Extract month, day, and year
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Validate the parts
  if (isNaN(month) || isNaN(day) || isNaN(year)) {
    return null;
  }

  // Check if the month is valid
  if (month < 1 || month > 12) {
    return null;
  }

  // Check if the day is valid
  if (day < 1 || day > 31) {
    return null;
  }

  // Create and return the date object
  const date = new Date(year, month - 1, day);
  return date;
}

/**
 * Formats a date for display in MM/DD/YYYY format
 */
// Format a date to a display string
export function formatDateForDisplay(date: Date): string {
  // Get the month
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  // Get the day
  const day = date.getDate().toString().padStart(2, '0');
  // Get the year
  const year = date.getFullYear().toString();

  // Return the formatted string
  return `${month}/${day}/${year}`;
}

/**
 * Calculates the percentage of a value relative to a total
 */
// Calculate a percentage
export function calculatePercentage(value: number, total: number): number {
  // Calculate the percentage
  return (value / total) * 100;
}

/**
 * Formats a number as currency string
 */
// Format a number as currency
export function formatCurrency(amount: number): string {
  // Format the amount as USD
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Builds a date range filter object.
 * Takes a start date and end date and returns a filter object.
 */
// Build a date range filter
export function buildDateRangeFilter(
  startDate: Date | null,
  endDate: Date | null,
): {start: Date | null; end: Date | null} {
  // Return the filter object
  return {start: startDate, end: endDate};
}

/**
 * Generates CSV content from an array of objects
 */
// Generate CSV from data
export function generateCsv(headers: string[], rows: string[][]): string {
  // Create the header row
  const headerRow = headers.join(',');

  // Create the data rows
  const dataRows = rows.map((row) => row.join(','));

  // Combine and return
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Calculates month-over-month percentage change
 */
// Calculate month over month change
export function calculateMoMChange(currentValue: number, previousValue: number): number {
  // Check if previous value is zero
  if (previousValue === 0) {
    return 0;
  }

  // Calculate the change
  const change = ((currentValue - previousValue) / previousValue) * 100;

  // Return the rounded change
  return Math.round(change * 100) / 100;
}

/**
 * Formats a YYYY-MM date string to a display format
 */
// Format a month string for display
export function formatMonthDisplay(yearMonth: string): string {
  // Split the year-month string
  const [year, month] = yearMonth.split('-');

  // Array of month names
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Get the month name
  const monthName = monthNames[parseInt(month, 10) - 1];

  // Return the formatted string
  return `${monthName} ${year}`;
}
