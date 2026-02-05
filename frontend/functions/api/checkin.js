export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB; // Assumes you are using Cloudflare D1

  try {
    const body = await request.json();
    const { 
      event_id, 
      student_number, 
      face_confidence, 
      liveness_score, // Score from 0.0 to 1.0 sent by frontend
      qr_token 
    } = body;

    // =================================================================
    // 🛡️ SECURITY CHECK 1: "IS IT A REAL PERSON?" (Anti-Spoofing)
    // =================================================================
    // If the AI is not confident it's a real 3D face, block it.
    const MIN_LIVENESS_THRESHOLD = 0.85; // 85% probability it's real
    
    if (liveness_score < MIN_LIVENESS_THRESHOLD) {
      // LOG THE ATTEMPT AS A SECURITY INCIDENT
      await db.prepare(`
        INSERT INTO scan_attempts (event_id, student_number, scan_result, spoof_detected, error_message)
        VALUES (?, ?, 'spoof_detected', 1, 'Liveness check failed: Potential photo/screen detected')
      `).bind(event_id, student_number).run();

      return new Response(JSON.stringify({ 
        success: false, 
        error: "Spoof Detected: Please scan a real face." 
      }), { status: 403 });
    }

    // =================================================================
    // 🚫 SECURITY CHECK 2: "IS IT A DUPLICATE?" (Already Checked In)
    // =================================================================
    // Check if this specific student is already in the attendance table for this event
    const existingEntry = await db.prepare(`
      SELECT id FROM attendance 
      WHERE event_id = ? AND student_number = ?
    `).bind(event_id, student_number).first();

    if (existingEntry) {
      // LOG THE DUPLICATE ATTEMPT
      await db.prepare(`
        INSERT INTO scan_attempts (event_id, student_number, scan_result, is_duplicate_attempt, error_message)
        VALUES (?, ?, 'duplicate_face', 1, 'Student already checked in')
      `).bind(event_id, student_number).run();

      return new Response(JSON.stringify({ 
        success: false, 
        error: "Duplicate: Student already checked in!" 
      }), { status: 409 });
    }

    // =================================================================
    // ⏳ SECURITY CHECK 3: "ARE THEY SPAMMING?" (Rapid Rescan Cooldown)
    // =================================================================
    // Check scan_attempts to see if they tried scanning in the last 5 minutes
    const cooldownCheck = await db.prepare(`
      SELECT scan_timestamp FROM scan_attempts 
      WHERE event_id = ? AND student_number = ? 
      AND scan_timestamp > datetime('now', '-5 minutes')
      ORDER BY id DESC LIMIT 1
    `).bind(event_id, student_number).first();

    if (cooldownCheck) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Cooldown active: Please wait 5 minutes before scanning again." 
      }), { status: 429 });
    }

    // =================================================================
    // ✅ ALL CHECKS PASSED: RECORD ATTENDANCE
    // =================================================================
    
    // 1. Insert into Attendance Table
    await db.prepare(`
      INSERT INTO attendance (
        event_id, student_number, check_in_method, 
        face_detected, confidence_score, liveness_score, 
        time_of_arrival, qr_token
      ) VALUES (?, ?, 'Face + QR', 1, ?, ?, datetime('now'), ?)
    `).bind(event_id, student_number, face_confidence, liveness_score, qr_token).run();

    // 2. Log Success in History
    await db.prepare(`
      INSERT INTO scan_attempts (event_id, student_number, scan_result)
      VALUES (?, ?, 'success')
    `).bind(event_id, student_number).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Check-in Successful",
      student: student_number
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}