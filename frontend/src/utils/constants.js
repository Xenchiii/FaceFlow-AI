// Color constants for the application
export const COLORS = {
  primary: '#F5F7FA',
  secondary: '#7986C7',
  accent: '#F73F52',
  success: '#10b981',
  warning: '#FFEA85',
  error: '#ef4444',
  info: '#5B6FA8',
  dark: '#1f2937',
  light: '#f3f4f6',
  white: '#ffffff',
  black: '#000000',
  gray: {
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Initial events data
export const INITIAL_EVENTS = [
  {
    id: 1,
    name: 'Tech Conference 2026',
    date: '2026-02-15',
    time: '9:00 AM - 5:00 PM',
    venue: 'Main Convention Center',
    capacity: 500,
    registered: 342,
    description: 'Annual technology conference featuring latest innovations',
  },
  {
    id: 2,
    name: 'Workshop: AI & Machine Learning',
    date: '2026-02-20',
    time: '2:00 PM - 6:00 PM',
    venue: 'Training Room A',
    capacity: 100,
    registered: 78,
    description: 'Hands-on workshop covering AI fundamentals',
  },
  {
    id: 3,
    name: 'Networking Mixer',
    date: '2026-02-25',
    time: '6:00 PM - 9:00 PM',
    venue: 'Rooftop Lounge',
    capacity: 200,
    registered: 156,
    description: 'Professional networking event with industry leaders',
  },
];

// API endpoints
export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  EVENTS: {
    GET_ALL: '/events',
    GET_ONE: (id) => `/events/${id}`,
    CREATE: '/events',
    UPDATE: (id) => `/events/${id}`,
    DELETE: (id) => `/events/${id}`,
  },
  ATTENDANCE: {
    CHECK_IN: '/attendance/checkin',
    GET_ALL: '/attendance',
    GET_BY_EVENT: (eventId) => `/attendance/event/${eventId}`,
  },
};

// Other constants
export const APP_NAME = 'FaceFlow AI';
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Event status types
export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Attendance status types
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
};