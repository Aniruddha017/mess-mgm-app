export type UserRole = 'student' | 'mess_manager' | 'college_admin';

export type DietaryPreference = 'veg' | 'non_veg' | 'jain' | 'vegan';

export type UserStatus = 'active' | 'pending_approval' | 'suspended';

export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export type BookingStatus = 'booked' | 'cancelled' | 'collected' | 'no_show';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dietary_pref: DietaryPreference;
  status: UserStatus;
  created_at?: string;
}

export interface MealSlot {
  id: number;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  menu: string;
  dietary_tags: string;
  price_paise: number; // Stored in integer paise (e.g. 5000 = Rs 50.00)
  cutoff_time: string; // ISO string
  created_by?: string;
  created_at?: string;
  is_cutoff_passed?: boolean;
  booked_by_user?: boolean;
  booking_id?: number | null;
  booking_status?: BookingStatus | null;
}

export interface MealBooking {
  id: number;
  slot_id: number;
  student_id: string;
  status: BookingStatus;
  manual_code: string;
  created_at?: string;
  slot?: MealSlot;
}

export interface QRTokenPayload {
  token: string;
  booking_id: number;
  expiry: number;
  expires_in: number;
  manual_code: string;
}

export interface MealCheckin {
  booking_id: number;
  time: string;
  staff_id: string;
  verification_method: 'qr_scan' | 'manual_code';
  student_name: string;
  student_roll: string;
  meal_type: string;
  menu: string;
  price_paise: number;
  status: string;
}

export interface AbsenceRequest {
  id?: number;
  student_id?: string;
  start_date: string;
  end_date: string;
  meals: string; // "all" or "breakfast,lunch,dinner"
  reason: string;
  created_at?: string;
}

export interface MealFeedback {
  id?: number;
  checkin_id: number;
  rating: number; // 1 to 5
  tags: string;
  comment?: string;
  is_hygiene_flagged?: boolean;
  created_at?: string;
}

export interface BillItem {
  id: number;
  student_id: string;
  checkin_id: number;
  price_paise: number;
  period: string; // YYYY-MM
  created_at?: string;
  meal_type?: string;
  meal_date?: string;
}

export interface MonthlyBillSummary {
  student_id: string;
  period: string;
  total_meals: number;
  total_amount_paise: number;
  total_amount_rupees: number;
  items: BillItem[];
}

export interface DemandSummaryItem {
  slot_id: number;
  meal_type: string;
  menu: string;
  price_rupees: number;
  total_booked: number;
  absences_declared: number;
  cancelled_bookings: number;
  expected_headcount: number;
  actually_collected: number;
  no_shows: number;
}

export interface AuditEvent {
  id: number;
  actor_id: string;
  actor_name?: string;
  actor_role: string;
  action: string;
  old_value?: string;
  new_value?: string;
  details?: string;
  timestamp: string;
}

