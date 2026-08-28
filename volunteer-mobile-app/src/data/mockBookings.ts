import { Booking } from "../types/booking";

export const mockBookings: Booking[] = [
  {
    id: "b1",
    date: "Thursday, 12 Oct",
    isoDate: "2026-10-12",
    timeSlot: "08:00 - 13:00",
    assignedTask: "Kelp Gull Handling",
    status: "Confirmed",
    autoAssigned: true,
  },
  {
    id: "b2",
    date: "Friday, 13 Oct",
    isoDate: "2026-10-13",
    timeSlot: "08:00 - 17:00",
    assignedTask: "Cleaning and Pen Routine",
    status: "Pending Approval",
    autoAssigned: true,
  },
  {
    id: "b3",
    date: "Saturday, 14 Oct",
    isoDate: "2026-10-14",
    timeSlot: "14:00 - 17:00",
    assignedTask: "African Penguin Feed",
    status: "Confirmed",
    autoAssigned: true,
  },
  {
    id: "b4",
    date: "Sunday, 15 Oct",
    isoDate: "2026-10-15",
    timeSlot: "08:00 - 13:00",
    assignedTask: "Home Pen",
    status: "Confirmed",
    autoAssigned: true,
  },
];