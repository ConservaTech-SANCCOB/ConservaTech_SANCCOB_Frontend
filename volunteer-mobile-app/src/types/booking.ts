export type TimeSlot = "Morning" | "Afternoon";
export type BookingStatus = "Assigned" | "Conflict";

export interface Booking {
  id: string;
  date: string;
  isoDate: string;
  timeSlot: TimeSlot;
  assignedTask: string;
  status: BookingStatus;
  autoAssigned: boolean;
}