export type ClaimStatus =
  | 'Raised'
  | 'InProgress'
  | 'Review'
  | 'Closed';


export interface Claim {
  id: number;

  title: string;

  description: string;

  raisedByUserId: string;

  raisedByName: string;

  raisedByEmail: string;

  organizationId: string;

  organizationName: string;

  organizationLocation: string;

  managerUserId?: string;

  managerName?: string;

  managerEmail?: string;

  assignedEmployeeId?: string;

  assignedEmployeeName?: string;

  assignedEmployeeEmail?: string;

  status: ClaimStatus;

  resolutionComment?: string;

  createdAt: string;

  assignedAt?: string;

  updatedAt: string;

  resolvedAt?: string;

  attachments: ClaimAttachment[];

  history: ClaimHistory[];
}


export interface ClaimAttachment {

  id: number;

  fileName: string;

  contentType: string;

  createdAt: string;
}


export interface ClaimHistory {

  id: number;

  action: string;

  fromStatus?: string;

  toStatus?: string;

  performedByUserId: string;

  performedByName: string;

  performedByEmail: string;

  comment?: string;

  createdAt: string;
}


export interface CreateClaimRequest {

  title: string;

  description: string;

  photo?: File;

  video?: File;
}


export interface ClaimDashboard {

  totalIssues: number;

  raisedIssues: number;

  inProgressIssues: number;

  reviewIssues: number;

  closedIssues: number;

  todayIssues: number;

  myRaisedIssues: number;

  myAssignedIssues: number;

  recentIssues: DashboardClaim[];
}


export interface DashboardClaim {

  id: number;

  title: string;

  status: string;

  raisedByName: string;

  assignedEmployeeName?: string;

  organizationName: string;

  createdAt: string;

  updatedAt: string;
}