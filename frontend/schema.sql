/* ======================================================
   SPARROWFLOW COMPLETE DATABASE SCHEMA (FINALIZED)
   ====================================================== */

-- 1. USERS (Admin/Staff)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  avatar_url TEXT,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER SETTINGS
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY,
  dark_mode BOOLEAN DEFAULT 0,
  email_alerts BOOLEAN DEFAULT 1,
  sound_effects BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. EVENTS (Updated)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT,
  venue TEXT,
  capacity INTEGER DEFAULT 500,
  category TEXT,
  color_hex TEXT DEFAULT '#7986C7',
  status TEXT DEFAULT 'active',
  event_code TEXT UNIQUE, -- NEW: Unique code for the event
  is_one_time_entry INTEGER DEFAULT 1, -- NEW: Enforce single entry logic
  require_face_detection INTEGER DEFAULT 1,
  min_face_confidence REAL DEFAULT 0.6,
  allow_qr_only INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_initial TEXT, -- Already present, perfect for your update
  email TEXT,
  course TEXT NOT NULL,
  year_level TEXT NOT NULL,
  gender TEXT, -- NEW: For demographic insights
  qr_token TEXT NOT NULL UNIQUE,
  qr_url TEXT,
  profile_photo_url TEXT,
  face_enrolled INTEGER DEFAULT 0,
  last_face_verification DATETIME,
  total_face_verifications INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  date_registered DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. FACE EMBEDDINGS
CREATE TABLE IF NOT EXISTS face_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_number TEXT NOT NULL,
  face_descriptor TEXT NOT NULL,
  model_version TEXT DEFAULT 'face-api.js',
  enrollment_image_hash TEXT,
  reference_image_path TEXT,
  quality_score REAL,
  is_primary INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_number) REFERENCES students(student_number) ON DELETE CASCADE
);

-- 6. ATTENDANCE LOGS (Updated)
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  student_number TEXT NOT NULL,
  first_name_snapshot TEXT,
  course_snapshot TEXT,
  year_level_snapshot TEXT,
  check_in_method TEXT NOT NULL,
  face_detected INTEGER DEFAULT 0,
  confidence_score REAL,
  face_image_hash TEXT,
  time_of_arrival DATETIME DEFAULT CURRENT_TIMESTAMP,
  exit_time DATETIME, -- NEW: For duration tracking
  entry_status TEXT DEFAULT 'Valid', -- NEW: 'Valid', 'Duplicate', 'Flagged'
  processing_time_ms INTEGER,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (student_number) REFERENCES students(student_number),
  UNIQUE(event_id, student_number)
);

-- 7. SCAN ATTEMPTS
CREATE TABLE IF NOT EXISTS scan_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  student_number TEXT,
  qr_token TEXT,
  scan_result TEXT NOT NULL,
  error_message TEXT,
  face_detected INTEGER DEFAULT 0,
  confidence_score REAL,
  face_quality_score REAL,
  fps_at_scan INTEGER,
  scan_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. FAILURES LOG
CREATE TABLE IF NOT EXISTS face_verification_failures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  student_number TEXT,
  failure_reason TEXT,
  attempted_confidence REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- 9. CAMERA CALIBRATION
CREATE TABLE IF NOT EXISTS camera_calibration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camera_device_id TEXT,
  avg_fps INTEGER,
  avg_latency_ms INTEGER,
  last_used DATETIME
);

-- 10. SESSION STATS
CREATE TABLE IF NOT EXISTS session_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_end DATETIME,
  total_scans INTEGER DEFAULT 0,
  successful_scans INTEGER DEFAULT 0,
  failed_scans INTEGER DEFAULT 0,
  avg_face_confidence REAL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 11. SECURITY AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type TEXT NOT NULL,
  performed_by TEXT,
  details TEXT,
  ip_address TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. FEEDBACK SYSTEM
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_number TEXT,
  event_id INTEGER,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_reviewed BOOLEAN DEFAULT 0,
  FOREIGN KEY (student_number) REFERENCES students(student_number)
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  text_summary TEXT NOT NULL,
  detail_body TEXT,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. AI INSIGHTS
CREATE TABLE IF NOT EXISTS ai_insights_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  prediction_data TEXT,
  anomalies_data TEXT,
  recommendations_data TEXT,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 15. SYSTEM CONFIG
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

/* =========================================
   TRIGGERS
   ========================================= */

-- Notification on Feedback
CREATE TRIGGER IF NOT EXISTS trg_notify_feedback
AFTER INSERT ON feedback
BEGIN
  INSERT INTO notifications (type, title, text_summary, detail_body)
  VALUES (
    'feedback',
    'New Feedback Received',
    'A student submitted a ' || NEW.rating || '-star rating.',
    'Rating: ' || NEW.rating || '/5. Comment: "' || COALESCE(NEW.comment, 'No comment') || '"'
  );
END;

-- Notification on Student Registration
CREATE TRIGGER IF NOT EXISTS trg_notify_reg
AFTER INSERT ON students
BEGIN
  INSERT INTO notifications (type, title, text_summary, detail_body)
  VALUES (
    'qr',
    'New Student Registered',
    NEW.first_name || ' ' || NEW.last_name || ' (' || NEW.course || ')',
    'Student ID ' || NEW.student_number || ' registered and generated a QR code.'
  );
END;

-- Log Scan Attempt on Attendance
CREATE TRIGGER IF NOT EXISTS trg_log_attendance_scan
AFTER INSERT ON attendance
BEGIN
  INSERT INTO scan_attempts (
    event_id, student_number, scan_result, face_detected, confidence_score
  ) VALUES (
    NEW.event_id, NEW.student_number, 'success', NEW.face_detected, NEW.confidence_score
  );
END;

-- Update Student Stats on Successful Face Scan
CREATE TRIGGER IF NOT EXISTS trg_update_face_stats
AFTER INSERT ON attendance
WHEN NEW.face_detected = 1
BEGIN
  UPDATE students 
  SET 
    total_face_verifications = total_face_verifications + 1,
    last_face_verification = CURRENT_TIMESTAMP,
    face_enrolled = 1
  WHERE student_number = NEW.student_number;
END;

/* =========================================
   INDEXES
   ========================================= */
CREATE INDEX idx_student_qr ON students(qr_token);
CREATE INDEX idx_student_num ON students(student_number);
CREATE INDEX idx_face_vector ON face_embeddings(student_number);
CREATE INDEX idx_attendance_evt ON attendance(event_id);
CREATE INDEX idx_logs_timestamp ON scan_attempts(scan_timestamp);

/* =========================================
   SEED DATA
   ========================================= */
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('sparrow@attendance.com', 'hashed_pw', 'System Admin', 'admin');

-- Updated Events to match your context
INSERT INTO events (name, date, time, venue, capacity, category, color_hex, event_code, is_one_time_entry) VALUES 
('CCS Week: AI Event', '2026-01-17', '8:00 AM - 7:00 PM', 'ICCT Gym', 1500, 'Academic', '#7986C7', 'CCS2026', 1),
('ICCT Colleges Sport Festival', '2026-06-20', '6:00 AM - 3:00 PM', 'Marikina Sports Center', 2000, 'Sports', '#F73F52', 'SPORT2026', 1),
('CCS College Day', '2026-06-24', '8:00 AM - 5:00 PM', 'ICCT Gym', 1500, 'Celebration', '#FFEA85', 'DAY2026', 1);

-- Default Config Settings
INSERT INTO system_config (key, value, description) VALUES
('smart_matching', 'true', 'Ignore letters in student IDs during face matching'),
('min_confidence', '0.6', 'Minimum confidence score for face match'),
('one_time_entry_mode', 'strict', 'Reject duplicate scans immediately');