export type UserRole = "traveler" | "guide";
export type RequestStatus = "open" | "matched" | "completed" | "cancelled";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole | null;
  nationality: string | null;
  languages: string[];
  bio: string | null;
  contact: string | null;
};

export type GuideRequest = {
  id: string;
  traveler_id: string;
  title: string;
  description: string;
  area: string;
  travel_date: string;
  duration_hours: number;
  group_size: number;
  languages: string[];
  status: RequestStatus;
  matched_guide_id: string | null;
  created_at: string;
};

export type ChatRoom = {
  id: string;
  request_id: string;
  traveler_id: string;
  guide_id: string;
  created_at: string;
};

export type Message = {
  id: number;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export const LANGUAGE_OPTIONS = [
  "English",
  "Korean",
  "Japanese",
  "Chinese",
  "Spanish",
  "French",
  "German",
  "Vietnamese",
  "Thai",
  "Indonesian",
  "Russian",
  "Arabic",
] as const;
