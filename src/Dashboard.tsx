import {useState, useRef, useEffect} from 'react';
import dayjs from 'dayjs';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import {trpc} from './trpc';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const DATE_PRESETS = [
  {value: 'last12months', label: 'Last 12 Months'},
  {value: 'last6months', label: 'Last 6 Months'},
  {value: 'thisyear', label: 'This Year'},
  {value: 'lastyear', label: 'Last Year'},
  {value: 'custom', label: 'Custom Range'},
];

function getPresetRange(preset: string): [Date | null, Date | null] {
  switch (preset) {
    case 'last12months':
      return [dayjs().subtract(12, 'month').startOf('day').toDate(), dayjs().endOf('day').toDate()];
    case 'last6months':
      return [dayjs().subtract(6, 'month').startOf('day').toDate(), dayjs().endOf('day').toDate()];
    case 'thisyear':
      return [dayjs().startOf('year').toDate(), dayjs().endOf('year').toDate()];
    case 'lastyear':
      return [
        dayjs().subtract(1, 'year').startOf('year').toDate(),
        dayjs().subtract(1, 'year').endOf('year').toDate(),
      ];
    default:
      return [null, null];
  }
}

function toApiDate(date: Date | null): string | undefined {
  return date ? dayjs(date).format('MM/DD/YYYY') : undefined;
}

const GROUPS = [
  {id: 'group-1', name: 'Acme Health Corp'},
  {id: 'group-2', name: 'Summit Benefits LLC'},
  {id: 'group-3', name: 'Pinnacle Wellness Inc'},
  {id: 'group-4', name: 'Harbor Health Partners'},
  {id: 'group-5', name: 'Coastal Care Group'},
];

function formatMonth(yearMonth: string) {
  const [year, month] = yearMonth.split('-');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

const GroupSelector = ({value, onChange}: {value: string; onChange: (id: string) => void}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedName = GROUPS.find((g) => g.id === value)?.name ?? '';
  const filtered = GROUPS.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-xs font-medium text-gray-500">Client</label>
      <div
        className="flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        onClick={() => {
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="w-full outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate">{selectedName}</span>
        )}
        <svg
          className={`ml-2 size-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">No groups found</div>
          ) : (
            filtered.map((g) => (
              <div
                key={g.id}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-emerald-50 ${
                  g.id === value ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-700'
                }`}
                onClick={() => {
                  onChange(g.id);
                  setOpen(false);
                  setSearch('');
                }}
              >
                {g.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const Dashboard = () => {
  const [groupId, setGroupId] = useState('group-1');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(
    getPresetRange('last12months'),
  );

  const summaryQuery = trpc.utilization.getUtilizationSummary.useQuery({
    groupId,
    startDate: toApiDate(dateRange[0]),
    endDate: toApiDate(dateRange[1]),
  });

  const diagnosesQuery = trpc.utilization.getTopDiagnoses.useQuery({
    groupId,
    startDate: toApiDate(dateRange[0]),
    endDate: toApiDate(dateRange[1]),
    limit: 8,
  });

  const engagementQuery = trpc.utilization.getMemberEngagement.useQuery({
    groupId,
  });

  const exportMutation = trpc.utilization.exportUtilizationCsv.useQuery(
    {
      groupId,
      startDate: toApiDate(dateRange[0]),
      endDate: toApiDate(dateRange[1]),
    },
    {enabled: false},
  );

  const handleExport = async () => {
    const result = await exportMutation.refetch();
    if (result.data?.csv) {
      const blob = new Blob([result.data.csv], {type: 'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'utilization-report.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const summary = summaryQuery.data;
  const diagnoses = diagnosesQuery.data?.diagnoses ?? [];
  const engagement = engagementQuery.data;
  const maxDiagnosisCount = Math.max(...diagnoses.map((d: {count: number}) => d.count), 1);

  const selectedGroupName = GROUPS.find((g) => g.id === groupId)?.name ?? '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a2332] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-400 text-sm font-bold text-[#1a2332]">
              CB
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Employer Utilization Report</h1>
              <p className="text-sm text-gray-400">{selectedGroupName}</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Download Report
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <GroupSelector value={groupId} onChange={setGroupId} />
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 pb-8">
        {summaryQuery.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-8 animate-spin rounded-full border-b-2 border-emerald-500" />
          </div>
        ) : summaryQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Failed to load utilization data. Please try again.
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <SummaryCard
                label="Total Members"
                value={summary?.totalActiveMembers ?? 0}
                change={null}
              />
              <SummaryCard
                label="Active Members"
                value={summary?.totalActiveMembers ?? 0}
                change={null}
              />
              <SummaryCard
                label="Unique Members Seen"
                value={summary?.uniqueMembersSeen ?? 0}
                change={null}
              />
              <SummaryCard
                label="Engagement Rate"
                value={`${summary?.engagementRate ?? 0}%`}
                change={null}
              />
              <SummaryCard
                label="Total Visits"
                value={summary?.totalVisits ?? 0}
                change={summary?.monthOverMonthChange ?? null}
                changeLabel="vs. last month"
              />
            </div>

            {/* Charts Row */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Monthly Utilization Trends */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold text-gray-800">
                  Monthly Utilization Trends
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary?.monthlyVisits ?? []}>
                      <defs>
                        <linearGradient id="colorInPerson" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorVirtual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorMental" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={formatMonth}
                        tick={{fontSize: 11, fill: '#9ca3af'}}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{fontSize: 11, fill: '#9ca3af'}}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        labelFormatter={formatMonth}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize: '12px'}} />
                      <Area
                        type="monotone"
                        dataKey="inPerson"
                        name="In-Person"
                        stroke="#10b981"
                        fill="url(#colorInPerson)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="virtual"
                        name="Virtual"
                        stroke="#3b82f6"
                        fill="url(#colorVirtual)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="mentalHealth"
                        name="Mental Health"
                        stroke="#8b5cf6"
                        fill="url(#colorMental)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Diagnoses */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-800">Top Diagnoses</h2>
                {diagnosesQuery.isLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="size-6 animate-spin rounded-full border-b-2 border-emerald-500" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diagnoses.map((d: {name: string; count: number}, i: number) => (
                      <div key={i}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="truncate pr-2 font-medium text-gray-700">{d.name}</span>
                          <span className="shrink-0 text-gray-500">{d.count} visits</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{width: `${(d.count / maxDiagnosisCount) * 100}%`}}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Visit Breakdown Chart */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-800">Visit Type Breakdown</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary?.monthlyVisits?.slice(-6) ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={formatMonth}
                        tick={{fontSize: 11, fill: '#9ca3af'}}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{fontSize: 11, fill: '#9ca3af'}}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        labelFormatter={formatMonth}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                        }}
                      />
                      <Bar
                        dataKey="inPerson"
                        name="In-Person"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar dataKey="virtual" name="Virtual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar
                        dataKey="mentalHealth"
                        name="Mental Health"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Member Engagement Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-800">Member Engagement</h2>
                {engagementQuery.isLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="size-6 animate-spin rounded-full border-b-2 border-emerald-500" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <EngagementStat
                        label="Total Members"
                        value={engagement?.totalActiveMembers ?? 0}
                      />
                      <EngagementStat label="App Downloads" value={engagement?.appDownloads ?? 0} />
                      <EngagementStat
                        label="PHAs Completed"
                        value={engagement?.phasCompleted ?? 0}
                      />
                      <EngagementStat
                        label="Engagement Rate"
                        value={`${engagement?.engagementRate ?? 0}%`}
                      />
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-500">
                        Showing data for {engagement?.totalActiveMembers ?? 0} members in{' '}
                        {selectedGroupName}
                      </p>
                      {engagement?.members &&
                        (() => {
                          const counts: Record<string, number> = {};
                          for (const m of engagement.members) {
                            const s = (m as Record<string, unknown>).status as string;
                            counts[s] = (counts[s] || 0) + 1;
                          }
                          return (
                            <div className="mt-2 flex gap-3 text-xs text-gray-400">
                              {Object.entries(counts).map(([status, count]) => (
                                <span key={status}>
                                  {String(count)} {status}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  change,
  changeLabel,
}: {
  label: string;
  value: number | string;
  change: number | null;
  changeLabel?: string;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {change !== null && (
      <p className={`mt-1 text-xs ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {change >= 0 ? '+' : ''}
        {change}% {changeLabel}
      </p>
    )}
  </div>
);

const EngagementStat = ({label, value}: {label: string; value: number | string}) => (
  <div className="rounded-lg bg-gray-50 p-4">
    <p className="mb-1 text-xs text-gray-500">{label}</p>
    <p className="text-xl font-bold text-gray-900">{value}</p>
  </div>
);

const DateRangePicker = ({
  value,
  onChange,
}: {
  value: [Date | null, Date | null];
  onChange: (range: [Date | null, Date | null]) => void;
}) => {
  const [preset, setPreset] = useState('last12months');
  const [pendingStart, setPendingStart] = useState<Date | undefined>();
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pendingStart) return;
    const handler = (e: MouseEvent) => {
      if (!pickerRef.current || pickerRef.current.contains(e.target as Node)) return;
      const snapped: [Date, Date] = [pendingStart, dayjs(pendingStart).endOf('day').toDate()];
      onChange(snapped);
      setPendingStart(undefined);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [pendingStart, onChange]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPreset(val);
    if (val !== 'custom') {
      onChange(getPresetRange(val));
      setPendingStart(undefined);
    }
  };

  const handleCalendarChange = (dates: Date[]) => {
    setPreset('custom');
    if (dates.length === 2) {
      onChange([dates[0], dayjs(dates[1]).endOf('day').toDate()]);
      setPendingStart(undefined);
    } else {
      setPendingStart(dates[0]);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">Reporting Period</label>
      <div className="flex items-center gap-2">
        <select
          value={preset}
          onChange={handlePresetChange}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <div ref={pickerRef} className="relative">
          <Flatpickr
            className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            options={{
              mode: 'range',
              static: true,
              monthSelectorType: 'static',
              dateFormat: 'M j, Y',
              prevArrow:
                '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8l1.4-1.4-4-4 4-4L5.4 0 0 5.4z" /></svg>',
              nextArrow:
                '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L0 9.4l4-4-4-4L1.4 0l5.4 5.4z" /></svg>',
            }}
            value={value.filter((d): d is Date => d !== null)}
            onChange={handleCalendarChange}
          />
        </div>
      </div>
    </div>
  );
};
