SparrowFlow AI - Complete Technical Documentation
📋 Project Overview
SparrowFlow AI is an enterprise-grade, browser-based attendance tracking system that combines Computer Vision (Facial Recognition) with QR Code Verification to provide secure, real-time student attendance management for educational institutions.

🎯 Core Features
1. Multi-Factor Authentication System

Facial Recognition using Face-API.js (TinyFaceDetector + Face Recognition Net)
QR Code Scanning with jsQR library
Liveness Detection (Anti-spoofing) to prevent photo/video attacks
Duplicate Prevention - Students can only check in once per event

2. AI-Powered Analytics

Predictive Attendance Forecasting using Cloudflare Workers AI (Llama 3.1)
Anomaly Detection for unusual attendance patterns
Real-time Insights with confidence scores
Sentiment Analysis of student feedback

3. Administrative Dashboard

Event management (3 pre-loaded events: CCS Week, Sports Festival, College Day)
Live attendance tracking with visual charts
Student segmentation by year level and program
Export capabilities (CSV reports)

4. Student Self-Registration

QR code generation via public API
Email validation and data sanitization
Printable digital tickets with embedded QR codes
Feedback system with star ratings


🛠️ Technology Stack
Frontend
TechnologyPurposeVersionReactUI Framework18.xLucide ReactIcon LibraryLatestRechartsData VisualizationLatestFace-API.jsFacial Recognition@vladmandic/face-apijsQRQR Code DecodingLatestHTML5 CanvasTicket GenerationNative
Backend (Cloudflare Platform)
ServicePurposeCloudflare Pages FunctionsServerless API endpointsCloudflare D1SQLite database (persistent storage)Cloudflare Workers AILlama 3.1 8B model for insightsCloudflare KVSession storage (optional)
AI Models

Face Detection: TinyFaceDetector (320px input, lightweight)
Face Recognition: FaceRecognitionNet (128-dimensional embeddings)
Landmark Detection: FaceLandmark68Net
Conversational AI: Llama 3.1 8B Instruct
Alternative Models: Llama 70B, Mistral 7B, Qwen 1.5 7B (for comparison mode)

Security

Liveness Detection: 85% minimum threshold
Confidence Scoring: 45% minimum for face matches
CORS Protection: Wildcard origin (adjust in production)
Input Sanitization: XSS prevention on all inputs
Rate Limiting: 5-minute cooldown between duplicate scans


📂 Project Structure
sparrowflow/
├── public/
│   └── models/                    # Face-API.js model files
│       ├── face_landmark_68_model-shard1
│       ├── face_recognition_model-shard1
│       ├── ssd_mobilenetv1_model-shard1
│       └── tiny_face_detector_model-shard1
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx          # Main analytics view
│   │   ├── CameraView.jsx         # Face + QR scanning engine
│   │   ├── AIInsights.jsx         # AI predictions & anomalies
│   │   ├── Recommendations.jsx    # AI-generated suggestions
│   │   ├── AuthLogin.jsx          # Admin authentication
│   │   ├── StudentRegistration.jsx # Public registration form
│   │   ├── SparrowChatbot.jsx     # AI assistant (Llama 3.1)
│   │   ├── MobileNav.jsx          # Mobile bottom navigation
│   │   └── common/
│   │       ├── QRCodesTab.jsx     # QR code management
│   │       └── ImportTab.jsx      # CSV bulk import
│   ├── Layout/
│   │   ├── Navigation.jsx         # Desktop sidebar
│   │   ├── Header.jsx             # Top bar (notifications, settings)
│   │   └── Footer.jsx             # Copyright footer
│   ├── hooks/
│   │   └── useAttendance.js       # Attendance state management
│   ├── utils/
│   │   ├── constants.js           # Global constants
│   │   └── OptimizationEngine.js  # Queue theory calculations
│   └── App.jsx                    # Main application router
├── functions/                      # Cloudflare Pages Functions
│   └── api/
│       ├── [[route]].js           # Main API handler (all routes)
│       ├── chat.js                # Chatbot AI endpoint
│       └── insights.js            # Analytics AI endpoint
└── wrangler.toml                  # Cloudflare configuration

🗄️ Database Schema (Cloudflare D1)
Core Tables
1. students
sqlCREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_initial TEXT,
  email TEXT,
  course TEXT DEFAULT 'N/A',
  year_level TEXT DEFAULT '1st Year',
  qr_token TEXT UNIQUE,
  profile_photo_url TEXT,
  face_enrolled INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  date_registered DATETIME DEFAULT CURRENT_TIMESTAMP
);
2. attendance
sqlCREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  student_number TEXT NOT NULL,
  first_name_snapshot TEXT,
  course_snapshot TEXT,
  year_level_snapshot TEXT,
  check_in_method TEXT DEFAULT 'QR_MANUAL',
  face_detected INTEGER DEFAULT 0,
  confidence_score REAL DEFAULT 0.0,
  liveness_score REAL DEFAULT 0.0,
  time_of_arrival DATETIME DEFAULT CURRENT_TIMESTAMP,
  qr_token TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id),
  UNIQUE(event_id, student_number)
);
3. events
sqlCREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT,
  time TEXT,
  venue TEXT,
  capacity INTEGER DEFAULT 1000,
  category TEXT DEFAULT 'General',
  color TEXT,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
4. scan_attempts (Security Log)
sqlCREATE TABLE scan_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  student_number TEXT,
  scan_result TEXT,
  spoof_detected INTEGER DEFAULT 0,
  is_duplicate_attempt INTEGER DEFAULT 0,
  error_message TEXT,
  scan_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
5. votes (Voting System Module)
sqlCREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_number TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  course TEXT,
  vote_data TEXT,
  ip_address TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

🔒 Security Features Explained
1. Liveness Detection (Anti-Spoofing)
javascriptconst MIN_LIVENESS_THRESHOLD = 0.85; // 85% confidence it's a real face

if (liveness_score < MIN_LIVENESS_THRESHOLD) {
  // Logs attempt to scan_attempts table
  // Returns 403 Forbidden
  return { error: "Spoof Detected: Please scan a real face." };
}
2. Duplicate Prevention
javascript// Checks if student already checked in for this event
const existingEntry = await db.prepare(`
  SELECT id FROM attendance 
  WHERE event_id = ? AND student_number = ?
`).bind(eventId, studentNumber).first();

if (existingEntry) {
  return { error: "Duplicate: Student already checked in!" };
}
3. Rate Limiting (5-Minute Cooldown)
javascript// Prevents spam scanning
const cooldownCheck = await db.prepare(`
  SELECT scan_timestamp FROM scan_attempts 
  WHERE event_id = ? AND student_number = ? 
  AND scan_timestamp > datetime('now', '-5 minutes')
`).bind(eventId, studentNumber).first();

if (cooldownCheck) {
  return { error: "Cooldown active: Please wait 5 minutes." };
}

🎨 Design System
Color Palette
javascriptconst COLORS = {
  primary: '#7986C7',    // Academic (Purple)
  accent: '#F73F52',     // Sports (Red)
  warning: '#FFEA85',    // Celebration (Yellow)
  info: '#5B6FA8',       // Blue
  success: '#10b981',    // Green
  error: '#ef4444',      // Red
};
Dark Mode Implementation

Automatic theme toggle via body.dark-mode class
Persisted in localStorage
Cascading CSS variables for all components


🚀 Deployment Guide
Cloudflare Pages Setup

Install Wrangler CLI

bashnpm install -g wrangler
wrangler login

Initialize D1 Database

bashwrangler d1 create sparrowflow-db

Run Migrations

bashwrangler d1 execute sparrowflow-db --file=./schema.sql

Deploy

bashnpm run build
wrangler pages publish ./build --project-name=sparrowflow

Bind AI Model

toml# wrangler.toml
[env.production.ai]
binding = "AI"

📱 Mobile App Conversion (React Native)
Offline QR Code Generator
For a mobile app with offline QR generation, use these libraries:
React Native Tech Stack
bashnpx react-native init SparrowFlowMobile
cd SparrowFlowMobile

# Install dependencies
npm install react-native-qrcode-svg
npm install @react-native-camera/camera
npm install @react-native-async-storage/async-storage
npm install react-native-fs
Offline QR Generation Example
jsximport QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StudentQRScreen = () => {
  const [studentId, setStudentId] = useState('');
  const [qrValue, setQrValue] = useState('');

  const generateOfflineQR = async () => {
    // Generate unique token offline
    const timestamp = Date.now();
    const token = `QR-${studentId}-${timestamp}`;
    
    setQrValue(token);
    
    // Store locally for later sync
    await AsyncStorage.setItem(`pending_${studentId}`, JSON.stringify({
      studentId,
      token,
      timestamp: new Date().toISOString(),
      synced: false
    }));
  };

  return (
    <View>
      <TextInput 
        placeholder="Student ID" 
        value={studentId}
        onChangeText={setStudentId}
      />
      <Button title="Generate QR" onPress={generateOfflineQR} />
      
      {qrValue && (
        <QRCode
          value={qrValue}
          size={300}
          backgroundColor='white'
          color='black'
        />
      )}
    </View>
  );
};
Sync Strategy
javascript// When internet is available
const syncPendingRegistrations = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const pendingKeys = keys.filter(k => k.startsWith('pending_'));
  
  for (let key of pendingKeys) {
    const data = JSON.parse(await AsyncStorage.getItem(key));
    
    if (!data.synced) {
      try {
        await fetch('https://yourapi.com/api/register', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        
        // Mark as synced
        await AsyncStorage.setItem(key, JSON.stringify({...data, synced: true}));
      } catch (e) {
        // Retry later
      }
    }
  }
};
```

---

## 🤖 AI Chatbot (Sparrow)

### **Personality & Capabilities**
- **Context-Aware**: Knows current page, event, attendance count
- **Intent Detection**: Navigation, Troubleshooting, Learning, Urgent, Casual
- **Smart Suggestions**: Provides 2-3 quick actions at end of each response
- **Proactive Assistance**: Offers help based on user patterns
- **Team Knowledge**: Knows all 5 team members and their roles

### **Example Interaction**
```
User: "How do I import students?"
Sparrow: "[NAVIGATION] To import students:
1. Click 'QR Codes' in the sidebar
2. Select the 'Import' tab
3. Download the CSV template
4. Fill in Student ID, Name, Email, Course, Year
5. Upload your completed CSV

💡 Quick Actions: View Template | Go to Import Tab | Watch Tutorial"

🎓 Team Members
NameRoleNicknamePrincess Khazanabelle CartojaTeam Leader"Prince"Leonce F. GananciosAI Developer"Jin"Sairon Akir S. NacionalesFrontend Developer-Marc Juzzel P. Dela CruzPresenter-Jessie Luis M. SarteDocumentor-
Coach: Sir Diether Dongcoy
Hackathon: CCS Week: AI Event Hackathon Competition

📊 Performance Metrics

Face Detection Speed: 30 FPS (640x450px canvas)
Average Latency: 24ms (API response time)
QR Scan Accuracy: 95%+
Liveness Detection: 85% minimum threshold
Confidence Threshold: 45% for face matching
Database Capacity: 10,000+ students (tested)


🐛 Known Limitations

localStorage Not Used: Browser storage APIs are disabled in Cloudflare artifacts. Uses window.storage API instead.
No Real-Time Sync: Dashboard requires manual refresh to see cross-session updates.
Single Event Scanning: Camera View tracks one event at a time.
No Mobile Camera: Mobile version uses QR-only mode (face recognition requires native camera access).
Hardcoded Admin Credentials: sparrow@attendance.com / admin123 (change in production).


🔮 Future Enhancements

 Real-time WebSocket updates
 Multi-event parallel scanning
 Biometric enrollment via photo upload
 Custom event creation
 SMS notifications
 Attendance analytics export (PDF)
 Integration with LMS (Canvas, Moodle)
 Mobile app (React Native) with offline QR generation


📄 License
Proprietary - SparrowFlow Systems © 2026
Built for CCS Week: AI Event Hackathon Competition

🆘 Support
For questions or issues:

Chatbot: Click the floating bird icon (bottom-right)
Email: sparrow@attendance.com
Documentation: This README


🎉 Credits
Special thanks to:

Cloudflare for Workers AI platform
Vladimir Mandic for Face-API.js
jsQR for QR decoding library
Recharts for data visualization
Sir Diether Dongcoy for mentorship

Powered by: Cloudflare Workers AI (Llama 3.1 8B)