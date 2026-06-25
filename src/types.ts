/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RoomMeta {
  type: string;
  category: string;
  capacity: number;
  amenities: string[];
}

export interface Floor {
  floor: number;
  rooms: string[];
  roomMeta: Record<string, RoomMeta>;
}

export interface Building {
  id: string;
  name: string;
  abbr: string;
  icon: string;
  colorClass: string;
  genderTag: string;
  nameClass: string;
  numClass: string;
  barClass: string;
  floors: Floor[];
}

export interface CheckInRecord {
  students: string[];
  studentIds: string[];
  courses: string[];
  years: string[];
  contacts: string[];
  parentCtcs: string[];
  signatures: string[]; // Base64 signature strings
  designations?: string[];
  amenities: Record<string, boolean>;
  checkinDates: string[];
  checkoutDates: string[];
  isReservedList: boolean[];
  laundryEligibleList?: boolean[];
  remarks: string;
  updatedAt: string;
  // Legacy fields (optional, but keeping for compatibility during transition if needed)
  checkinDate?: string;
  checkoutDate?: string;
  isReserved?: boolean;
}

export interface HistoricalRecord {
  id: string;
  buildingId: string;
  buildingName: string;
  roomNumber: string;
  studentName: string;
  studentId: string;
  course: string;
  year: string;
  designation?: string;
  contact: string;
  parentContact: string;
  checkinDate: string;
  checkoutDate: string;
  signature?: string;
  roomType?: string;
  remarks?: string;
  laundryEligible?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  isAdmin: boolean;
}

export type CheckInData = Record<string, CheckInRecord>; // Keyed by `${buildingId}_${roomNumber}`
