export type TimeSlot = "08:00 - 13:00" | "14:00 - 17:00" | "08:00 - 17:00";
export type BookingStatus = "Confirmed" | "Pending Approval" | "Cancelled";

export interface Booking {
  id: string;
  date: string;
  isoDate: string;
  timeSlot: TimeSlot;
  assignedTask: string;
  status: BookingStatus;
  autoAssigned: boolean;
}