export interface Location {
  lat: number;
  lng: number;
  name: string;
  address?: string; // Added address field
}

export interface FlightDetails {
  departureTime: string;
  departureAirport: string;
  arrivalTime: string;
  arrivalAirport: string;
  flightNumber: string;
  duration: string;
  airline?: string;
}

export interface HotelDetails {
  name: string;
  price: string;
  currency: string;
  availability: number;
  rating: string;
  address: string;
  bookingUrl: string;
  tag?: string; // e.g. "最高人氣", "高CP值", "奢華享受"
}

export interface Activity {
  id: string; // Unique ID for drag/drop or swapping
  time: string; // Start Time string "09:00" or "09:00 AM"
  durationMinutes: number; // Estimated duration in minutes
  description: string;
  location: Location;
  type: 'food' | 'sight' | 'transport' | 'other' | 'flight';
  icon?: string;
  flightDetails?: FlightDetails;
  alternatives?: Activity[]; // List of alternative options for this slot
}

export interface WeatherInfo {
  condition: string; // e.g. "Sunny", "Cloudy", "Rain"
  minTemp: number;
  maxTemp: number;
  icon?: string; // Emoji or icon name
}

export interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
  accommodationOptions?: HotelDetails[];
  location?: string; // The city/area for this day (e.g., "Tokyo")
  weather?: WeatherInfo; // Cached weather info
}

export interface TripData {
  id: string; // UUID for local storage
  destination: string;
  startDate: string;
  endDate: string;
  currency?: string; // e.g. "JPY"
  exchangeRate?: number; // e.g. 0.215 (Foreign Currency to TWD)
  companions: string[]; // List of people splitting bills, default ['我']
  itinerary: DayPlan[];
  expenses: Expense[]; // Moved expenses inside TripData for easier persistence
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payer: string;
  date: string;
}

export enum TabView {
  ITINERARY = 'ITINERARY',
  EXPENSES = 'EXPENSES',
  TRANSLATE = 'TRANSLATE'
}