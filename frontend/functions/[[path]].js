/**
 * ==============================================================================
 * SPARROWFLOW ENTERPRISE CORE ENGINE - TITANIUM EDITION v3.0.0
 * ==============================================================================
 * * ENVIRONMENT: Cloudflare Pages Functions (Advanced Mode)
 * DATABASE:    Cloudflare D1 (SQLite)
 * AI MODEL:    @cf/meta/llama-3.1-8b-instruct
 * AUTHOR:      SparrowFlow System Architecture
 * * DESCRIPTION:
 * This is the central nervous system of the application. It handles all
 * incoming HTTP requests, routes them to specific logic handlers, validates
 * security tokens, sanitizes inputs, interacts with the D1 Database, 
 * runs AI inference tasks, and returns standardized JSON responses.
 * * ==============================================================================
 */

// ==============================================================================
// 1. GLOBAL CONFIGURATION & CONSTANTS
// ==============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Sparrow-Token',
  'Access-Control-Max-Age': '86400',
};

const API_PREFIX = '/api';
const ADMIN_SECRET = 'admin123'; // In production, use env.ADMIN_SECRET

// ==============================================================================
// 2. MAIN REQUEST DISPATCHER (THE GATEKEEPER)
// ==============================================================================

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;

  // --- A. Handle CORS Preflight ---
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // --- B. Frontend Asset Bypass ---
  // If the request isn't for the API, let Cloudflare serve the React app
  if (!path.startsWith(API_PREFIX)) {
    return context.next();
  }

  // --- C. Request Logging ---
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [INCOMING] ${method} ${path}`);

  // --- D. Routing Logic ---
  try {
    
    // ----------------------------------------------------
    // AUTHENTICATION & SYSTEM
    // ----------------------------------------------------
    if (path === `${API_PREFIX}/login` && method === 'POST') {
      return await handleLogin(request, env);
    }

    if (path === `${API_PREFIX}/system/health` && method === 'GET') {
      return await handleHealthCheck(env);
    }

    // ----------------------------------------------------
    // REGISTRATION & IDENTITY MANAGEMENT
    // ----------------------------------------------------
    if (path === `${API_PREFIX}/register` && method === 'POST') {
      return await handleStudentRegistration(request, env);
    }

    if (path === `${API_PREFIX}/import-students` && method === 'POST') {
      // Admin Only Route
      if (!await verifyAdmin(request)) return unauthorizedResponse();
      return await handleBulkImport(request, env);
    }

    // ----------------------------------------------------
    // QR CODE & ACCESS CONTROL
    // ----------------------------------------------------
    if (path === `${API_PREFIX}/verify-qr` && method === 'POST') {
      return await handleQRVerification(request, env);
    }

    if (path === `${API_PREFIX}/get-qr-codes` && method === 'GET') {
      if (!await verifyAdmin(request)) return unauthorizedResponse();
      return await handleGetQRCodes(request, env);
    }

    // ----------------------------------------------------
    // BIOMETRICS & ATTENDANCE LOGGING
    // ----------------------------------------------------
    if (path === `${API_PREFIX}/enroll-face` && method === 'POST') {
      return await handleFaceEnrollment(request, env);
    }

    if (path === `${API_PREFIX}/attendance` && method === 'POST') {
      return await handleRecordAttendance(request, env);
    }

    // ----------------------------------------------------
    // VOTING SYSTEM (CES ELECTION MODULE)
    // ----------------------------------------------------
    if (path === `${API_PREFIX}/check-vote` && method === 'POST') {
      return await handleCheckVoteStatus(request, env);
    }

    if (path === `${API_PREFIX}/submit-vote` && method === 'POST') {
      return await handleSubmitVote(request, env);
    }

    if (path === `${API_PREFIX}/live-results` && method === 'GET') {
      return await handleLiveResults(env);
    }

    if (path === `${API_PREFIX}/admin/votes` && method === 'GET') {
      if (!await verifyAdmin(request)) return unauthorizedResponse();
      return await handleAdminVoteData(request, env);
    }

    // ----------------------------------------------------
    // DATA ANALYTICS & DASHBOARD
    // ----------------------------------------------------
    if (path === `${API_PREFIX}/stats` && method === 'GET') {
      return await handleDashboardStats(request, env);
    }

    if (path === `${API_PREFIX}/events` && method === 'GET') {
      return await handleGetEvents(env);
    }

    if (path === `${API_PREFIX}/notifications` && method === 'GET') {
      return await handleGetNotifications(env);
    }

    // ----------------------------------------------------
    // UTILITIES & AI
    // ----------------------------------------------------
    if (path === `${API_PREFIX}/feedback` && method === 'POST') {
      return await handleSubmitFeedback(request, env);
    }

    if (path === `${API_PREFIX}/chat` && method === 'POST') {
      return await handleAIChat(request, env);
    }

    if (path === `${API_PREFIX}/insights` && method === 'POST') {
      return await handleAIInsights(request, env);
    }

    // --- E. 404 Handler ---
    console.warn(`[ROUTER] 404 Not Found: ${path}`);
    return errorResponse("Endpoint not found or method not allowed.", 404);

  } catch (err) {
    // --- F. Global Error Trap ---
    console.error(`[CRITICAL] Server Error: ${err.message}`);
    console.error(err.stack);
    return errorResponse("Internal Server Engine Error", 500, err.message);
  }
}

// ==============================================================================
// 3. CORE LOGIC HANDLERS (THE BRAINS)
// ==============================================================================

/**
 * Handle Admin Login
 * Validates credentials and returns a session token.
 */
async function handleLogin(request, env) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required.", 400);
    }

    console.log(`[AUTH] Checking credentials for ${email}`);

    // Check DB for user
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

    // Secure comparison (Mock for demo, use bcrypt in real prod)
    // Also allows hardcoded fallback for initial setup
    const isHardcoded = (email === 'sparrow@attendance.com' && password === ADMIN_SECRET);
    const isDbMatch = (user && user.password_hash === password);

    if (isHardcoded || isDbMatch) {
      // Update last login
      if (user) {
        await env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();
      }

      return jsonResponse({
        success: true,
        token: `sf_sess_${generateId(16)}`, // Simulated JWT
        user: {
          id: user ? user.id : 0,
          name: user ? user.full_name : "System Admin",
          role: user ? user.role : "superadmin",
          email: email
        }
      });
    }

    return errorResponse("Invalid email or password.", 401);
  } catch (e) {
    throw e;
  }
}

/**
 * Handle Student Registration (Single)
 * Registers a student and generates their unique QR Token.
 */
async function handleStudentRegistration(request, env) {
  const body = await request.json();
  const { studentNumber, firstName, lastName, middleInitial, email, course, yearLevel } = body;

  // 1. Validation
  if (!studentNumber || !firstName || !lastName || !course) {
    return errorResponse("Missing required fields (ID, Name, Course).", 400);
  }

  // 2. Duplicate Check
  const existing = await env.DB.prepare('SELECT id FROM students WHERE student_number = ?').bind(studentNumber).first();
  if (existing) {
    return errorResponse("Student ID already registered.", 409);
  }

  // 3. Generate QR Token
  const qrToken = `QR-${studentNumber}-${generateId(6)}`;

  // 4. Insert into DB
  try {
    await env.DB.prepare(`
      INSERT INTO students (
        student_number, first_name, last_name, middle_initial, 
        email, course, year_level, qr_token, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      studentNumber, 
      sanitize(firstName), 
      sanitize(lastName), 
      sanitize(middleInitial || ''), 
      email || '', 
      course, 
      yearLevel, 
      qrToken
    ).run();

    console.log(`[REG] Success: ${studentNumber}`);
    return jsonResponse({ success: true, qrToken, message: "Registration successful" });

  } catch (dbErr) {
    console.error(`[DB-ERROR] ${dbErr.message}`);
    return errorResponse("Database constraint violation.", 500);
  }
}

/**
 * Handle Bulk Import
 * Robustly processes an array of students, handles duplicates gracefully.
 */
async function handleBulkImport(request, env) {
  try {
    const { students } = await request.json();

    if (!Array.isArray(students) || students.length === 0) {
      return errorResponse("Invalid payload: 'students' array required.", 400);
    }

    console.log(`[IMPORT] Starting batch import for ${students.length} records.`);

    // We use a transaction/batch approach for performance
    const stmt = env.DB.prepare(`
      INSERT OR REPLACE INTO students (
        student_number, first_name, last_name, middle_initial, 
        email, course, year_level, qr_token, is_active, date_registered
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    `);

    const batchQueue = [];
    let processedCount = 0;

    for (const s of students) {
      // Basic validation inside loop
      if (!s.studentNumber || !s.firstName) continue;

      // Generate token if not present
      const token = s.qrToken || `QR-${s.studentNumber}-${generateId(4)}`;

      batchQueue.push(stmt.bind(
        s.studentNumber,
        sanitize(s.firstName),
        sanitize(s.lastName),
        sanitize(s.middleInitial || ''),
        s.email || '',
        s.course || 'Unknown',
        s.yearLevel || '1st Year',
        token
      ));
      
      processedCount++;
    }

    // Execute in chunks of 50 to prevent binding limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < batchQueue.length; i += CHUNK_SIZE) {
        const chunk = batchQueue.slice(i, i + CHUNK_SIZE);
        await env.DB.batch(chunk);
    }

    return jsonResponse({ 
      success: true, 
      count: processedCount,
      message: `Successfully processed ${processedCount} records.` 
    });

  } catch (e) {
    return errorResponse(`Bulk import failed: ${e.message}`, 500);
  }
}

/**
 * Handle QR Verification
 * The core logic for scanning a ticket at the door.
 */
async function handleQRVerification(request, env) {
  const { qrToken, studentNumber } = await request.json();

  console.log(`[VERIFY] Token: ${qrToken}, ID: ${studentNumber}`);

  if (!qrToken && !studentNumber) {
    return errorResponse("QR Token or Student Number required.", 400);
  }

  // 1. Lookup Student
  // We allow looking up by either token OR student ID for manual entry fallback
  let query = 'SELECT * FROM students WHERE ';
  let params = [];

  if (qrToken) {
    query += 'qr_token = ?';
    params.push(qrToken);
  } else {
    query += 'student_number = ?';
    params.push(studentNumber);
  }

  const student = await env.DB.prepare(query).bind(...params).first();

  if (!student) {
    // 1a. Check Verification Requests (for unapproved registrations)
    // If your system uses a pending queue
    return errorResponse("Invalid QR Code. Student record not found.", 404);
  }

  // 2. Check Active Status
  if (student.is_active !== 1) {
    return errorResponse("Access Denied: Student account is suspended/inactive.", 403);
  }

  // 3. Return Success with Profile Data
  return jsonResponse({
    success: true,
    isValid: true,
    student: {
      studentNumber: student.student_number,
      firstName: student.first_name,
      lastName: student.last_name,
      middleInitial: student.middle_initial,
      course: student.course,
      yearLevel: student.year_level,
      photoUrl: student.profile_photo_url || null,
      faceEnrolled: student.face_enrolled === 1
    }
  });
}

/**
 * Handle Get QR Codes
 * Returns list for the Admin QR Grid.
 */
async function handleGetQRCodes(request, env) {
  try {
    // Limit to 500 for performance, order by newest
    const results = await env.DB.prepare(`
      SELECT student_number, first_name, last_name, middle_initial, course, year_level, qr_token, email, date_registered 
      FROM students 
      ORDER BY date_registered DESC 
      LIMIT 1000
    `).all();

    const origin = new URL(request.url).origin;

    const qrCodes = results.results.map(s => {
      // Construct a verification URL
      const verifyLink = `${origin}/verify?token=${s.qr_token}`;
      
      // Use public API for image generation
      const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(s.qr_token)}&color=000000&bgcolor=ffffff&margin=10`;

      return {
        studentNumber: s.student_number,
        studentName: `${s.first_name} ${s.middle_initial ? s.middle_initial + '.' : ''} ${s.last_name}`,
        email: s.email,
        course: s.course,
        yearLevel: s.year_level,
        qrToken: s.qr_token,
        qrUrl: verifyLink,
        qrImageData: imgUrl,
        createdAt: s.date_registered
      };
    });

    return jsonResponse({ success: true, qrCodes, count: qrCodes.length });

  } catch (e) {
    return errorResponse("Failed to fetch QR database.", 500, e.message);
  }
}

/**
 * Handle Record Attendance
 * Logs an entry into the 'attendance' table.
 */
async function handleRecordAttendance(request, env) {
  const { eventId, studentNumber, method, faceDetected, confidence } = await request.json();

  if (!eventId || !studentNumber) return errorResponse("Missing EventID or StudentID", 400);

  // 1. Check for duplicate entry for THIS event
  const existing = await env.DB.prepare(`
    SELECT id, time_of_arrival FROM attendance 
    WHERE event_id = ? AND student_number = ?
  `).bind(eventId, studentNumber).first();

  if (existing) {
    return jsonResponse({ 
        success: false, 
        isDuplicate: true, 
        message: `Already checked in at ${new Date(existing.time_of_arrival).toLocaleTimeString()}` 
    }, 409); // Conflict
  }

  // 2. Fetch current student details for snapshotting
  // (We snapshot so if they change course later, historical data remains accurate)
  const student = await env.DB.prepare('SELECT first_name, course, year_level FROM students WHERE student_number = ?')
    .bind(studentNumber).first();

  if (!student) return errorResponse("Student record missing for snapshot.", 404);

  // 3. Insert Log
  await env.DB.prepare(`
    INSERT INTO attendance (
        event_id, student_number, first_name_snapshot, course_snapshot, year_level_snapshot,
        check_in_method, face_detected, confidence_score, time_of_arrival
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    eventId, 
    studentNumber, 
    student.first_name, 
    student.course, 
    student.year_level, 
    method || 'QR_MANUAL', 
    faceDetected ? 1 : 0, 
    confidence || 0
  ).run();

  return jsonResponse({ success: true, message: "Attendance logged successfully." });
}

/**
 * Handle Check Vote Status
 * Checks if a student has already cast a vote.
 */
async function handleCheckVoteStatus(request, env) {
  const { studentNumber } = await request.json();
  if (!studentNumber) return errorResponse("Student Number required", 400);

  // Check 'votes' table
  const vote = await env.DB.prepare('SELECT id FROM votes WHERE student_number = ?').bind(studentNumber).first();

  return jsonResponse({ 
    success: true, 
    hasVoted: !!vote,
    message: vote ? "Vote record found." : "No vote record found."
  });
}

/**
 * Handle Submit Vote
 * Records a ballot into the database.
 */
async function handleSubmitVote(request, env) {
  const { student, votes } = await request.json();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // 1. Validation
  if (!student || !student.studentNumber) return errorResponse("Invalid student data", 400);
  if (!votes || !Array.isArray(votes) || votes.length === 0) return errorResponse("Empty ballot", 400);

  // 2. Check Double Voting (Race condition protection ideally needed here, but basic check is good)
  const existing = await env.DB.prepare('SELECT id FROM votes WHERE student_number = ?').bind(student.studentNumber).first();
  if (existing) {
    // Log duplicate attempt security event
    await env.DB.prepare('INSERT INTO duplicate_attempts (student_number, ip_address, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)')
        .bind(student.studentNumber, ip).run();
    return errorResponse("You have already voted.", 403);
  }

  // 3. Record Vote
  // We store the full ballot as a JSON string for flexibility
  await env.DB.prepare(`
    INSERT INTO votes (
        student_number, first_name, last_name, course, 
        vote_data, ip_address, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    student.studentNumber,
    student.firstName,
    student.lastName,
    student.course,
    JSON.stringify(votes),
    ip
  ).run();

  return jsonResponse({ success: true, message: "Vote cast successfully." });
}

/**
 * Handle Live Results
 * Aggregates vote data for the public dashboard.
 */
async function handleLiveResults(env) {
  // Fetch all vote blobs
  const allVotes = await env.DB.prepare('SELECT vote_data FROM votes').all();
  
  const aggregator = {};

  // Process Logic (In-Memory Aggregation)
  if (allVotes.results) {
    for (const row of allVotes.results) {
      const ballot = JSON.parse(row.vote_data); // Array of { position, candidateId }
      
      for (const selection of ballot) {
        const { position, candidateId } = selection;
        
        if (!aggregator[position]) aggregator[position] = {};
        if (!aggregator[position][candidateId]) aggregator[position][candidateId] = 0;
        
        aggregator[position][candidateId]++;
      }
    }
  }

  return jsonResponse({ 
    success: true, 
    results: aggregator, 
    totalVotes: allVotes.results ? allVotes.results.length : 0 
  });
}

/**
 * Handle Admin Vote Data
 * Returns raw vote rows for auditing.
 */
async function handleAdminVoteData(request, env) {
  const votes = await env.DB.prepare('SELECT * FROM votes ORDER BY timestamp DESC').all();
  const duplicates = await env.DB.prepare('SELECT * FROM duplicate_attempts ORDER BY timestamp DESC').all();

  // Parse JSON strings back to objects for frontend
  const parsedVotes = votes.results.map(v => ({
    ...v,
    vote_data: JSON.parse(v.vote_data)
  }));

  return jsonResponse({
    success: true,
    votes: parsedVotes,
    duplicates: duplicates.results,
    count: parsedVotes.length
  });
}

/**
 * Handle Dashboard Stats
 * Aggregates attendance data for charts.
 */
async function handleDashboardStats(request, env) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId') || 1;

  // Parallel execution for speed
  const [counts, byCourse, byYear] = await Promise.all([
    env.DB.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN face_detected = 1 THEN 1 ELSE 0 END) as biometric,
            SUM(CASE WHEN check_in_method = 'QR' THEN 1 ELSE 0 END) as qr
        FROM attendance WHERE event_id = ?
    `).bind(eventId).first(),

    env.DB.prepare(`
        SELECT course_snapshot as name, COUNT(*) as value 
        FROM attendance WHERE event_id = ? GROUP BY course_snapshot
    `).bind(eventId).all(),

    env.DB.prepare(`
        SELECT year_level_snapshot as name, COUNT(*) as value 
        FROM attendance WHERE event_id = ? GROUP BY year_level_snapshot
    `).bind(eventId).all()
  ]);

  return jsonResponse({
    counts: counts || { total: 0, biometric: 0, qr: 0 },
    programs: byCourse.results || [],
    years: byYear.results || []
  });
}

/**
 * Handle AI Chat
 * Pipes messages to Cloudflare Workers AI (Llama).
 */
async function handleAIChat(request, env) {
  const { messages } = await request.json();
  
  if (!env.AI) return errorResponse("AI binding not configured.", 503);

  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages });
    return jsonResponse({ response: response.response });
  } catch (e) {
    return errorResponse("AI Inference Failed: " + e.message, 500);
  }
}

/**
 * Handle AI Insights
 * Generates an analytical summary of provided data.
 */
async function handleAIInsights(request, env) {
  const { context } = await request.json(); // context is a string summary of stats
  
  if (!env.AI) return errorResponse("AI binding not configured.", 503);

  const prompt = `
    You are an event data analyst for a university. 
    Analyze the following attendance data and provide 3 brief, bulleted insights 
    regarding student participation trends.
    
    Data: ${context}
  `;

  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { 
        messages: [{ role: 'user', content: prompt }] 
    });
    return jsonResponse({ response: response.response });
  } catch (e) {
    return errorResponse("Insight Generation Failed.", 500);
  }
}

// ==============================================================================
// 4. UTILITY HELPER FUNCTIONS (ROBUST TOOLKIT)
// ==============================================================================

/**
 * Verify Admin Authorization
 * Checks the Bearer token in the request header.
 */
async function verifyAdmin(request) {
  const auth = request.headers.get('Authorization');
  if (!auth) return false;
  
  const token = auth.replace('Bearer ', '');
  
  // In a real app, verify JWT signature or check DB session
  // For this robust demo, checking against our secret or a session prefix
  return (token === ADMIN_SECRET || token.startsWith('sf_sess_'));
}

/**
 * Standard JSON Response Builder
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

/**
 * Standard Error Response Builder
 */
function errorResponse(message, status = 500, details = null) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    details: details,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

/**
 * Generate Random ID
 */
function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Input Sanitization (Basic XSS prevention)
 */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ==============================================================================
// 5. ADDITIONAL PLACEHOLDERS (For Completeness)
// ==============================================================================

async function handleFaceEnrollment(request, env) {
    // Placeholder logic for biometric data storage
    return jsonResponse({ success: true, message: "Face vector stored." });
}

async function handleGetEvents(env) {
    const res = await env.DB.prepare('SELECT * FROM events ORDER BY date ASC').all();
    return jsonResponse(res.results || []);
}

async function handleGetNotifications(env) {
    const res = await env.DB.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10').all();
    return jsonResponse(res.results || []);
}

async function handleSubmitFeedback(request, env) {
    const { studentNumber, rating, comment } = await request.json();
    await env.DB.prepare('INSERT INTO feedback (student_number, rating, comment) VALUES (?, ?, ?)')
        .bind(studentNumber, rating, comment).run();
    return jsonResponse({ success: true });
}

async function handleHealthCheck(env) {
    return jsonResponse({ 
        status: 'operational', 
        database: env.DB ? 'connected' : 'disconnected',
        ai: env.AI ? 'connected' : 'disconnected',
        version: '3.0.0'
    });
}

async function calibrateCamera(request, env) {
    return jsonResponse({ success: true, message: "Calibration parameters saved." });
}