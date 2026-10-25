import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import {
  UserProfile,
  BankDetails,
  AttendanceLog,
  LeaveRequest,
  PayrollRecord,
  PerformanceReview,
  DashboardMetrics,
  UserRole
} from '../models/workforce.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabaseClient!: SupabaseClient;
  private realtimeChannel: RealtimeChannel | null = null;

  // Supabase connection state
  readonly isLiveConnected = signal<boolean>(false);
  readonly connectionStatusText = signal<string>('Initializing...');

  // Signals for state management
  readonly currentUser = signal<UserProfile | null>({
    id: '00000000-0000-0000-0000-000000000001',
    employee_id: 'AOP-1001',
    first_name: 'Admin',
    last_name: 'User',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'hr_manager',
    department: 'Corporate HR',
    shift: 'General (09:00-18:00)',
    phone: '+1 (555) 019-2834',
    address: 'Apex HQ, Suite 400',
    emergency_contact: 'Jane User (+1 555-019-2835)',
    status: 'active',
    bank_details: {
      user_id: '00000000-0000-0000-0000-000000000001',
      account_name: 'Admin User',
      account_number: '984511200341',
      bank_name: 'JPMorgan Chase Corp',
      ifsc_code: 'CHASUS33XXX'
    }
  });

  readonly workforce = signal<UserProfile[]>([
    {
      id: '00000000-0000-0000-0000-000000000001',
      employee_id: 'AOP-1001',
      first_name: 'Admin',
      last_name: 'User',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'hr_manager',
      department: 'Corporate HR',
      shift: 'General (09:00-18:00)',
      phone: '+1 (555) 019-2834',
      address: 'Apex HQ, Suite 400',
      emergency_contact: 'Jane User (+1 555-019-2835)',
      status: 'active',
      bank_details: {
        user_id: '00000000-0000-0000-0000-000000000001',
        account_name: 'Admin User',
        account_number: '984511200341',
        bank_name: 'JPMorgan Chase Corp',
        ifsc_code: 'CHASUS33XXX'
      }
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      employee_id: 'AOP-1028',
      first_name: 'Annen',
      last_name: 'Smith',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'operator',
      department: 'Assembly',
      shift: 'Morning (06:00-14:00)',
      phone: '+1 (555) 012-4411',
      address: 'Sector 4, Building B, Plant Zone',
      emergency_contact: 'David Smith (+1 555-012-4412)',
      status: 'active',
      bank_details: {
        user_id: '00000000-0000-0000-0000-000000000002',
        account_name: 'Annen Smith',
        account_number: '441098231049',
        bank_name: 'Bank of America Industrial',
        ifsc_code: 'BOFAUS3NXXX'
      }
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      employee_id: 'AOP-1026',
      first_name: 'Alexa',
      last_name: 'Smom',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: 'supervisor',
      department: 'Quality Control',
      shift: 'General (09:00-18:00)',
      phone: '+1 (555) 013-8822',
      address: 'Apex Plant Zone 1, QC Unit',
      emergency_contact: 'Mary Smom (+1 555-013-8823)',
      status: 'active',
      bank_details: {
        user_id: '00000000-0000-0000-0000-000000000003',
        account_name: 'Alexa Smom',
        account_number: '881029471920',
        bank_name: 'Wells Fargo Commercial',
        ifsc_code: 'WFBIUS6SXXX'
      }
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      employee_id: 'AOP-1035',
      first_name: 'Niexa',
      last_name: 'Snana',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      role: 'operator',
      department: 'Warehouse & Supply',
      shift: 'Night (22:00-06:00)',
      phone: '+1 (555) 014-9933',
      address: 'Distribution Hub East, Gate 5',
      emergency_contact: 'Sarah Snana (+1 555-014-9934)',
      status: 'on_leave',
      bank_details: {
        user_id: '00000000-0000-0000-0000-000000000004',
        account_name: 'Niexa Snana',
        account_number: '672109482910',
        bank_name: 'Citibank Manufacturing',
        ifsc_code: 'CITIUS33XXX'
      }
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      employee_id: 'AOP-1042',
      first_name: 'Admin',
      last_name: 'Smith',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      role: 'admin',
      department: 'Plant Maintenance',
      shift: 'General (09:00-18:00)',
      phone: '+1 (555) 018-7711',
      address: 'Machinery Block C, Suite 12',
      emergency_contact: 'Elena Vance (+1 555-018-7712)',
      status: 'active',
      bank_details: {
        user_id: '00000000-0000-0000-0000-000000000005',
        account_name: 'Admin Smith',
        account_number: '334190821045',
        bank_name: 'Barclays Corporate',
        ifsc_code: 'BARCUS22XXX'
      }
    }
  ]);

  readonly attendanceLogs = signal<AttendanceLog[]>([
    {
      id: 'log-001',
      user_id: '00000000-0000-0000-0000-000000000002',
      type: 'check_in',
      timestamp: '13 J028, 09:49 AM',
      method: 'rfid_scan',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000002',
        employee_id: 'AOP-1028',
        first_name: 'Annen',
        last_name: 'Smith',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'operator',
        department: 'Assembly',
        shift: 'Morning (06:00-14:00)',
        status: 'active'
      }
    },
    {
      id: 'log-002',
      user_id: '00000000-0000-0000-0000-000000000003',
      type: 'check_in',
      timestamp: '13 J026, 09:40 AM',
      method: 'biometric',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000003',
        employee_id: 'AOP-1026',
        first_name: 'Alexa',
        last_name: 'Smom',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'supervisor',
        department: 'Quality Control',
        shift: 'General (09:00-18:00)',
        status: 'active'
      }
    },
    {
      id: 'log-003',
      user_id: '00000000-0000-0000-0000-000000000005',
      type: 'check_out',
      timestamp: '13 J026, 09:30 AM',
      method: 'rfid_scan',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000005',
        employee_id: 'AOP-1042',
        first_name: 'Admin',
        last_name: 'Smith',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        role: 'admin',
        department: 'Plant Maintenance',
        shift: 'General (09:00-18:00)',
        status: 'active'
      }
    },
    {
      id: 'log-004',
      user_id: '00000000-0000-0000-0000-000000000002',
      type: 'check_out',
      timestamp: '13 J026, 09:08 AM',
      method: 'manual',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000002',
        employee_id: 'AOP-1028',
        first_name: 'Annen',
        last_name: 'Smith',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'operator',
        department: 'Assembly',
        shift: 'Morning (06:00-14:00)',
        status: 'active'
      }
    }
  ]);

  readonly leaveRequests = signal<LeaveRequest[]>([
    {
      id: 'leave-001',
      user_id: '00000000-0000-0000-0000-000000000005',
      leave_type: 'annual',
      start_date: '2026-06-27',
      end_date: '2026-07-03',
      reason: 'Scheduled annual family leave and personal travel',
      status: 'pending',
      created_at: '2026-06-20T10:00:00Z',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000005',
        employee_id: 'AOP-1042',
        first_name: 'Admin',
        last_name: 'Smith',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        role: 'admin',
        department: 'Plant Maintenance',
        shift: 'General (09:00-18:00)',
        status: 'active'
      }
    },
    {
      id: 'leave-002',
      user_id: '00000000-0000-0000-0000-000000000004',
      leave_type: 'sick',
      start_date: '2026-09-29',
      end_date: '2026-10-02',
      reason: 'Medical recovery under physician care',
      status: 'pending',
      created_at: '2026-09-28T08:30:00Z',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000004',
        employee_id: 'AOP-1035',
        first_name: 'Niexa',
        last_name: 'Snana',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        role: 'operator',
        department: 'Warehouse & Supply',
        shift: 'Night (22:00-06:00)',
        status: 'on_leave'
      }
    },
    {
      id: 'leave-003',
      user_id: '00000000-0000-0000-0000-000000000005',
      leave_type: 'annual',
      start_date: '2026-12-21',
      end_date: '2026-12-28',
      reason: 'Winter holiday leave with family',
      status: 'pending',
      created_at: '2026-10-15T11:15:00Z',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000005',
        employee_id: 'AOP-1042',
        first_name: 'Admin',
        last_name: 'Smith',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        role: 'admin',
        department: 'Plant Maintenance',
        shift: 'General (09:00-18:00)',
        status: 'active'
      }
    }
  ]);

  readonly payrollRecords = signal<PayrollRecord[]>([
    {
      id: 'pay-001',
      user_id: '00000000-0000-0000-0000-000000000001',
      payroll_month: 'October 2026',
      base_salary: 8200.0,
      shift_allowances: 450.0,
      deductions: 850.0,
      net_payable: 7800.0,
      status: 'processing',
      payslip_url: '#',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000001',
        employee_id: 'AOP-1001',
        first_name: 'Admin',
        last_name: 'User',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: 'hr_manager',
        department: 'Corporate HR',
        shift: 'General (09:00-18:00)',
        status: 'active'
      }
    },
    {
      id: 'pay-002',
      user_id: '00000000-0000-0000-0000-000000000002',
      payroll_month: 'October 2026',
      base_salary: 4500.0,
      shift_allowances: 600.0,
      deductions: 320.0,
      net_payable: 4780.0,
      status: 'processing',
      payslip_url: '#',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000002',
        employee_id: 'AOP-1028',
        first_name: 'Annen',
        last_name: 'Smith',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'operator',
        department: 'Assembly',
        shift: 'Morning (06:00-14:00)',
        status: 'active'
      }
    },
    {
      id: 'pay-003',
      user_id: '00000000-0000-0000-0000-000000000003',
      payroll_month: 'October 2026',
      base_salary: 5800.0,
      shift_allowances: 500.0,
      deductions: 480.0,
      net_payable: 5820.0,
      status: 'processing',
      payslip_url: '#',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000003',
        employee_id: 'AOP-1026',
        first_name: 'Alexa',
        last_name: 'Smom',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'supervisor',
        department: 'Quality Control',
        shift: 'General (09:00-18:00)',
        status: 'active'
      }
    }
  ]);

  readonly performanceReviews = signal<PerformanceReview[]>([
    {
      id: 'rev-001',
      user_id: '00000000-0000-0000-0000-000000000002',
      reviewer_name: 'Alexa Smom (QC Shift Lead)',
      review_period: 'Q3 2026',
      efficiency_rating: 98.4,
      safety_score: 100,
      quality_accuracy: 99.6,
      overall_score: 4.9,
      grade: 'A+',
      comments: 'Consistently surpasses line hourly output targets on Assembly Line 4 with flawless safety record. Recommended for senior trainer tier.',
      goals: ['Lead training on Robotic arm cell safety', 'Maintain 0% defect rate on chassis assemblies'],
      reviewed_at: '2026-10-10T14:30:00Z',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000002',
        employee_id: 'AOP-1028',
        first_name: 'Annen',
        last_name: 'Smith',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'operator',
        department: 'Assembly',
        shift: 'Morning (06:00-14:00)',
        status: 'active'
      }
    },
    {
      id: 'rev-002',
      user_id: '00000000-0000-0000-0000-000000000003',
      reviewer_name: 'Admin User (HR Manager)',
      review_period: 'Q3 2026',
      efficiency_rating: 96.8,
      safety_score: 98.5,
      quality_accuracy: 99.2,
      overall_score: 4.8,
      grade: 'A',
      comments: 'Excellent quality inspection oversight across Plant Zone 1. Successfully reduced line stoppage re-inspections by 18%.',
      goals: ['Automate optical camera calibration', 'Optimize shift handover reports'],
      reviewed_at: '2026-10-12T09:15:00Z',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000003',
        employee_id: 'AOP-1026',
        first_name: 'Alexa',
        last_name: 'Smom',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'supervisor',
        department: 'Quality Control',
        shift: 'General (09:00-18:00)',
        status: 'active'
      }
    },
    {
      id: 'rev-003',
      user_id: '00000000-0000-0000-0000-000000000004',
      reviewer_name: 'Admin Smith (Plant Maintenance Lead)',
      review_period: 'Q3 2026',
      efficiency_rating: 94.2,
      safety_score: 99.0,
      quality_accuracy: 98.0,
      overall_score: 4.6,
      grade: 'B+',
      comments: 'Solid night shift material handling in Warehouse. Good pallet turnaround metrics and zero freight damage logged.',
      goals: ['Increase automated forklift utilization', 'Complete hazardous materials handling certification'],
      reviewed_at: '2026-10-18T16:00:00Z',
      user_profile: {
        id: '00000000-0000-0000-0000-000000000004',
        employee_id: 'AOP-1035',
        first_name: 'Niexa',
        last_name: 'Snana',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        role: 'operator',
        department: 'Warehouse & Supply',
        shift: 'Night (22:00-06:00)',
        status: 'on_leave'
      }
    }
  ]);

  // Operational Dashboard Metrics Signal (Matches UI mockup numbers exactly)
  readonly metrics = signal<DashboardMetrics>({
    totalEmployees: 142,
    activeCount: 142,
    onLeaveToday: 8,
    pendingLeaveRequestsCount: 3,
    checkedInToday: 118,
    totalShiftCapacity: 135,
    averageCheckInTime: '09:08 AM',
    pendingActionsTotal: 14,
    pendingTimecards: 7,
    pendingLeaves: 4,
    pendingReimbursements: 3,
    payrollMonth: 'Oct 2026 Payroll',
    payrollProgressPercent: 75
  });

  constructor(private toast: ToastService) {
    this.initializeSupabase();
  }

  /**
   * Initializes the official Supabase Client with environment variables.
   * Tests connection and falls back to reactive simulated mode if offline.
   */
  private async initializeSupabase() {
    try {
      const url = localStorage.getItem('apex_supabase_url') || environment.supabaseUrl;
      const key = localStorage.getItem('apex_supabase_key') || environment.supabaseKey;

      if (!url || !key || url.includes('xyzcompany')) {
        this.connectionStatusText.set('Mock Standalone Engine (Plug-and-play)');
        this.isLiveConnected.set(false);
        this.setupRealtimeSimulation();
        return;
      }

      this.supabaseClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });

      // Quick test query to check DB availability
      const { data, error } = await this.supabaseClient.from('profiles').select('count', { count: 'exact', head: true });

      if (error) {
        console.warn('Supabase DB connection check returned:', error.message);
        this.connectionStatusText.set('Offline / Demo Engine (Fallback)');
        this.isLiveConnected.set(false);
        this.setupRealtimeSimulation();
      } else {
        this.isLiveConnected.set(true);
        this.connectionStatusText.set('Supabase Cloud Connected (PostgreSQL)');
        this.subscribeToLiveRealtime();
        this.fetchRemoteData();
      }
    } catch (err) {
      console.warn('Could not initialize live Supabase client, using interactive offline mode:', err);
      this.isLiveConnected.set(false);
      this.connectionStatusText.set('Local Interactive Mode');
      this.setupRealtimeSimulation();
    }
  }

  /**
   * Supabase Client accessor
   */
  get client(): SupabaseClient {
    return this.supabaseClient;
  }

  /**
   * Authentication Helpers
   */
  async signIn(email: string, pass: string): Promise<{ success: boolean; error?: string }> {
    if (this.isLiveConnected() && this.supabaseClient) {
      const { data, error } = await this.supabaseClient.auth.signInWithPassword({
        email,
        password: pass
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } else {
      // Demo authentication
      this.toast.success('Signed In Successfully', `Welcome back, ${email}`);
      return { success: true };
    }
  }

  async signOut(): Promise<void> {
    if (this.isLiveConnected() && this.supabaseClient) {
      await this.supabaseClient.auth.signOut();
    }
    this.currentUser.set(null);
    this.toast.info('Signed Out', 'You have been safely signed out.');
  }

  /**
   * Helper to switch user role for demo & testing RBAC
   */
  switchUserRole(role: UserRole) {
    const current = this.currentUser();
    if (current) {
      this.currentUser.set({
        ...current,
        role,
        first_name: role === 'admin' ? 'Admin' : role === 'hr_manager' ? 'HR Manager' : 'Operator',
        last_name: 'User'
      });
      this.toast.info('Role Switched', `Portal view updated for role: [${role.toUpperCase()}]`);
    }
  }

  /**
   * Sets up Supabase Realtime Postgres Changes Subscription
   */
  private subscribeToLiveRealtime() {
    if (!this.supabaseClient) return;

    this.realtimeChannel = this.supabaseClient
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_logs' },
        (payload) => {
          this.handleIncomingAttendanceInsert(payload.new as AttendanceLog);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leave_requests' },
        (payload) => {
          this.handleIncomingLeaveUpdate(payload.new as LeaveRequest);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('Supabase Realtime subscription active for attendance_logs.');
        }
      });
  }

  /**
   * Handles incoming Realtime attendance INSERT event
   */
  private handleIncomingAttendanceInsert(newLog: AttendanceLog) {
    // Find profile
    const profile = this.workforce().find(w => w.id === newLog.user_id) || {
      id: newLog.user_id,
      employee_id: 'AOP-LIVE',
      first_name: 'Plant',
      last_name: 'Operator',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'operator' as UserRole,
      department: 'Assembly' as const,
      shift: 'Morning (06:00-14:00)' as const,
      status: 'active' as const
    };

    const hydratedLog: AttendanceLog = {
      ...newLog,
      user_profile: profile
    };

    // Prepend to attendance logs
    this.attendanceLogs.update(logs => [hydratedLog, ...logs.slice(0, 19)]);

    // Update metrics optimistically
    if (newLog.type === 'check_in') {
      this.metrics.update(m => ({ ...m, checkedInToday: m.checkedInToday + 1 }));
    }

    this.toast.info(
      'Realtime Punch Recorded',
      `${profile.first_name} ${profile.last_name} [${newLog.type.replace('_', ' ').toUpperCase()}] via ${newLog.method}`
    );
  }

  private handleIncomingLeaveUpdate(updatedLeave: LeaveRequest) {
    this.leaveRequests.update(leaves =>
      leaves.map(l => l.id === updatedLeave.id ? { ...l, status: updatedLeave.status } : l)
    );
  }

  /**
   * Fallback Realtime simulation (can also be triggered on demand via the UI)
   */
  private setupRealtimeSimulation() {
    // In demo mode, provide realistic periodic pulses if desired
    console.info('Initialized Apex OpsPulse reactive state store.');
  }

  /**
   * Fetch Remote Data from Supabase if connected
   */
  private async fetchRemoteData() {
    if (!this.supabaseClient) return;

    try {
      // Fetch profiles
      const { data: profiles } = await this.supabaseClient.from('profiles').select('*').limit(50);
      if (profiles && profiles.length > 0) {
        this.workforce.set(profiles as UserProfile[]);
      }

      // Fetch attendance
      const { data: logs } = await this.supabaseClient
        .from('attendance_logs')
        .select('*, user_profile:profiles(*)')
        .order('timestamp', { ascending: false })
        .limit(20);
      if (logs && logs.length > 0) {
        this.attendanceLogs.set(logs as AttendanceLog[]);
      }

      // Fetch leaves
      const { data: leaves } = await this.supabaseClient
        .from('leave_requests')
        .select('*, user_profile:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (leaves && leaves.length > 0) {
        this.leaveRequests.set(leaves as LeaveRequest[]);
      }
    } catch (e) {
      console.warn('Error fetching Supabase data:', e);
    }
  }

  /**
   * Optimistic Leave Request Approval / Rejection
   */
  async updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    const previous = this.leaveRequests();
    const target = previous.find(l => l.id === leaveId);
    if (!target) return false;

    // Optimistic UI Update
    this.leaveRequests.update(leaves =>
      leaves.map(l => (l.id === leaveId ? { ...l, status } : l))
    );

    // Update pending action count
    this.metrics.update(m => ({
      ...m,
      pendingLeaveRequestsCount: Math.max(0, m.pendingLeaveRequestsCount - 1),
      pendingActionsTotal: Math.max(0, m.pendingActionsTotal - 1),
      pendingLeaves: Math.max(0, m.pendingLeaves - 1),
      onLeaveToday: status === 'approved' ? m.onLeaveToday + 1 : m.onLeaveToday
    }));

    this.toast.success(
      `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `Request for ${target.user_profile?.first_name || 'Employee'} marked as ${status.toUpperCase()}.`
    );

    // If connected to live Supabase, persist to database
    if (this.isLiveConnected() && this.supabaseClient) {
      try {
        const { error } = await this.supabaseClient
          .from('leave_requests')
          .update({
            status,
            reviewed_by: this.currentUser()?.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', leaveId);

        if (error) {
          console.error('Supabase leave update error:', error);
          this.toast.error('Database Sync Error', error.message);
          // Rollback
          this.leaveRequests.set(previous);
          return false;
        }
      } catch (err: any) {
        this.toast.error('Sync Error', err.message);
        this.leaveRequests.set(previous);
        return false;
      }
    }

    return true;
  }

  /**
   * Submit a new attendance punch (Check-in, Check-out, Break)
   */
  async addAttendancePunch(params: {
    userId?: string;
    type: 'check_in' | 'check_out' | 'break';
    method?: 'manual' | 'biometric' | 'rfid_scan' | 'qr';
    notes?: string;
  }): Promise<AttendanceLog> {
    const user = this.currentUser();
    const userId = params.userId || user?.id || '00000000-0000-0000-0000-000000000002';
    const profile = this.workforce().find(w => w.id === userId) || user || {
      id: userId,
      employee_id: 'AOP-1028',
      first_name: 'Annen',
      last_name: 'Smith',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'operator' as UserRole,
      department: 'Assembly' as const,
      shift: 'Morning (06:00-14:00)' as const,
      status: 'active' as const
    };

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' }).toUpperCase()}`;
    const displayTimestamp = `${dateFormatted}, ${timeFormatted}`;

    const newLog: AttendanceLog = {
      id: `log-${Date.now()}`,
      user_id: userId,
      type: params.type,
      timestamp: displayTimestamp,
      method: params.method || 'rfid_scan',
      notes: params.notes,
      user_profile: profile
    };

    // Optimistically update attendance logs
    this.attendanceLogs.update(logs => [newLog, ...logs]);

    // Update Checked In count
    if (params.type === 'check_in') {
      this.metrics.update(m => ({ ...m, checkedInToday: m.checkedInToday + 1 }));
    } else if (params.type === 'check_out') {
      this.metrics.update(m => ({ ...m, checkedInToday: Math.max(0, m.checkedInToday - 1) }));
    }

    this.toast.success(
      `Punch Recorded: ${params.type.replace('_', ' ').toUpperCase()}`,
      `${profile.first_name} ${profile.last_name} at ${timeFormatted} (${newLog.method})`
    );

    // If connected to Supabase
    if (this.isLiveConnected() && this.supabaseClient) {
      try {
        await this.supabaseClient.from('attendance_logs').insert({
          user_id: userId,
          type: params.type,
          method: newLog.method,
          notes: params.notes
        });
      } catch (err) {
        console.warn('Supabase attendance log error:', err);
      }
    }

    return newLog;
  }

  /**
   * Onboard New Employee (Reactive Form submission)
   */
  async createEmployee(
    profileData: Omit<UserProfile, 'id'>,
    bankData?: Partial<BankDetails>
  ): Promise<UserProfile> {
    const id = `usr-${Date.now()}`;
    const newProfile: UserProfile = {
      ...profileData,
      id,
      created_at: new Date().toISOString(),
      bank_details: bankData ? {
        id: `bnk-${Date.now()}`,
        user_id: id,
        account_name: bankData.account_name || `${profileData.first_name} ${profileData.last_name}`,
        account_number: bankData.account_number || '',
        bank_name: bankData.bank_name || 'Apex Corporate Partner Bank',
        ifsc_code: bankData.ifsc_code || 'APEX0092B',
        updated_at: new Date().toISOString()
      } : undefined
    };

    this.workforce.update(list => [newProfile, ...list]);
    this.metrics.update(m => ({
      ...m,
      totalEmployees: m.totalEmployees + 1,
      activeCount: m.activeCount + 1
    }));

    this.toast.success(
      'Employee Onboarded',
      `${newProfile.first_name} ${newProfile.last_name} (${newProfile.employee_id}) added to ${newProfile.department}`
    );

    if (this.isLiveConnected() && this.supabaseClient) {
      try {
        await this.supabaseClient.from('profiles').insert({
          id,
          employee_id: newProfile.employee_id,
          first_name: newProfile.first_name,
          last_name: newProfile.last_name,
          avatar_url: newProfile.avatar_url,
          role: newProfile.role,
          department: newProfile.department,
          shift: newProfile.shift,
          phone: newProfile.phone,
          address: newProfile.address,
          emergency_contact: newProfile.emergency_contact,
          status: newProfile.status
        });

        if (bankData && bankData.account_number) {
          await this.supabaseClient.from('bank_details').insert({
            user_id: id,
            account_name: bankData.account_name || `${newProfile.first_name} ${newProfile.last_name}`,
            account_number: bankData.account_number,
            bank_name: bankData.bank_name || 'Corporate Payroll Bank',
            ifsc_code: bankData.ifsc_code || 'APEX001'
          });
        }
      } catch (err: any) {
        console.error('Error saving employee to Supabase:', err);
        this.toast.error('Supabase Persistence Error', err.message);
      }
    }

    return newProfile;
  }

  /**
   * Quick Admin Action: Process Payroll
   */
  processPayrollRun(): void {
    this.metrics.update(m => ({
      ...m,
      payrollProgressPercent: Math.min(100, m.payrollProgressPercent + 15)
    }));

    const currentPercent = this.metrics().payrollProgressPercent;
    if (currentPercent >= 100) {
      this.toast.success('Payroll Disbursed', 'October 2026 payroll run 100% completed & distributed to corporate clearing accounts.');
    } else {
      this.toast.info('Payroll Processing', `Batch calculated. Progress advanced to ${currentPercent}%.`);
    }
  }

  /**
   * Quick Admin Action: Broadcast Announcement
   */
  broadcastAnnouncement(title: string, message: string) {
    this.toast.warning(`📢 Plant Broadcast: ${title}`, message);
  }

  /**
   * Save Custom Supabase Credentials from Settings UI
   */
  updateSupabaseCredentials(url: string, key: string) {
    localStorage.setItem('apex_supabase_url', url);
    localStorage.setItem('apex_supabase_key', key);
    this.toast.success('Credentials Saved', 'Reconnecting to Supabase instance...');
    this.initializeSupabase();
  }
}
