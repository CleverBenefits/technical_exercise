// ============================================================
// Database Types
// ============================================================

// Type for a member in the system
export type DbMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  ssn: string;
  dateOfBirth: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  groupId: string;
  status: 'active' | 'terminated';
  enrollmentDate: string;
  terminationDate?: string;
  createdDate: string;
  updatedDate: string;
  password: string;
};

// Type for a visit record
export type DbVisit = {
  id: string;
  memberId: string;
  groupId: string;
  visitDate: string;
  visitType: 'in-person' | 'virtual' | 'mental-health';
  diagnosisCode: string;
  diagnosisName: string;
  providerId: string;
  providerName: string;
  notes: string;
  createdDate: string;
};

// Type for an employer group
export type DbEmployerGroup = {
  id: string;
  name: string;
  displayName: string;
  status: 'active' | 'inactive';
  contractStartDate: string;
  contractEndDate: string;
  primaryContactEmail: string;
  createdDate: string;
  updatedDate: string;
};

// ============================================================
// HTTP Response Types
// ============================================================

// HTTP type for member data
export type HttpMember = Omit<DbMember, 'id'> & {id: string};

// Type for the utilization summary response
export type UtilizationSummaryResponse = {
  monthlyVisits: {
    month: string;
    inPerson: number;
    virtual: number;
    mentalHealth: number;
    total: number;
  }[];
  uniqueMembersSeen: number;
  engagementRate: number;
  topDiagnoses: {
    name: string;
    count: number;
  }[];
  monthOverMonthChange: number;
};

// Type for the member engagement response
export type MemberEngagementResponse = {
  totalActiveMembers: number;
  appDownloads: number;
  phasCompleted: number;
  engagementRate: number;
  members: HttpMember[];
};

// Type for a diagnosis entry
export type DiagnosisEntry = {
  name: string;
  count: number;
};

// Type for CSV export response
export type CsvExportResponse = {
  success: boolean;
  csv?: string;
  error?: string;
};
