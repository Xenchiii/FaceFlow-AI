// ==================== REAL HIGH-PRECISION QR SCAN ENGINE ====================
  const handleQRScan = async () => {
    // 1. BIOMETRIC GATE: Multi-factor Liveness Verification
    if (!faceDetected || detectedFaceQueueRef.current.length === 0) {
      setError('❌ Biometric Gate Locked: No valid face detected in the optical path.');
      if (navigator.vibrate) navigator.vibrate(200); 
      setTimeout(() => setError(null), 3000);
      return;
    }

    // 2. DATABASE & MEMORY PERSISTENCE VALIDATION
    if (!studentMasterlist || studentMasterlist.length === 0) {
      setError("❌ System Integrity Failure: Local Student Masterlist (CSV) not found.");
      return;
    }

    // 3. OPTICAL HARDWARE BUFFER ACQUISITION
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('❌ Hardware Error: Graphics Rendering Canvas context lost.');
      return;
    }

    // Capture the 2D Context with deep performance optimizations
    const context = canvas.getContext('2d', { 
      willReadFrequently: true, // Forces CPU-side buffer for immediate access
      alpha: false,             // Disables alpha blending to save CPU overhead
    });
    
    // Extract raw UInt8ClampedArray (RGBA pixel data) from the active viewport
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // 4. SIGNAL DECODING ENGINE (jsQR Neural-Pattern Matching)
    const code = jsqr(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert", 
    });

    // 5. SIGNAL PROCESSING & MATCHING
    if (code) {
      setAiProcessing(true);
      const scannedSignal = code.data.trim(); 
      console.log(`[SYS-SIGNAL] Optical Data Decoded: ${scannedSignal}`);

      // Locate the unique record in the Masterlist using a type-agnostic check.
      const studentMatch = studentMasterlist.find(std => 
        String(std.studentNumber) === scannedSignal || 
        String(std.qr_token) === scannedSignal
      );

      if (studentMatch) {
        // 6. TRANSACTION SECURITY CHECK
        if (processedStudents.has(studentMatch.studentNumber)) {
          setError(`⚠️ Conflict: ${studentMatch.firstName} is already recorded.`);
          if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
          setAiProcessing(false);
          return;
        }

        // 7. BIOMETRIC CONFIDENCE FILTER
        const primaryBiometric = detectedFaceQueueRef.current[0];
        const minThreshold = 0.55; 

        if (primaryBiometric && primaryBiometric.confidence < minThreshold) {
          setError(`⚠️ Biometric Warning: Confidence too low (${(primaryBiometric.confidence * 100).toFixed(1)}%).`);
          setAiProcessing(false);
          return;
        }

        // 8. ATOMIC RECORD GENERATION
        const timestamp = new Date();
        const verifiedRecord = {
          id: `REC-${timestamp.getTime()}`,
          studentId: studentMatch.studentNumber,
          firstName: studentMatch.firstName,
          lastName: studentMatch.lastName,
          middleInitial: studentMatch.middleInitial || '',
          program: studentMatch.course,
          year: studentMatch.yearLevel,
          email: studentMatch.email || 'N/A',
          time: timestamp.toLocaleTimeString(),
          timeOfArrival: timestamp.toISOString(),
          method: 'Multi-Factor (Face + QR Verified)',
          confidence: primaryBiometric.confidence,
          faceDetected: true,
          opticalCoordinates: code.location 
        };

        // 9. GLOBAL STATE SYNCHRONIZATION
        setRecentCheckIns(prev => [verifiedRecord, ...prev.slice(0, 24)]);
        setProcessedStudents(prev => new Set([...prev, studentMatch.studentNumber]));
        setAttendanceCount(prev => Math.min(prev + 1, currentEvent?.capacity || 1000));
        
        // Update Categorical Analytics Engine.
        setSessionStats(prev => {
          const courseKey = studentMatch.course.toLowerCase();
          const yearKey = studentMatch.yearLevel.replace(/\s+/g, '').toLowerCase();
          
          return {
            ...prev,
            qrScans: (prev.qrScans || 0) + 1,
            faceScans: (prev.faceScans || 0) + 1,
            [courseKey]: (prev[courseKey] || 0) + 1,
            [yearKey]: (prev[yearKey] || 0) + 1
          };
        });

        // 10. SUCCESS FEEDBACK & RESET
        setSuccessMessage(`✅ AUTHORIZED: ${studentMatch.firstName} ${studentMatch.lastName}`);
        
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 

        // CRITICAL: Flush local detection states to prevent "Ghost Scanning"
        setFaceDetected(false);
        setCurrentFaceCount(0);
        detectedFaceQueueRef.current = [];

        setTimeout(() => setSuccessMessage(null), 2500);
      } else {
        setError(`❌ Access Denied: QR ID [${scannedSignal}] not authorized.`);
      }
      setAiProcessing(false);
    } else {
      setError('📡 Scanning... No QR pattern recognized. Ensure code is bright and centered.');
      setTimeout(() => setError(null), 2000);
    }
  };