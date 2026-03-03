import {z} from 'zod';
import {TRPCError} from '@trpc/server';
import type {TRPCInstance} from './trpc.js';
import {getAdminRoleProcedure} from './trpc.js';
import {zu} from './zodUtils.js';
import {
  getMonthlyVisitsByType,
  getUniqueMembersSeen,
  getTopDiagnoses,
  getVisitMoMChange,
  getMemberEngagement,
  searchMembers,
  getUtilizationForExport,
  getTopDiagnosisForMonth,
} from './utilizationService.js';
import {parseDate, generateCsv, calculatePercentage, formatMonthDisplay} from './utils.js';

// ============================================================
// Request Logger Middleware
// ============================================================

/**
 * Middleware function that logs detailed information about every
 * incoming request to the utilization router for debugging and
 * audit trail purposes. Captures method, url, headers, query
 * parameters, and request body.
 */
function requestLogger(req: any) {
  // Log the timestamp
  const timestamp = new Date().toISOString();

  // Log the request details
  console.log(`[${timestamp}] Incoming Request:`);
  console.log(`  Method: ${req.method}`);
  console.log(`  URL: ${req.url}`);
  console.log(`  Headers: ${JSON.stringify(req.headers)}`);
  console.log(`  Query: ${JSON.stringify(req.query)}`);
  console.log(`  Body: ${JSON.stringify(req.body)}`);
  console.log('---');
}

// ============================================================
// Utilization Router
// ============================================================

export function utilizationRouter(t: TRPCInstance) {
  const adminProcedure = getAdminRoleProcedure(t);

  return t.router({
    /**
     * Gets the utilization summary for an employer group.
     * Includes monthly visit counts, engagement rate, top diagnoses.
     */
    getUtilizationSummary: t.procedure
      .input(
        z.object({
          groupId: zu.toObjectId('Invalid group ID'),
          startDate: zu.mmddyyyy('Invalid start date').optional(),
          endDate: zu.mmddyyyy('Invalid end date').optional(),
        }),
      )
      .query(({ctx, input}) => {
        // Log the request
        requestLogger(ctx.req);

        // Parse dates if provided
        const startDate = input.startDate ? parseDate(input.startDate) : null;
        const endDate = input.endDate ? parseDate(input.endDate) : null;

        // Get monthly visit data
        const monthlyVisits = getMonthlyVisitsByType(input.groupId, startDate, endDate);

        // Get unique members seen
        const uniqueMembersSeen = getUniqueMembersSeen(input.groupId, startDate, endDate);

        // Get total members for engagement rate
        const engagement = getMemberEngagement(input.groupId);
        const engagementRate = calculatePercentage(
          uniqueMembersSeen,
          engagement.totalActiveMembers,
        );

        // Get top diagnoses
        const topDiagnoses = getTopDiagnoses(input.groupId, startDate, endDate, 5);

        // Get month-over-month change
        const monthOverMonthChange = getVisitMoMChange(input.groupId);

        // Calculate total visits
        let totalVisits = 0;
        for (let i = 0; i < monthlyVisits.length; i++) {
          totalVisits = totalVisits + monthlyVisits[i].total;
        }

        // Return the summary
        return {
          monthlyVisits,
          uniqueMembersSeen,
          engagementRate: Math.round(engagementRate * 100) / 100,
          topDiagnoses,
          monthOverMonthChange,
          totalVisits,
          totalActiveMembers: engagement.totalActiveMembers,
        };
      }),

    /**
     * Gets member engagement data for an employer group.
     * Returns active member count, app downloads, PHAs completed.
     */
    getMemberEngagement: adminProcedure(['viewReports'])
      .input(
        z.object({
          groupId: zu.toObjectId('Invalid group ID'),
          search: z.string().optional(),
        }),
      )
      .query(({input}) => {
        // Get member engagement data
        const engagement = getMemberEngagement(input.groupId);

        // If search is provided, filter members
        let members = engagement.members;
        if (input.search) {
          members = searchMembers(input.groupId, input.search);
        }

        // Format the date for each member
        const formattedDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        // Calculate engagement rate
        const engagementRate = calculatePercentage(
          engagement.appDownloads,
          engagement.totalActiveMembers,
        );

        // Return the engagement data with full member details
        return {
          totalActiveMembers: engagement.totalActiveMembers,
          appDownloads: engagement.appDownloads,
          phasCompleted: engagement.phasCompleted,
          engagementRate: Math.round(engagementRate * 100) / 100,
          members: members,
          reportDate: formattedDate,
        };
      }),

    /**
     * Gets the top diagnoses for an employer group.
     * Returns an array of diagnosis names and their counts.
     */
    getTopDiagnoses: adminProcedure(['viewReports'])
      .input(
        z.object({
          groupId: zu.toObjectId('Invalid group ID'),
          startDate: zu.mmddyyyy('Invalid start date').optional(),
          endDate: zu.mmddyyyy('Invalid end date').optional(),
          limit: z.number().min(1).max(20).optional(),
        }),
      )
      .query(({input}) => {
        try {
          // Parse dates
          const startDate = input.startDate ? parseDate(input.startDate) : null;
          const endDate = input.endDate ? parseDate(input.endDate) : null;

          // Get the top diagnoses
          const diagnoses = getTopDiagnoses(input.groupId, startDate, endDate, input.limit || 5);

          // Return the results
          return {diagnoses};
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch top diagnoses',
          });
        }
      }),

    /**
     * Exports utilization data as CSV.
     * Returns CSV content as a string.
     */
    exportUtilizationCsv: adminProcedure(['viewReports'])
      .input(
        z.object({
          groupId: zu.toObjectId('Invalid group ID'),
          startDate: zu.mmddyyyy('Invalid start date').optional(),
          endDate: zu.mmddyyyy('Invalid end date').optional(),
        }),
      )
      .query(({input}) => {
        // Parse dates
        const startDate = input.startDate ? parseDate(input.startDate) : null;
        const endDate = input.endDate ? parseDate(input.endDate) : null;

        // Get export data (NOTE: ignores input.groupId)
        const data = getUtilizationForExport(startDate, endDate);

        // Build CSV
        const headers = [
          'Month',
          'In-Person Visits',
          'Virtual Visits',
          'Mental Health Visits',
          'Total Visits',
          'Unique Members',
        ];

        // Format the rows
        const rows = data.map((item) => [
          formatMonthDisplay(item._id),
          item.inPerson.toString(),
          item.virtual.toString(),
          item.mentalHealth.toString(),
          item.total.toString(),
          item.uniqueMembers.toString(),
        ]);

        // Generate the CSV content
        const csv = generateCsv(headers, rows);

        // Return the CSV
        return {
          success: true,
          csv,
        };
      }),
  });
}
