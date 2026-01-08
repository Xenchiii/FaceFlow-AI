// Sample data for the FaceFlow AI application

export const anomalies = [
  {
    id: 1,
    type: 'Unauthorized Access',
    timestamp: new Date().toISOString(),
    location: 'Main Entrance',
    severity: 'high',
    description: 'Unknown face detected at restricted area',
    status: 'unresolved',
  },
  {
    id: 2,
    type: 'Multiple Failed Attempts',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    location: 'Server Room',
    severity: 'medium',
    description: '3 failed recognition attempts detected',
    status: 'investigating',
  },
  {
    id: 3,
    type: 'After Hours Entry',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    location: 'Office Floor 2',
    severity: 'low',
    description: 'Entry detected outside business hours',
    status: 'resolved',
  },
];

export const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Employee',
    department: 'Engineering',
    lastSeen: new Date().toISOString(),
    status: 'active',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'Manager',
    department: 'Operations',
    lastSeen: new Date(Date.now() - 1800000).toISOString(),
    status: 'active',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'Employee',
    department: 'Sales',
    lastSeen: new Date(Date.now() - 86400000).toISOString(),
    status: 'inactive',
  },
];

export const attendanceStats = {
  today: {
    present: 45,
    absent: 5,
    late: 3,
    total: 53,
  },
  thisWeek: {
    averageAttendance: 48,
    trend: 'up',
    percentage: 92,
  },
  thisMonth: {
    averageAttendance: 47,
    trend: 'stable',
    percentage: 89,
  },
};

export const recognitionStats = {
  totalRecognitions: 1247,
  successRate: 98.5,
  averageConfidence: 95.2,
  failedAttempts: 18,
};

export const locations = [
  { id: 1, name: 'Main Entrance', status: 'active', cameras: 2 },
  { id: 2, name: 'Server Room', status: 'active', cameras: 1 },
  { id: 3, name: 'Office Floor 1', status: 'active', cameras: 4 },
  { id: 4, name: 'Office Floor 2', status: 'maintenance', cameras: 3 },
  { id: 5, name: 'Parking Lot', status: 'active', cameras: 2 },
];

export const engagementSegments = [
  {
    id: 1,
    name: 'High Engagement',
    count: 1247,
    percentage: 45,
    color: '#10b981',
    description: 'Users with frequent interactions',
  },
  {
    id: 2,
    name: 'Medium Engagement',
    count: 892,
    percentage: 32,
    color: '#f59e0b',
    description: 'Users with moderate interactions',
  },
  {
    id: 3,
    name: 'Low Engagement',
    count: 634,
    percentage: 23,
    color: '#ef4444',
    description: 'Users with minimal interactions',
  },
];

export const events = [
  {
    id: 1,
    title: 'Team Meeting',
    date: new Date().toISOString(),
    time: '10:00 AM',
    location: 'Conference Room A',
    attendees: 12,
    type: 'meeting',
    status: 'upcoming',
  },
  {
    id: 2,
    title: 'Security Training',
    date: new Date(Date.now() + 86400000).toISOString(),
    time: '2:00 PM',
    location: 'Training Hall',
    attendees: 25,
    type: 'training',
    status: 'upcoming',
  },
  {
    id: 3,
    title: 'System Maintenance',
    date: new Date(Date.now() + 172800000).toISOString(),
    time: '11:00 PM',
    location: 'Server Room',
    attendees: 3,
    type: 'maintenance',
    status: 'scheduled',
  },
  {
    id: 4,
    title: 'All Hands Meeting',
    date: new Date(Date.now() - 86400000).toISOString(),
    time: '9:00 AM',
    location: 'Main Hall',
    attendees: 50,
    type: 'meeting',
    status: 'completed',
  },
];

export const predictions = [
  {
    id: 1,
    metric: 'Peak Traffic Time',
    prediction: '2:00 PM - 4:00 PM',
    confidence: 92,
    trend: 'stable',
    description: 'Expected highest activity during these hours',
  },
  {
    id: 2,
    metric: 'Attendance Rate',
    prediction: '94%',
    confidence: 88,
    trend: 'up',
    description: 'Projected attendance for next week',
  },
  {
    id: 3,
    metric: 'Security Incidents',
    prediction: '2-3 incidents',
    confidence: 75,
    trend: 'down',
    description: 'Estimated security events for next month',
  },
  {
    id: 4,
    metric: 'Resource Utilization',
    prediction: '78%',
    confidence: 85,
    trend: 'up',
    description: 'Expected system resource usage',
  },
];

export const programData = [
  {
    id: 1,
    name: 'Employee Access Program',
    status: 'active',
    participants: 245,
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    type: 'access_control',
    description: 'Standard employee access and recognition',
    program: 'BSCS',
    count: 245,
  },
  {
    id: 2,
    name: 'VIP Access Program',
    status: 'active',
    participants: 32,
    startDate: '2024-02-01',
    endDate: '2024-12-31',
    type: 'vip_access',
    description: 'Enhanced access for executives and VIPs',
    program: 'BSIT',
    count: 189,
  },
  {
    id: 3,
    name: 'Visitor Management',
    status: 'active',
    participants: 187,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    type: 'visitor',
    description: 'Temporary access for visitors and guests',
    program: 'BSIS',
    count: 167,
  },
  {
    id: 4,
    name: 'Contractor Access',
    status: 'active',
    participants: 56,
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    type: 'contractor',
    description: 'Limited access for contractors',
    program: 'ACT',
    count: 98,
  },
];

export const timeSeriesData = [
  { time: '9:00', attendees: 0, predicted: 5 },
  { time: '9:30', attendees: 12, predicted: 15 },
  { time: '10:00', attendees: 35, predicted: 40 },
  { time: '10:30', attendees: 68, predicted: 75 },
  { time: '11:00', attendees: 112, predicted: 120 },
  { time: '11:30', attendees: 167, predicted: 175 },
  { time: '12:00', attendees: 234, predicted: 240 },
  { time: '12:30', attendees: 289, predicted: 295 },
  { time: '1:00', attendees: 342, predicted: 350 },
  { time: '1:30', attendees: 378, predicted: 385 },
  { time: '2:00', attendees: 412, predicted: 420 },
];

export const yearLevelData = [
  { name: '1st Year', value: 145, color: '#7986C7' },
  { name: '2nd Year', value: 178, color: '#F73F52' },
  { name: '3rd Year', value: 156, color: '#FFEA85' },
  { name: '4th Year', value: 134, color: '#5B6FA8' },
];

export const feedbackSentiment = [
  { sentiment: 'Positive', count: 342, percentage: 68, color: '#10b981' },
  { sentiment: 'Neutral', count: 98, percentage: 20, color: '#f59e0b' },
  { sentiment: 'Negative', count: 60, percentage: 12, color: '#ef4444' },
];

export const recommendations = [
  {
    id: 1,
    title: 'Optimize Check-in Flow',
    description: 'Consider adding more check-in stations during peak hours (2-4 PM) to reduce wait times.',
    priority: 'high',
    impact: 'High',
    category: 'Operations',
    icon: '⚡',
  },
  {
    id: 2,
    title: 'Increase Security Patrols',
    description: 'Recent anomaly patterns suggest increasing patrols in the Server Room area.',
    priority: 'medium',
    impact: 'Medium',
    category: 'Security',
    icon: '🔒',
  },
  {
    id: 3,
    title: 'Enhance Training Program',
    description: 'Recognition accuracy can be improved with updated training for security personnel.',
    priority: 'medium',
    impact: 'Medium',
    category: 'Training',
    icon: '📚',
  },
  {
    id: 4,
    title: 'Update Camera Coverage',
    description: 'Office Floor 2 needs additional camera coverage for blind spots.',
    priority: 'low',
    impact: 'Low',
    category: 'Infrastructure',
    icon: '📹',
  },
  {
    id: 5,
    title: 'Implement Predictive Analytics',
    description: 'Use ML models to predict peak times and allocate resources accordingly.',
    priority: 'high',
    impact: 'High',
    category: 'Technology',
    icon: '🤖',
  },
];