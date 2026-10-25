export type UserRole = 'admin' | 'supervisor' | 'operator' | 'hr_manager';

export type DepartmentType = 
  | 'Assembly' 
  | 'Quality Control' 
  | 'Warehouse & Supply' 
  | 'Plant Maintenance' 
  | 'Corporate HR';

export type ShiftType = 
  | 'Morning (06:00-14:00)' 
  | 'General (09:00-18:00)' 
  | 'Night (22:00-06:00)';

export type EmployeeStatus = 'active' | 'on_leave' | 'inactive';

export type AttendanceType = 'check_in' | 'check_out' | 'break';

export type PunchMethod = 'manual' | 'biometric' | 'rfid_scan' | 'qr';

export type LeaveType = 'annual' | 'sick' | 'casual' | 'shift_swap';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type PayrollStatus = 'draft' | 'processing' | 'disbursed';

export interface BankDetails {
  id?: string;
  user_id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: UserRole;
  department: DepartmentType;
  shift: ShiftType;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  status: EmployeeStatus;
  created_at?: string;
  bank_details?: BankDetails;
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  type: AttendanceType;
  timestamp: string;
  method: PunchMethod;
  notes?: string;
  user_profile?: UserProfile;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: ApprovalStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
  user_profile?: UserProfile;
}

export interface PayrollRecord {
  id: string;
  user_id: string;
  payroll_month: string;
  base_salary: number;
  shift_allowances: number;
  deductions: number;
  net_payable?: number;
  status: PayrollStatus;
  payslip_url?: string;
  created_at?: string;
  user_profile?: UserProfile;
}

export interface PerformanceReview {
  id: string;
  user_id: string;
  reviewer_name: string;
  review_period: string;
  efficiency_rating: number; // e.g., 97
  safety_score: number;      // e.g., 100
  quality_accuracy: number;  // e.g., 99.4
  overall_score: number;     // e.g., 4.9
  grade: 'A+' | 'A' | 'B+' | 'B' | 'Needs Improvement';
  comments: string;
  goals: string[];
  reviewed_at: string;
  user_profile?: UserProfile;
}

export interface DashboardMetrics {
  totalEmployees: number;
  activeCount: number;
  onLeaveToday: number;
  pendingLeaveRequestsCount: number;
  checkedInToday: number;
  totalShiftCapacity: number;
  averageCheckInTime: string;
  pendingActionsTotal: number;
  pendingTimecards: number;
  pendingLeaves: number;
  pendingReimbursements: number;
  payrollMonth: string;
  payrollProgressPercent: number;
}
