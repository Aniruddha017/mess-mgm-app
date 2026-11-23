import * as SQLite from 'expo-sqlite';
import { MealSlot, MealBooking, BillItem, AbsenceRequest, UserProfile } from '../types';

let dbInstance: any = null;

export const getDB = () => {
  if (!dbInstance) {
    try {
      dbInstance = SQLite.openDatabaseSync('messmate.db');
    } catch (e) {
      console.warn('SQLite openDatabaseSync fallback:', e);
      // Fallback in-memory mock if on unsupported platform (e.g. web preview)
      dbInstance = {
        execSync: () => {},
        runSync: () => {},
        getAllSync: () => [],
        getFirstSync: () => null,
      };
    }
  }
  return dbInstance;
};

export const initSQLiteDatabase = () => {
  const db = getDB();
  try {
    // Enable WAL mode & foreign keys
    db.execSync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        dietary_pref TEXT NOT NULL,
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS meal_slots (
        id INTEGER PRIMARY KEY,
        date TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        menu TEXT NOT NULL,
        dietary_tags TEXT,
        price_paise INTEGER NOT NULL,
        cutoff_time TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS meal_bookings (
        id INTEGER PRIMARY KEY,
        slot_id INTEGER NOT NULL,
        student_id TEXT NOT NULL,
        status TEXT NOT NULL,
        manual_code TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS absence_requests (
        id INTEGER PRIMARY KEY,
        student_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        meals TEXT NOT NULL,
        reason TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS meal_checkins (
        booking_id INTEGER PRIMARY KEY,
        time TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        verification_method TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS meal_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checkin_id INTEGER UNIQUE NOT NULL,
        rating INTEGER NOT NULL,
        tags TEXT,
        comment TEXT,
        is_hygiene_flagged INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS bill_items (
        id INTEGER PRIMARY KEY,
        student_id TEXT NOT NULL,
        checkin_id INTEGER NOT NULL,
        price_paise INTEGER NOT NULL,
        period TEXT NOT NULL,
        created_at TEXT,
        meal_type TEXT,
        meal_date TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL
      );
    `);
    console.log('Local SQLite Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
  }
};

// --- Caching helpers for Offline-First / Instant loading ---

export const cacheSlots = (slots: MealSlot[]) => {
  const db = getDB();
  try {
    for (const s of slots) {
      db.runSync(
        `INSERT OR REPLACE INTO meal_slots (id, date, meal_type, menu, dietary_tags, price_paise, cutoff_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.date, s.meal_type, s.menu, s.dietary_tags, s.price_paise, s.cutoff_time]
      );
    }
  } catch (e) {
    console.error('Error caching slots:', e);
  }
};

export const getCachedSlots = (): MealSlot[] => {
  const db = getDB();
  try {
    return db.getAllSync(`SELECT * FROM meal_slots ORDER BY date DESC, meal_type ASC`);
  } catch (e) {
    console.error('Error fetching cached slots:', e);
    return [];
  }
};

export const cacheBookings = (bookings: MealBooking[]) => {
  const db = getDB();
  try {
    for (const b of bookings) {
      db.runSync(
        `INSERT OR REPLACE INTO meal_bookings (id, slot_id, student_id, status, manual_code, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [b.id, b.slot_id, b.student_id, b.status, b.manual_code, b.created_at || '']
      );
    }
  } catch (e) {
    console.error('Error caching bookings:', e);
  }
};

export const getCachedBookings = (studentId: string): MealBooking[] => {
  const db = getDB();
  try {
    return db.getAllSync(
      `SELECT * FROM meal_bookings WHERE student_id = ? ORDER BY id DESC`,
      [studentId]
    );
  } catch (e) {
    console.error('Error reading cached bookings:', e);
    return [];
  }
};

export const cacheBills = (bills: BillItem[]) => {
  const db = getDB();
  try {
    for (const bi of bills) {
      db.runSync(
        `INSERT OR REPLACE INTO bill_items (id, student_id, checkin_id, price_paise, period, created_at, meal_type, meal_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [bi.id, bi.student_id, bi.checkin_id, bi.price_paise, bi.period, bi.created_at || '', bi.meal_type || '', bi.meal_date || '']
      );
    }
  } catch (e) {
    console.error('Error caching bills:', e);
  }
};

export const getCachedBills = (studentId: string, period?: string): BillItem[] => {
  const db = getDB();
  try {
    if (period) {
      return db.getAllSync(
        `SELECT * FROM bill_items WHERE student_id = ? AND period = ? ORDER BY id DESC`,
        [studentId, period]
      );
    }
    return db.getAllSync(
      `SELECT * FROM bill_items WHERE student_id = ? ORDER BY id DESC`,
      [studentId]
    );
  } catch (e) {
    console.error('Error reading cached bills:', e);
    return [];
  }
};

export const cacheAbsences = (absences: AbsenceRequest[]) => {
  const db = getDB();
  try {
    for (const a of absences) {
      db.runSync(
        `INSERT OR REPLACE INTO absence_requests (id, student_id, start_date, end_date, meals, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [a.id || Date.now(), a.student_id || '', a.start_date, a.end_date, a.meals, a.reason, a.created_at || '']
      );
    }
  } catch (e) {
    console.error('Error caching absences:', e);
  }
};

export const getCachedAbsences = (studentId: string): AbsenceRequest[] => {
  const db = getDB();
  try {
    return db.getAllSync(
      `SELECT * FROM absence_requests WHERE student_id = ? ORDER BY id DESC`,
      [studentId]
    );
  } catch (e) {
    console.error('Error reading cached absences:', e);
    return [];
  }
};

export const logLocalAudit = (action: string, details: string) => {
  const db = getDB();
  try {
    db.runSync(
      `INSERT INTO audit_events (action, details, timestamp) VALUES (?, ?, ?)`,
      [action, details, new Date().toISOString()]
    );
  } catch (e) {
    console.error('Error logging local audit:', e);
  }
};

