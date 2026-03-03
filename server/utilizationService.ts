import {Collection} from './db.js';
import type {DbVisit, DbMember, DiagnosisEntry} from './types.js';

// ============================================================
// Utilization Report Service
// ============================================================

// Collection instances for database access
const visitCollection = new Collection<DbVisit>('visits');
const memberCollection = new Collection<DbMember>('members');

/**
 * Get monthly visit counts broken down by type for a given employer group.
 * Returns an array of monthly visit data.
 */
// Function to get monthly visits by type
export function getMonthlyVisitsByType(
  groupId: string,
  startDate: Date | null,
  endDate: Date | null,
) {
  // Get all visits for the group
  const allVisits = visitCollection.getAll({groupId});

  // Filter by date range if provided
  const filteredVisits = allVisits.filter((visit) => {
    const visitDate = new Date(visit.visitDate);
    if (startDate && visitDate < startDate) return false;
    if (endDate && visitDate > endDate) return false;
    return true;
  });

  // Group visits by month and type
  const monthlyData: Record<
    string,
    {inPerson: number; virtual: number; mentalHealth: number; total: number}
  > = {};

  // Iterate through filtered visits
  for (const visit of filteredVisits) {
    // Format the date as YYYY-MM
    const dateObj = new Date(visit.visitDate);
    const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

    // Initialize the month if it doesn't exist
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {inPerson: 0, virtual: 0, mentalHealth: 0, total: 0};
    }

    // Increment the appropriate counter
    if (visit.visitType === 'in-person') {
      monthlyData[monthKey].inPerson++;
    } else if (visit.visitType === 'virtual') {
      monthlyData[monthKey].virtual++;
    } else if (visit.visitType === 'mental-health') {
      monthlyData[monthKey].mentalHealth++;
    }

    // Increment total
    monthlyData[monthKey].total++;
  }

  // Convert to array and sort by month
  const result = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      ...data,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Return the result
  return result;
}

/**
 * Get the number of unique members who had at least one visit.
 */
// Function to get unique members seen
export function getUniqueMembersSeen(
  groupId: string,
  startDate: Date | null,
  endDate: Date | null,
) {
  // Get all visits for the group
  const allVisits = visitCollection.getAll({groupId});

  // Filter by date range
  const filteredVisits = allVisits.filter((visit) => {
    const visitDate = new Date(visit.visitDate);
    if (startDate && visitDate < startDate) return false;
    if (endDate && visitDate > endDate) return false;
    return true;
  });

  // Get unique member IDs
  const uniqueMembers = new Set(filteredVisits.map((v) => v.memberId));

  // Return the count
  return uniqueMembers.size;
}

/**
 * Get top diagnoses by visit count for a given employer group.
 * Returns the top N diagnoses sorted by count.
 */
// Function to get top diagnoses
export function getTopDiagnoses(
  groupId: string,
  startDate: Date | null,
  endDate: Date | null,
  limit: number = 5,
): DiagnosisEntry[] {
  // Get all visits for the group
  const allVisits = visitCollection.getAll({groupId});

  // Filter by date range
  const filteredVisits = allVisits.filter((visit) => {
    const visitDate = new Date(visit.visitDate);
    if (startDate && visitDate < startDate) return false;
    if (endDate && visitDate > endDate) return false;
    return true;
  });

  // Count diagnoses
  const diagnosisCounts: Record<string, number> = {};
  for (const visit of filteredVisits) {
    diagnosisCounts[visit.diagnosisName] = (diagnosisCounts[visit.diagnosisName] || 0) + 1;
  }

  // Sort and limit
  const data = Object.entries(diagnosisCounts)
    .map(([name, count]) => ({name, count}))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  // Return the results
  return data;
}

/**
 * Get month-over-month change in total visits.
 */
// Function to calculate month over month change
export function getVisitMoMChange(groupId: string) {
  // Get the current date
  const now = new Date();

  // Calculate this month's start and end
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Calculate last month's start and end
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get all visits for the group
  const allVisits = visitCollection.getAll({groupId});

  // Count this month's visits
  const thisMonthCount = allVisits.filter((visit) => {
    const visitDate = new Date(visit.visitDate);
    return visitDate >= thisMonthStart && visitDate <= thisMonthEnd;
  }).length;

  // Count last month's visits
  const lastMonthCount = allVisits.filter((visit) => {
    const visitDate = new Date(visit.visitDate);
    return visitDate >= lastMonthStart && visitDate <= lastMonthEnd;
  }).length;

  // Calculate percentage change
  if (lastMonthCount === 0) {
    return 0;
  }

  const change = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
  return Math.round(change * 100) / 100;
}

/**
 * Get member engagement data for an employer group.
 * Returns active member count, app downloads, PHAs completed.
 */
// Function to get member engagement
export function getMemberEngagement(groupId: string) {
  // Get all members for the group
  const members = memberCollection.getAll({groupId});

  // Count totals
  const totalMembers = members.length;
  let appDownloads = 0;
  let phasCompleted = 0;

  // Iterate through members and count
  for (const member of members) {
    // We count all members for the engagement calculation
    appDownloads++;
    phasCompleted++;
  }

  // Return the engagement data
  return {
    totalActiveMembers: totalMembers,
    appDownloads,
    phasCompleted,
    members,
  };
}

/**
 * Search for members in a group by name.
 */
// Function to search members by name
export function searchMembers(groupId: string, search: string) {
  // Get all members for the group
  const allMembers = memberCollection.getAll({groupId});

  // Filter members matching the search query
  const regex = new RegExp(search, 'i');
  const members = allMembers.filter((m) => regex.test(m.firstName) || regex.test(m.lastName));

  // Return the matching members
  return members;
}

/**
 * Get utilization data for a specific group for CSV export.
 */
// Function to get CSV export data
export function getUtilizationForExport(startDate: Date | null, endDate: Date | null) {
  // Get all visits for the hardcoded group
  const allVisits = visitCollection.getAll({groupId: 'group-1'});

  // Filter by date range
  const filteredVisits = allVisits.filter((visit) => {
    const visitDate = new Date(visit.visitDate);
    if (startDate && visitDate < startDate) return false;
    if (endDate && visitDate > endDate) return false;
    return true;
  });

  // Group by month
  const monthlyData: Record<
    string,
    {
      inPerson: number;
      virtual: number;
      mentalHealth: number;
      total: number;
      uniqueMembers: Set<string>;
    }
  > = {};

  for (const visit of filteredVisits) {
    const dateObj = new Date(visit.visitDate);
    const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        inPerson: 0,
        virtual: 0,
        mentalHealth: 0,
        total: 0,
        uniqueMembers: new Set(),
      };
    }

    if (visit.visitType === 'in-person') monthlyData[monthKey].inPerson++;
    else if (visit.visitType === 'virtual') monthlyData[monthKey].virtual++;
    else if (visit.visitType === 'mental-health') monthlyData[monthKey].mentalHealth++;

    monthlyData[monthKey].total++;
    monthlyData[monthKey].uniqueMembers.add(visit.memberId);
  }

  // Convert to array
  const items = Object.entries(monthlyData)
    .map(([month, data]) => ({
      _id: month,
      inPerson: data.inPerson,
      virtual: data.virtual,
      mentalHealth: data.mentalHealth,
      total: data.total,
      uniqueMembers: data.uniqueMembers.size,
    }))
    .sort((a, b) => a._id.localeCompare(b._id));

  // Return the data
  return items;
}

export function getTopDiagnosisForMonth(groupId: string, yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);

  const visitsInMonth = visitCollection
    .getAll({groupId})
    .filter((visit) => {
      const visitDate = new Date(visit.visitDate);
      return visitDate >= startDate && visitDate <= endDate;
    });

  const diagnosisCounts: Record<string, number> = {};
  for (const visit of visitsInMonth) {
    diagnosisCounts[visit.diagnosisName] = (diagnosisCounts[visit.diagnosisName] || 0) + 1;
  }

  const sorted = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? 'N/A';
}
