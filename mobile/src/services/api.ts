import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../constants/config';
import {
  UserProfile,
  MealSlot,
  MealBooking,
  QRTokenPayload,
  MealCheckin,
  AbsenceRequest,
  MealFeedback,
  MonthlyBillSummary,
  DemandSummaryItem,
  AuditEvent,
} from '../types';
import {
  cacheSlots,
  cacheBookings,
  cacheBills,
  cacheAbsences,
  getCachedSlots,
  getCachedBookings,
  getCachedBills,
  getCachedAbsences,
} from '../database/sqlite';

let inMemoryToken: string | null = null;
let customBaseUrl: string | null = null;

export const setCustomBaseUrl = (url: string | null) => {
  customBaseUrl = url;
};

export const getEffectiveBaseUrl = () => {
  return customBaseUrl || CONFIG.API_BASE_URL;
};

export const setAuthToken = async (token: string | null) => {
  inMemoryToken = token;
  try {
    if (token) {
      await SecureStore.setItemAsync('messmate_token', token);
    } else {
      await SecureStore.deleteItemAsync('messmate_token');
    }
  } catch (e) {
    console.warn('SecureStore unavailable, using memory token', e);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  if (inMemoryToken) return inMemoryToken;
  try {
    const stored = await SecureStore.getItemAsync('messmate_token');
    if (stored) inMemoryToken = stored;
    return stored;
  } catch (e) {
    return inMemoryToken;
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${getEffectiveBaseUrl()}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || `Request failed (${res.status})`);
    }
    return data as T;
  } catch (error: any) {
    console.warn(`API call error for ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // --- Auth ---
  login: async (email: string, password: string) => {
    const res = await request<{ access_token: string; token_type: string; user: UserProfile }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    await setAuthToken(res.access_token);
    return res;
  },

  register: async (userData: { name: string; email: string; password: string; role: string; dietary_pref: string }) => {
    const res = await request<{ access_token: string; token_type: string; user: UserProfile }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
    await setAuthToken(res.access_token);
    return res;
  },

  getMe: async (): Promise<UserProfile> => {
    return request<UserProfile>('/auth/me');
  },

  // --- Meal Slots ---
  getSlots: async (date?: string): Promise<MealSlot[]> => {
    try {
      const q = date ? `?date=${date}` : '';
      const slots = await request<MealSlot[]>(`/slots${q}`);
      // Cache fresh slots in SQLite
      cacheSlots(slots);
      return slots;
    } catch (e) {
      // Offline fallback: return cached slots from SQLite
      console.log('Using cached slots from SQLite');
      return getCachedSlots();
    }
  },

  createSlot: async (slotData: Partial<MealSlot>): Promise<MealSlot> => {
    return request<MealSlot>('/slots', {
      method: 'POST',
      body: JSON.stringify(slotData),
    });
  },

  updateSlot: async (slotId: number, slotData: Partial<MealSlot>): Promise<MealSlot> => {
    return request<MealSlot>(`/slots/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify(slotData),
    });
  },

  // --- Bookings ---
  createBooking: async (slot_id: number): Promise<MealBooking> => {
    return request<MealBooking>('/bookings', {
      method: 'POST',
      body: JSON.stringify({ slot_id }),
    });
  },

  cancelBooking: async (booking_id: number): Promise<{ message: string; booking_id: number }> => {
    return request<{ message: string; booking_id: number }>(`/bookings/${booking_id}/cancel`, {
      method: 'POST',
    });
  },

  getMyBookings: async (studentId?: string): Promise<MealBooking[]> => {
    try {
      const bookings = await request<MealBooking[]>('/bookings/my');
      cacheBookings(bookings);
      return bookings;
    } catch (e) {
      if (studentId) return getCachedBookings(studentId);
      return [];
    }
  },

  getQRToken: async (booking_id: number): Promise<QRTokenPayload> => {
    return request<QRTokenPayload>(`/bookings/${booking_id}/qr-token`);
  },

  // --- Counter Check-in ---
  verifyCheckin: async (params: { token?: string; manual_code?: string }): Promise<MealCheckin> => {
    return request<MealCheckin>('/checkins/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // --- Absence Management ---
  declareAbsence: async (data: AbsenceRequest): Promise<AbsenceRequest> => {
    return request<AbsenceRequest>('/absences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyAbsences: async (studentId?: string): Promise<AbsenceRequest[]> => {
    try {
      const absences = await request<AbsenceRequest[]>('/absences/my');
      cacheAbsences(absences);
      return absences;
    } catch (e) {
      if (studentId) return getCachedAbsences(studentId);
      return [];
    }
  },

  getAllAbsences: async (): Promise<AbsenceRequest[]> => {
    return request<AbsenceRequest[]>('/absences/all');
  },

  // --- Feedback ---
  submitFeedback: async (feedback: MealFeedback): Promise<MealFeedback> => {
    return request<MealFeedback>('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  },

  getFeedbackSummary: async () => {
    return request<{
      average_rating: number;
      total_reviews: number;
      tag_breakdown: Record<string, number>;
      recent_reviews: any[];
    }>('/feedback/summary');
  },

  getHygieneAlerts: async (): Promise<MealFeedback[]> => {
    return request<MealFeedback[]>('/feedback/hygiene-alerts');
  },

  // --- Billing ---
  getMyBill: async (period?: string, studentId?: string): Promise<MonthlyBillSummary> => {
    try {
      const q = period ? `?period=${period}` : '';
      const bill = await request<MonthlyBillSummary>(`/billing/my${q}`);
      cacheBills(bill.items);
      return bill;
    } catch (e) {
      // Offline fallback: calculate summary from SQLite cached bill_items
      if (studentId) {
        const cachedItems = getCachedBills(studentId, period);
        const totalPaise = cachedItems.reduce((sum, item) => sum + item.price_paise, 0);
        return {
          student_id: studentId,
          period: period || new Date().toISOString().slice(0, 7),
          total_meals: cachedItems.length,
          total_amount_paise: totalPaise,
          total_amount_rupees: Math.round(totalPaise / 100),
          items: cachedItems,
        };
      }
      throw e;
    }
  },

  // --- Admin Reports & Approvals ---
  getUsers: async (role?: string, status?: string): Promise<UserProfile[]> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status_filter', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return request<UserProfile[]>(`/admin/users${q}`);
  },

  updateUserStatus: async (user_id: string, new_status: string) => {
    return request(`/admin/users/${user_id}/status?new_status=${new_status}`, {
      method: 'POST',
    });
  },

  getAuditLogs: async (limit: number = 50): Promise<AuditEvent[]> => {
    return request<AuditEvent[]>(`/admin/audit-logs?limit=${limit}`);
  },

  getDemandReport: async (date?: string): Promise<{ date: string; demand_summary: DemandSummaryItem[] }> => {
    const q = date ? `?date=${date}` : '';
    return request<{ date: string; demand_summary: DemandSummaryItem[] }>(`/admin/reports/demand${q}`);
  },

  getFinancialReport: async (period?: string) => {
    const q = period ? `?period=${period}` : '';
    return request<{ period: string; total_meals_served: number; total_revenue_paise: number; total_revenue_rupees: number }>(
      `/admin/reports/financial${q}`
    );
  },

  // --- Mobile SQLite Full Sync Bootstrap ---
  syncBootstrap: async (): Promise<boolean> => {
    try {
      const data = await request<any>('/sync/bootstrap');
      if (data.meal_slots) cacheSlots(data.meal_slots);
      if (data.bookings) cacheBookings(data.bookings);
      if (data.absences) cacheAbsences(data.absences);
      if (data.bills) cacheBills(data.bills);
      console.log('Mobile SQLite database successfully synchronized with cloud backend!');
      return true;
    } catch (e) {
      console.warn('Sync bootstrap failed:', e);
      return false;
    }
  },
};

