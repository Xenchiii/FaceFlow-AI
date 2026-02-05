// Color constants for the application
export const COLORS = {
  primary: '#F5F7FA',    // Background
  secondary: '#7986C7',  // Academic / Purple
  accent: '#F73F52',     // Sports / Red
  success: '#10b981',    // Green
  warning: '#FFEA85',    // Celebration / Yellow
  error: '#ef4444',      // Red
  info: '#5B6FA8',       // Blue / Anomalies
  dark: '#1f2937',       // Slate 800
  light: '#f3f4f6',      // Slate 100
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

// Initial events data (Synced with Dashboard)
export const INITIAL_EVENTS = [
  {
    id: 1,
    name: 'CCS Week: AI Event',
    date: 'January 17, 2026',
    time: '8:00 AM - 7:00 PM',
    venue: 'ICCT Gym',
    capacity: 1500,
    registered: 0,
    category: 'Academic',
    color: COLORS.secondary, // #7986C7
    description: 'Annual CCS week focusing on Artificial Intelligence innovations.',
  },
  {
    id: 2,
    name: 'ICCT Colleges Sport Festival',
    date: 'June 20, 2026',
    time: '6:00 AM - 3:00 PM',
    venue: 'Marikina Sports Center',
    capacity: 2000,
    registered: 0,
    category: 'Sports',
    color: COLORS.accent, // #F73F52
    description: 'Inter-campus sports competition and opening ceremony.',
  },
  {
    id: 3,
    name: 'CCS College Day',
    date: 'June 24, 2026',
    time: '8:00 AM - 5:00 PM',
    venue: 'ICCT Gym',
    capacity: 1500,
    registered: 0,
    category: 'Celebration',
    color: COLORS.warning, // #FFEA85
    description: 'A day of celebration, booths, and student activities.',
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
export const APP_NAME = 'SparrowFlow'; // Updated to match UI
export const COMPANY_NAME = 'FaceFlow AI'; // For Footer Copyright
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