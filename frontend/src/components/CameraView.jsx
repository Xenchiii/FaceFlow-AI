import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback 
} from 'react';

// Face API Import
import * as faceapi from 'face-api.js'; 

// Icon Imports from Lucide React
import { 
  Camera, 
  PlayCircle, 
  PauseCircle, 
  UserCheck, 
  Eye, 
  EyeOff, 
  Brain, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Upload, 
  Download, 
  X, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Wifi, 
  Cpu, 
  User, 
  ArrowRight, 
  Search, 
  Activity, 
  ShieldCheck, 
  Server, 
  RotateCcw, 
  Save, 
  Sun, 
  Moon, 
  FileText, 
  Image as ImageIcon,
  LogOut // Added Icon for Check-out visualization
} from 'lucide-react';

// CSS Import (Ensure this file exists or styles are inline)
import './CameraView.css';

/**
 * ============================================================================
 * SPARROWFLOW CONFIGURATION CONSTANTS
 * ----------------------------------------------------------------------------
 * Core settings for the AI detection pipeline, camera feed, and system behavior.
 * Adjust these values to tune performance vs accuracy.
 * ============================================================================
 */

// Models are loaded from this CDN for stability and speed
const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'; 

// Minimum confidence required to consider a face a "match" (0.0 to 1.0)
// Lower = more matches but more false positives
// Higher = stricter matching but might miss people
const CONFIDENCE_THRESHOLD = 0.45; 

// Time in milliseconds before the same student can be scanned again
// NOTE: With "Single Scan Mode" enabled via processedIds, this primarily acts as a UI debounce.
const SCAN_COOLDOWN = 3500; 

// Camera Resolution Settings
// Using 720p is a good balance between detection speed and accuracy for browser-based AI
const VIDEO_CONFIG = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user" 
};

/**
 * UTILITY: ID Normalizer
 * Removes special characters and standardizes ID format for string comparison.
 * Useful for matching filenames to CSV IDs.
 * @param {string} id - The raw ID string
 * @returns {string} - Cleaned ID
 */
const normalizeID = (id) => {
    if (!id) return '';
    return String(id).trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

/**
 * UTILITY: Time Formatter
 * Returns current time in HH:MM:SS format for logging and display.
 * @returns {string}
 */
const getFormattedTime = () => {
    return new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

/**
 * ============================================================================
 * COMPONENT: CameraView
 * ----------------------------------------------------------------------------
 * Main dashboard component handling:
 * 1. AI Face Detection Loop
 * 2. Canvas Drawing Loop
 * 3. Data Persistence (Local Storage)
 * 4. User Interface (Video, Logs, Settings)
 * ============================================================================
 */
const CameraView = ({ 
    currentEvent: propEvent,
    darkMode, // <--- SYNCED: Received directly from App.jsx via Navigation
    attendanceCount, // Optional: if you want to sync count from App
    recentCheckIns: propRecentCheckIns, // Optional: if you want to sync list from App
    onQRScan, // Optional: callback to update App state
    onNewScan // <--- NEW PROP: This connects to the Dashboard Analytics!
}) => {
  
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  // Event Configuration State
  const [currentEvent, setCurrentEvent] = useState(propEvent || { 
      id: 'default-session', 
      name: 'General Attendance', 
      capacity: 1000 
  });

  // ATTENDANCE STATE (Synced with props if available)
  // We maintain local state for immediate UI updates, but sync with parent if props change.
  const [localAttendanceCount, setLocalAttendanceCount] = useState(0);
  const [localRecentCheckIns, setLocalRecentCheckIns] = useState([]);

  // Sync props to local state logic
  useEffect(() => {
    if (attendanceCount !== undefined) {
      setLocalAttendanceCount(attendanceCount);
    }
  }, [attendanceCount]);

  // [ADDED FEATURE]: Sync Recent Checkins from Parent to display IN/OUT status correctly
  useEffect(() => {
    if (propRecentCheckIns) {
      setLocalRecentCheckIns(propRecentCheckIns);
    }
  }, [propRecentCheckIns]);

  // System Status Flags
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  
  // Performance Metrics State
  const [systemHealth, setSystemHealth] = useState({ 
      fps: 0, 
      cpu: 'Idle', 
      status: 'Standby', 
      memory: '0MB', 
      uptime: 0
  });
  
  // AI Model State
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionLatency, setDetectionLatency] = useState(0);

  // Data Management State (The "Masterlist")
  const [studentMasterlist, setStudentMasterlist] = useState([]);
  const [masterlistLoaded, setMasterlistLoaded] = useState(false);
  
  // UI Modal & Tab States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
  const [manualIdInput, setManualIdInput] = useState('');
  
  // Feedback UI State (Toasts, Popups)
  const [lastScannedStudent, setLastScannedStudent] = useState(null); 
  const [aiProcessing, setAiProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null); 
  const [debugLogs, setDebugLogs] = useState([]);

  // ==========================================
  // REFS (Mutable values that don't trigger re-renders)
  // ==========================================
  const canvasRef = useRef(null);
  const videoRef = useRef(null); 
  const activityFeedRef = useRef(null);
  
  // Interval Refs for cleanup
  const detectionLoopRef = useRef(null); 
  const drawLoopRef = useRef(null); 
  const diagnosticsLoopRef = useRef(null);
  
  // File Input Refs
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  // AI Calculation Refs
  const detectedFacesRef = useRef([]); 
  
  // SESSION TRACKING REFS (Critical for logic)
  const processedIdsRef = useRef(new Set()); // PERMANENT TRACKING (Single Scan Mode)
  const lastScanTimeRef = useRef({}); // COOLDOWN TRACKING (Rate Limiting)

  // ==========================================
  // THEME ENGINE (MATCHING SCREENSHOTS)
  // ==========================================
  
  const theme = {
    bgMain: darkMode ? '#111827' : '#f3f4f6', 
    textPrimary: darkMode ? '#ffffff' : '#1f2937', 
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    
    // Cards & Panels
    panelBg: darkMode ? '#1f2937' : '#ffffff',
    panelBorder: darkMode ? '#374151' : '#e5e7eb',
    
    // Modal Specifics
    modalBg: darkMode ? '#1f2937' : '#ffffff',
    modalHeaderBorder: darkMode ? '#374151' : '#e5e7eb',
    
    // Inputs
    inputBg: darkMode ? '#111827' : '#f9fafb',
    inputBorder: darkMode ? '#4b5563' : '#d1d5db',
    
    // Accents
    accentBg: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
    shadow: darkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };

  /**
   * LOGGER: Internal System Logging
   * Pushes logs to the debug panel state array.
   */
  const logSystem = (type, message, data = null) => {
      const entry = {
          time: getFormattedTime(),
          type: type.toUpperCase(),
          message: message,
          data: data ? JSON.stringify(data) : ''
      };
      setDebugLogs(prev => [entry, ...prev].slice(0, 100)); // Keep last 100 logs
      
      if (type === 'ERROR') {
        console.error(`[${entry.type}] ${message}`, data);
      } else {
        console.log(`[${entry.type}] ${message}`, data || '');
      }
  };

  // ==========================================
  // INITIALIZATION EFFECTS
  // ==========================================

  // Update event info if prop changes
  useEffect(() => {
    if (propEvent) setCurrentEvent(propEvent);
  }, [propEvent]);

  // Main Boot Effect
  useEffect(() => {
    let isMounted = true;

    // Start system uptime counter
    const startTime = Date.now();
    if(diagnosticsLoopRef.current) clearInterval(diagnosticsLoopRef.current);
    
    diagnosticsLoopRef.current = setInterval(() => {
        const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
        setSystemHealth(prev => ({
            ...prev,
            uptime: uptimeSeconds
        }));
    }, 1000);

    const testModelPath = async () => {
      logSystem('INFO', 'Network Check: Verifying CDN accessibility...');
      return CDN_MODEL_URL;
    };

    /**
      * Main Boot Sequence
      * 1. Load Local Storage Data (Persistence)
      * 2. Load AI Models from CDN
      * 3. Warm up detection engine
      */
    const bootSystem = async () => {
      try {
        logSystem('BOOT', 'Initializing SparrowFlow Core System...');
        setSystemHealth(prev => ({ ...prev, status: 'Locating Model Files...' }));

        // Phase 1: Persistence
        loadPersistenceLayer();

        // Phase 2: Model Acquisition
        const modelPath = await testModelPath();
        setSystemHealth(prev => ({ ...prev, status: 'Loading Neural Nets...' }));

        // Phase 3: Network Loading (Sequential for safety)
        logSystem('LOAD', `Requesting SSD MobileNet V1 from ${modelPath}...`);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath);

        logSystem('LOAD', 'Requesting Tiny Face Detector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);

        logSystem('LOAD', 'Requesting Face Landmarks 68-Point...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);

        logSystem('LOAD', 'Requesting Face Recognition ResNet...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);

        if (isMounted) {
            setModelsLoaded(true);
            setSystemHealth(prev => ({ ...prev, status: 'System Online' }));
            logSystem('SUCCESS', 'All Neural Networks Loaded & Ready.');
        }

      } catch (err) {
        if (isMounted) {
            logSystem('ERROR', 'Model Load Failed', err.message);
            console.error('Full error details:', err);
            
            setError(`Failed to load AI models. Error: ${err.message}`);
            setSystemHealth(prev => ({ ...prev, status: 'System Failure' }));
        }
      }
    };

    bootSystem();

    // Cleanup on unmount
    return () => {
        isMounted = false;
        stopAllLoops();
        if(diagnosticsLoopRef.current) clearInterval(diagnosticsLoopRef.current);
    };
  }, []);

  // ==========================================
  // DATA PERSISTENCE LAYER
  // ==========================================

  const loadPersistenceLayer = () => {
    try {
        // 1. Load Students CSV Data
        const rawMasterlist = localStorage.getItem('sparrow_masterlist');
        if (rawMasterlist) {
            const parsedList = JSON.parse(rawMasterlist);
            setStudentMasterlist(parsedList);
            setMasterlistLoaded(parsedList.length > 0);
            logSystem('DATA', `Hydrated ${parsedList.length} student records from local storage.`);
        } else {
            logSystem('DATA', 'No existing masterlist found.');
        }

        // 2. Load Biometric Data (Face Descriptors)
        const rawFaces = localStorage.getItem('sparrow_faces');
        if (rawFaces) {
            const parsedFaces = JSON.parse(rawFaces);
            const descriptors = parsedFaces.map(d => new faceapi.LabeledFaceDescriptors(
                d.label,
                d.descriptors.map(desc => new Float32Array(desc))
            ));
            
            if (descriptors.length > 0) {
                const matcher = new faceapi.FaceMatcher(descriptors, CONFIDENCE_THRESHOLD);
                setFaceMatcher(matcher);
                setLabeledDescriptors(descriptors);
                logSystem('AI', `Rehydrated ${descriptors.length} biometric profiles.`);
            }
        }

        // 3. Load Active Attendance Session (Persist on Refresh)
        const rawSession = localStorage.getItem('sparrow_session_log');
        const rawProcessed = localStorage.getItem('sparrow_processed_ids');
        
        if (rawSession) {
            const parsedSession = JSON.parse(rawSession);
            setLocalRecentCheckIns(parsedSession); // Restoring visual feed
            logSystem('SESSION', `Restored ${parsedSession.length} check-ins from previous session.`);
        }

        if (rawProcessed) {
            const parsedIds = JSON.parse(rawProcessed);
            processedIdsRef.current = new Set(parsedIds); // Restoring logic set
        }

    } catch (e) {
        logSystem('CRITICAL', 'Storage Corruption Detected', e);
        setError("Warning: Local database integrity check failed. Please clear DB.");
    }
  };

  const savePersistenceLayer = (masterlist, descriptors) => {
      try {
          if (masterlist) {
              localStorage.setItem('sparrow_masterlist', JSON.stringify(masterlist));
              setStudentMasterlist(masterlist);
              setMasterlistLoaded(true);
              logSystem('SAVE', 'Masterlist saved to storage');
          }
          
          if (descriptors) {
              const serializable = descriptors.map(d => ({
                  label: d.label,
                  descriptors: d.descriptors.map(desc => Array.from(desc))
              }));
              localStorage.setItem('sparrow_faces', JSON.stringify(serializable));
              
              setLabeledDescriptors(descriptors);
              const newMatcher = new faceapi.FaceMatcher(descriptors, CONFIDENCE_THRESHOLD);
              setFaceMatcher(newMatcher);
              logSystem('SAVE', `Database committed: ${descriptors.length} face profiles`);
          }
      } catch (e) {
          logSystem('ERROR', 'Save Failed - Quota Exceeded?', e);
          setError("Database Full: Could not save new records. Browser storage limit reached.");
      }
  };

  // ==========================================
  // FILE PROCESSING HANDLERS
  // ==========================================

  const processCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    logSystem('UPLOAD', `Parsing CSV file: ${file.name}`);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const students = [];
        
        // Skip header row (i=1)
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].trim();
          if (!row) continue;

          // Split by comma, handling potential quotes
          const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          
          if(cols[0]) {
             // Clean up quotes if present
             const cleanID = cols[0].replace(/['"]+/g, '').trim();
             
             students.push({
                 studentNumber: cleanID, 
                 firstName: cols[1]?.replace(/['"]+/g, '').trim() || 'Student',
                 lastName: cols[2]?.replace(/['"]+/g, '').trim() || '',
                 middleInitial: cols[3]?.replace(/['"]+/g, '').trim() || '',
                 email: cols[4]?.replace(/['"]+/g, '').trim() || '',
                 course: cols[5]?.replace(/['"]+/g, '').trim() || 'N/A',
                 yearLevel: cols[6]?.replace(/['"]+/g, '').trim() || 'N/A',
                 profilePhoto: null // Will be populated by image upload
             });
          }
        }

        savePersistenceLayer(students, null);
        setSuccessMessage(`Successfully imported ${students.length} students.`);
        logSystem('IMPORT', `CSV Import: ${students.length} rows processed.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
      } catch (err) { 
          logSystem('ERROR', 'CSV Parse Error', err);
          setError('Failed to parse CSV file. Ensure standard format.'); 
      }
    };
    
    reader.readAsText(file);
  };

  const processImageUpload = async (event) => {
    if(!masterlistLoaded) { 
        setError("Logic Gate: Please upload the Masterlist (CSV) before photos.");
        setTimeout(() => setError(null), 3000);
        return; 
    }
    if(!modelsLoaded) { 
        setError("System Loading: AI Models not ready.");
        setTimeout(() => setError(null), 3000);
        return; 
    }
    
    const files = Array.from(event.target.files);
    if(files.length === 0) return;

    setAiProcessing(true);
    setError(null);
    logSystem('PROCESS', `Starting batch processing for ${files.length} images.`);
    
    const newDescriptors = [...labeledDescriptors];
    const updatedMasterlist = [...studentMasterlist];
    
    let successCount = 0;
    let failCount = 0;

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setProcessingStatus(`Registering Face ${i + 1}/${files.length}...`);
            
            try {
                // Extract ID from filename (e.g. "UA2023.jpg" -> "ua2023")
                const rawFilename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const normalizedFileID = normalizeID(rawFilename); 
                
                // Find matching student
                const studentIndex = updatedMasterlist.findIndex(
                    s => normalizeID(s.studentNumber) === normalizedFileID
                );
                
                if (studentIndex !== -1) {
                    // Convert file to image element
                    const img = await faceapi.bufferToImage(file);
                    
                    // Detect face
                    const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options())
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                    
                    if (detection) {
                        const targetID = updatedMasterlist[studentIndex].studentNumber;

                        // Check if descriptor already exists
                        const existingDescIndex = newDescriptors.findIndex(d => d.label === targetID);
                        
                        if (existingDescIndex !== -1) {
                            // Update existing
                            const currentDescs = newDescriptors[existingDescIndex].descriptors;
                            newDescriptors[existingDescIndex] = new faceapi.LabeledFaceDescriptors(
                                targetID, 
                                [...currentDescs, detection.descriptor]
                            );
                        } else {
                            // Create new
                            newDescriptors.push(new faceapi.LabeledFaceDescriptors(
                                targetID, 
                                [detection.descriptor]
                            ));
                        }

                        // Convert image to base64 for display in activity feed
                        // FIX: We do this to ensure image persists even if file object is lost
                        const base64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(file);
                        });
                        updatedMasterlist[studentIndex].profilePhoto = base64;
                        
                        successCount++;
                        logSystem('SUCCESS', `Registered biometrics for ${targetID}`);
                    } else {
                        failCount++;
                        logSystem('WARN', `${file.name}: No face detected in image.`);
                    }
                } else {
                    failCount++;
                    logSystem('WARN', `${file.name}: ID not found in Masterlist.`);
                }
            } catch (e) { 
                failCount++;
                logSystem('ERROR', `Failed processing ${file.name}`, e.message);
            }
        }

        if (successCount > 0) {
            savePersistenceLayer(updatedMasterlist, newDescriptors);
            setSuccessMessage(`Registered ${successCount} biometrics successfully.`);
            
            if (failCount > 0) {
                logSystem('WARN', `Batch completed with ${failCount} errors.`);
            } else {
                setTimeout(() => setShowUploadModal(false), 1500);
            }
            setTimeout(() => setSuccessMessage(null), 3000);
        } else {
            setError("Zero successful registrations. Check filename matching.");
            setTimeout(() => setError(null), 3000);
        }

    } catch (err) { 
        logSystem('ERROR', 'Batch Processing Crashed', err);
        setError("Critical Processing Error during batch job."); 
        setTimeout(() => setError(null), 3000);
    } finally { 
        setAiProcessing(false); 
        setProcessingStatus(""); 
    }
  };

  /**
   * CORE FUNCTION: Attendance Registration
   * Handles the logic when a valid face matches a student.
   * Updates the UI feed and logs the event.
   */
  const registerAttendance = (student, method, confidenceScore = 1.0) => {
      const now = Date.now();
      const id = student.studentNumber;
      
      /**
       * CHECK-OUT LOGIC & COOLDOWN
       * 1. Enforce cooldown to prevent jitter (accidental double scan).
       * 2. Determine if the student is currently Checked-In or Checked-Out.
       */
      if (lastScanTimeRef.current[id] && (now - lastScanTimeRef.current[id] < 5000)) {
          setWarningMessage(`Please wait before scanning again.`);
          setTimeout(() => setWarningMessage(null), 2000);
          return; // COOLDOWN BLOCK
      }

      lastScanTimeRef.current[id] = now;

      // --- LOGIC: DETERMINE CHECK-IN VS CHECK-OUT ---
      // We look at the most recent record for this student in our local session history.
      const studentHistory = localRecentCheckIns.filter(r => r.studentId === student.studentNumber);
      // Since localRecentCheckIns adds new items to the front (index 0), index 0 is the latest.
      const lastStatus = studentHistory.length > 0 ? studentHistory[0].status : 'checked-out'; // Default to checked-out if no history
      
      let newStatus = 'checked-in';
      let statusLabel = 'IN';
      
      // If they are currently checked-in, the next scan is a check-out
      if (lastStatus === 'checked-in') {
          newStatus = 'checked-out';
          statusLabel = 'OUT';
      }

      // Construct Record Object
      const newRecord = {
          id: now,
          studentId: student.studentNumber,
          studentName: `${student.firstName} ${student.lastName}`, 
          firstName: student.firstName,
          lastName: student.lastName,
          program: student.course, 
          course: student.course || student.program || 'N/A', 
          year: student.yearLevel, 
          yearLevel: student.yearLevel || student.year || 'N/A',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(), 
          method: method,
          confidence: (confidenceScore * 100).toFixed(0),
          faceDetected: true,
          photo: student.profilePhoto,
          status: newStatus // <--- NEW FIELD: 'checked-in' or 'checked-out'
      };

      console.log(`NEW RECORD: ${student.studentNumber} is checking ${statusLabel}`, newRecord);

      // --- SEND TO DASHBOARD ---
      if (onNewScan) {
          onNewScan(newRecord);
      }

      // UPDATE STATE (This is what triggers the UI update)
      setLocalRecentCheckIns(prev => { 
          const updated = [newRecord, ...prev];
          
          // Auto-Save Session to Local Storage
          try {
              localStorage.setItem('sparrow_session_log', JSON.stringify(updated.slice(0, 500))); // Persist last 500 records
              localStorage.setItem('sparrow_processed_ids', JSON.stringify(Array.from(processedIdsRef.current)));
          } catch(e) {
              console.error("Failed to persist session:", e);
          }

          // Keep only last 100 records in UI to manage memory
          return updated.slice(0, 100);
      });
      
      // Update counts only if it's a check-in (optional, or count check-outs differently)
      // Usually attendance count tracks distinct people present. 
      // If Checking Out, we might technically want to decrease count, but usually dashboards track "Unique entries".
      // We will increment the activity count regardless.
      setLocalAttendanceCount(prev => prev + 1);
      
      setLastScannedStudent(newRecord);
      
      // Dynamic Success Message
      if (newStatus === 'checked-in') {
          setSuccessMessage(`Welcome! Checked IN: ${student.firstName}`);
      } else {
          setSuccessMessage(`Goodbye! Checked OUT: ${student.firstName}`);
      }
      
      logSystem('CHECK-IN', `${statusLabel}: Verified ${student.studentNumber} via ${method}`);

      // Auto-scroll activity feed to top
      setTimeout(() => {
        if (activityFeedRef.current) {
          activityFeedRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }, 100);

      // Clear the popup after 3 seconds
      setTimeout(() => setLastScannedStudent(null), 3000);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Link to prop function if exists (For App.jsx state sync)
      if(onQRScan) onQRScan(newRecord);
  };

  /**
   * SESSION MANAGEMENT
   * Clears the current session's attendance list without deleting the database.
   */
  const clearSession = () => {
    if(window.confirm("Clear current attendance session? This removes the list but keeps the student database.")) {
        setLocalRecentCheckIns([]); // Clear local UI state
        setLocalAttendanceCount(0);
        processedIdsRef.current.clear();
        
        // Remove from persistent storage
        localStorage.removeItem('sparrow_session_log');
        localStorage.removeItem('sparrow_processed_ids');
        
        logSystem('ADMIN', 'Attendance Session Cleared');
        setSuccessMessage("Session Cleared. Ready for new scans.");
        setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // ==========================================
  // CAMERA & AI LOOPS
  // ==========================================

  const toggleScanState = async () => {
      if (isScanning) {
          setIsScanning(false);
          stopAllLoops();
          setSystemHealth(prev => ({ ...prev, status: 'Paused', fps: 0 }));
      } else {
          if (!modelsLoaded) {
              setError("Cannot start: AI Models not loaded yet");
              setTimeout(() => setError(null), 3000);
              return;
          }
          setIsScanning(true);
          await activateCamera();
      }
  };

  const activateCamera = async () => {
    try {
      if (videoRef.current) {
          logSystem('CAMERA', 'Requesting stream access...');
          
          const stream = await navigator.mediaDevices.getUserMedia({ 
              video: VIDEO_CONFIG 
          });
          
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          setSystemHealth(prev => ({ ...prev, status: 'Active Scanning' }));
          
          initializeRecognitionLoop();
          initializeDrawingLoop();
      }
    } catch (err) { 
        logSystem('ERROR', 'Camera Access Denied', err);
        setError("Hardware Access Error: Check camera permissions.");
        setIsScanning(false);
        setTimeout(() => setError(null), 3000);
    }
  };

  const stopAllLoops = () => {
    // Stop Video Stream
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    
    // Clear Intervals
    if(detectionLoopRef.current) clearInterval(detectionLoopRef.current);
    if(drawLoopRef.current) clearInterval(drawLoopRef.current);
  };

  /**
   * AI LOOP: Face Detection & Recognition
   * Runs roughly every 100ms to detect faces and match them against the DB.
   */
  const initializeRecognitionLoop = () => {
    if(detectionLoopRef.current) clearInterval(detectionLoopRef.current);
    
    detectionLoopRef.current = setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended && modelsLoaded) {
        
        const startTime = performance.now();

        // 1. Detect faces
        const detections = await faceapi.detectAllFaces(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }) 
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

        const latency = performance.now() - startTime;
        setDetectionLatency(Math.round(latency));

        // 2. Resize results to match video dimensions
        const displaySize = { 
            width: videoRef.current.videoWidth || 640, 
            height: videoRef.current.videoHeight || 480 
        };
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        detectedFacesRef.current = resizedDetections; 
        setFaceDetected(resizedDetections.length > 0);

        // 3. Match against Database
        if (faceMatcher && resizedDetections.length > 0) {
            resizedDetections.forEach(result => {
                const bestMatch = faceMatcher.findBestMatch(result.descriptor);
                
                // If match found
                if (bestMatch.label !== 'unknown') {
                    const student = studentMasterlist.find(s => s.studentNumber === bestMatch.label);
                    
                    if (student) {
                        const confidence = 1 - bestMatch.distance;
                        registerAttendance(student, 'Face Recognition', confidence);
                    }
                }
            });
        }
      }
    }, 100);
  };

  /**
   * UI LOOP: Canvas Drawing
   * Runs at ~30 FPS to draw bounding boxes and labels over the video.
   */
  const initializeDrawingLoop = () => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let frameCount = 0; 
    let lastTime = Date.now();

    if(drawLoopRef.current) clearInterval(drawLoopRef.current);
    
    drawLoopRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        
        // Clear previous frame
        const width = 640;
        const height = 450;
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        
        const results = detectedFacesRef.current || [];
        
        results.forEach(res => {
            const { box } = res.detection;
            
            let label = "Unknown";
            let color = "#ef4444"; // Red for unknown

            if (faceMatcher) {
                const match = faceMatcher.findBestMatch(res.descriptor);
                
                if (match.label !== 'unknown') {
                    const st = studentMasterlist.find(s => s.studentNumber === match.label);
                    if (st) {
                        // --- VISUAL STATUS CHECK ---
                        // Checks if student is in the list passed from App.jsx to show "Done" status
                        // We check local state to account for rapid in/outs
                        const studentHistory = localRecentCheckIns.filter(p => p.studentId === st.studentNumber);
                        const lastRecord = studentHistory.length > 0 ? studentHistory[0] : null;
                        const isCheckedIn = lastRecord && lastRecord.status !== 'checked-out';

                        label = isCheckedIn ? `${st.firstName} (IN)` : `${st.firstName} (OUT)`;
                        color = isCheckedIn ? "#10b981" : "#f59e0b"; // Green if IN, Orange if OUT
                    } else {
                        label = match.label;
                    }
                } else {
                    const conf = Math.round((1 - match.distance) * 100);
                    label = `Unknown (${conf}%)`;
                }
            } else {
                // Shows "DB Empty" if no faces loaded in Matcher
                label = "DB Empty"; 
                color = "#f59e0b";
            }
            
            const drawBox = new faceapi.draw.DrawBox(box, { label: label, boxColor: color, lineWidth: 2 });
            drawBox.draw(canvas);
        });

        // FPS Counter Logic
        frameCount++; 
        const now = Date.now();
        if (now - lastTime >= 1000) { 
            setSystemHealth(prev => ({ ...prev, fps: frameCount }));
            frameCount = 0; 
            lastTime = now; 
        }
      }
    }, 33);
  };

  // ==========================================
  // UI RENDER HELPERS
  // ==========================================

  const exportCSVLogs = () => {
    if(localRecentCheckIns.length === 0) { // FIX: Use correct state
        setError("Log is empty. Nothing to export.");
        setTimeout(() => setError(null), 3000);
        return;
    }
    const csvHeader = "ID,Name,Program,Year,Time,Method,Confidence,Status\n";
    const csvRows = localRecentCheckIns.map(c => 
        `${c.studentId},${c.firstName} ${c.lastName},${c.program},${c.year},${c.time},${c.method},${c.confidence},${c.status}`
    ).join("\n");
    
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); 
    link.href = url; 
    link.download = `Attendance_${Date.now()}.csv`; 
    link.click();
  };

  /**
   * Helper function to handle broken image links
   * Automatically replaces broken blobs with a placeholder.
   */
  const handleImageError = (e) => {
    e.target.onerror = null; 
    e.target.style.display = 'none'; 
    e.target.parentNode.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
  };

  const renderStatusBar = () => (
    <div style={{
      background: theme.panelBg,
      border: `1px solid ${theme.panelBorder}`,
      borderRadius: '16px',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      fontSize: '13px',
      boxShadow: theme.shadow,
      color: theme.textPrimary,
      transition: 'background 0.3s, color 0.3s',
      background: darkMode ? theme.panelBg : 'linear-gradient(to right, #ffffff, #f8fafc)'
    }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{
                padding: '8px',
                background: systemHealth.status.includes('Active') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px'
            }}>
                <Activity size={18} color={systemHealth.status.includes('Active') ? '#10b981' : '#f59e0b'}/> 
            </div>
            <div>
                <div style={{fontSize: '12px', color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>System Status</div>
                <div style={{fontSize: '14px', fontWeight: '700', color: theme.textPrimary}}>{systemHealth.status}</div>
            </div>
        </div>
        <div style={{height: '30px', width: '1px', background: theme.borderColor}}></div>
        <div style={{display: 'flex', gap: '32px'}}>
            <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '11px', color: theme.textSecondary, fontWeight: '600'}}>FPS</div>
                <div style={{fontSize: '16px', fontWeight: '700', color: '#3b82f6'}}>{systemHealth.fps}</div>
            </div>
            <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '11px', color: theme.textSecondary, fontWeight: '600'}}>LATENCY</div>
                <div style={{fontSize: '16px', fontWeight: '700', color: '#8b5cf6'}}>{detectionLatency}ms</div>
            </div>
            <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '11px', color: theme.textSecondary, fontWeight: '600'}}>DATABASE</div>
                <div style={{fontSize: '16px', fontWeight: '700', color: '#f59e0b'}}>{labeledDescriptors.length}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: 0.5}} onClick={() => setShowDebugPanel(!showDebugPanel)}>
                 <Server size={16} color={theme.textSecondary}/>
            </div>
        </div>
    </div>
  );

  const renderDebugPanel = () => {
      if (!showDebugPanel) return null;
      return (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: theme.bgMain,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: '12px',
            padding: '20px',
            zIndex: 10000,
            width: '600px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            color: theme.textPrimary
          }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${theme.borderColor}`}}>
                <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Activity size={18}/> System Diagnostics
                </h3>
                <X size={18} onClick={()=>setShowDebugPanel(false)} style={{cursor: 'pointer'}}/>
              </div>
              <div style={{overflow: 'auto', flex: 1}}>
                  {debugLogs.map((log, i) => (
                      <div key={i} style={{
                        padding: '8px',
                        marginBottom: '4px',
                        background: log.type === 'ERROR' ? 'rgba(239, 68, 68, 0.1)' : log.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : theme.accentBg,
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        borderLeft: log.type === 'ERROR' ? '2px solid #ef4444' : log.type === 'SUCCESS' ? '2px solid #10b981' : '2px solid transparent',
                        color: theme.textPrimary
                      }}>
                          <span style={{color: theme.textSecondary, marginRight: '12px'}}>{log.time}</span>
                          <span style={{color: log.type === 'ERROR' ? '#ef4444' : log.type === 'SUCCESS' ? '#10b981' : '#60a5fa', fontWeight: 'bold', marginRight: '12px'}}>[{log.type}]</span>
                          <span>{log.message}</span>
                          {log.data && <div style={{marginTop: '4px', color: theme.textSecondary, fontSize: '11px', whiteSpace: 'pre-wrap'}}>{log.data}</div>}
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div style={{
        padding: '0 20px 20px 20px', 
        background: 'transparent', 
        minHeight: '100%', 
        color: theme.textPrimary, 
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'background 0.3s, color 0.3s'
    }}>
      <video ref={videoRef} style={{ display: 'none' }} muted playsInline width={640} height={480} />
      
      {/* ERROR TOAST */}
      {error && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', background: '#fee2e2', border: '1px solid #ef4444',
          borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10000, maxWidth: '400px', color: '#b91c1c', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
            <AlertTriangle size={20}/> <span style={{flex: 1, fontSize: '14px', fontWeight: '500'}}>{error}</span> 
            <button onClick={()=>setError(null)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c'}}><X size={16}/></button>
        </div>
      )}
      
      {/* SUCCESS TOAST */}
      {successMessage && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', background: '#dcfce7', border: '1px solid #22c55e',
          borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10000, maxWidth: '400px', color: '#15803d', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', animation: 'slideIn 0.3s ease-out'
        }}>
            <CheckCircle size={20}/> <span style={{flex: 1, fontSize: '14px', fontWeight: '500'}}>{successMessage}</span>
        </div>
      )}

      {/* WARNING TOAST (Used for Already Scanned) */}
      {warningMessage && (
        <div style={{
          position: 'fixed', top: '80px', right: '20px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308',
          borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10000, maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', animation: 'slideIn 0.3s ease-out', color: '#eab308'
        }}>
            <AlertTriangle size={20} color="#eab308"/> <span style={{flex: 1, fontSize: '14px'}}>{warningMessage}</span>
        </div>
      )}

      {/* RECENT SCAN POPUP CARD */}
      {lastScannedStudent && (
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: theme.panelBg, border: `1px solid ${theme.borderColor}`, borderRadius: '16px', padding: '24px', zIndex: 10000, minWidth: '350px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', animation: 'pulse 2s infinite', color: theme.textPrimary
          }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
                    background: theme.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
                  }}>
                      {lastScannedStudent.photo ? <img src={lastScannedStudent.photo} alt="Student" onError={handleImageError} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <User size={40} color={theme.textSecondary}/>}
                  </div>
                  <div style={{flex: 1}}>
                      <h2 style={{margin: 0, fontSize: '20px', fontWeight: '700'}}>{lastScannedStudent.firstName} {lastScannedStudent.lastName}</h2>
                      <p style={{margin: '4px 0', color: theme.textSecondary, fontSize: '14px'}}>{lastScannedStudent.studentId}</p>
                      <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                          <span style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.2)'}}>{lastScannedStudent.program}</span>
                          <span style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
                            <CheckCircle size={12}/> {lastScannedStudent.status === 'checked-out' ? 'Checked OUT' : 'Verified'}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* SYSTEM CONFIGURATION MODAL (MATCHING SCREENSHOTS) */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: theme.modalBg, borderRadius: '16px', width: '600px', maxHeight: '85vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', color: theme.textPrimary
          }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.modalBg, borderBottom: 'none' }}>
                <h2 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: '800', color: theme.textPrimary}}>
                  <Settings size={28}/> System Configuration
                </h2>
                <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '4px' }}>
                    <X size={24}/>
                </button>
            </div>
            
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `2px solid ${theme.modalHeaderBorder}`, background: theme.modalBg }}>
                <button onClick={()=>setActiveTab('upload')} style={{
                      flex: 1, padding: '16px', background: 'none', border: 'none',
                      borderBottom: activeTab==='upload' ? '2px solid #3b82f6' : '2px solid transparent',
                      color: activeTab==='upload' ? '#3b82f6' : theme.textSecondary,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      fontWeight: activeTab==='upload' ? '600' : '500', fontSize: '15px'
                    }}>
                    <Upload size={18}/> Upload Data
                </button>
                <button onClick={()=>setActiveTab('manual')} style={{
                      flex: 1, padding: '16px', background: 'none', border: 'none',
                      borderBottom: activeTab==='manual' ? '2px solid #3b82f6' : '2px solid transparent',
                      color: activeTab==='manual' ? '#3b82f6' : theme.textSecondary,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      fontWeight: activeTab==='manual' ? '600' : '500', fontSize: '15px'
                    }}>
                    <Search size={18}/> Manual Entry
                </button>
            </div>
            
            {/* Modal Content */}
            <div style={{padding: '32px', overflow: 'auto', flex: 1, background: theme.modalBg}}>
                {activeTab === 'upload' ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                        <div>
                            <label style={{display: 'block', marginBottom: '12px', fontWeight: '700', fontSize: '16px', color: theme.textPrimary}}>1. Masterlist (CSV)</label>
                            <div style={{ border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', background: theme.inputBg }}>
                                <label style={{ background: theme.inputBorder, padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginRight: '16px', color: theme.textPrimary, border: `1px solid ${theme.borderColor}` }}>
                                    Choose File 
                                    <input ref={fileInputRef} type="file" accept=".csv" onChange={processCSVUpload} style={{display: 'none'}} />
                                </label>
                                <span style={{fontSize: '14px', color: theme.textSecondary}}>No file chosen</span>
                            </div>
                            <small style={{color: theme.textSecondary, display: 'block', marginTop: '8px', fontSize: '13px'}}>Format: ID, First, Last, MI, Email, Course, Year</small>
                        </div>
                        
                        <div>
                            <label style={{display: 'block', marginBottom: '12px', fontWeight: '700', fontSize: '16px', color: theme.textPrimary}}>2. Biometric Data (Photos)</label>
                            <div style={{ border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', background: theme.inputBg, opacity: !masterlistLoaded || aiProcessing ? 0.6 : 1 }}>
                                <label style={{ background: theme.inputBorder, padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: (!masterlistLoaded || aiProcessing) ? 'not-allowed' : 'pointer', marginRight: '16px', color: theme.textPrimary, border: `1px solid ${theme.borderColor}` }}>
                                    Choose Files 
                                    <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={processImageUpload} disabled={!masterlistLoaded || aiProcessing} style={{display: 'none'}} />
                                </label>
                                <span style={{fontSize: '14px', color: theme.textSecondary}}>No file chosen</span>
                            </div>
                            <small style={{color: theme.textSecondary, display: 'block', marginTop: '8px', fontSize: '13px'}}>Filename must match Student ID (e.g., 2023-100.jpg)</small>
                        </div>
                        
                        {aiProcessing && (
                            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', fontSize: '14px' }}>
                                <RefreshCw size={18} className="spin"/> <span>{processingStatus}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label style={{display: 'block', marginBottom: '16px', fontWeight: '700', fontSize: '16px', color: theme.textPrimary}}>Student ID Lookup</label>
                        <div style={{display: 'flex', gap: '12px'}}>
                            <div style={{flex: 1, position: 'relative'}}>
                                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }}/>
                                <input type="text" placeholder="Enter Student ID..." value={manualIdInput} onChange={(e)=>setManualIdInput(e.target.value)} 
                                  onKeyPress={(e)=>e.key==='Enter' && document.getElementById('manual-btn').click()}
                                  style={{ width: '100%', padding: '14px 14px 14px 48px', background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', color: theme.textPrimary, outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <button id="manual-btn" onClick={()=>{ const clean = normalizeID(manualIdInput); const found = studentMasterlist.find(st => normalizeID(st.studentNumber) === clean); if(found) { registerAttendance(found, 'Manual Entry'); setManualIdInput(''); } else { setError(`ID '${manualIdInput}' Not Found. Check CSV.`); setTimeout(() => setError(null), 3000); } }}
                                style={{ padding: '0 24px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                                <ArrowRight size={24}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Modal Footer (Buttons Matched) */}
            <div style={{ padding: '24px 32px', background: theme.inputBg, borderTop: `1px solid ${theme.modalHeaderBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{display: 'flex', gap: '12px'}}>
                  <button onClick={clearSession} style={{ padding: '12px 20px', background: '#d97706', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                      <RotateCcw size={18}/> Clear Session
                  </button>
                  <button onClick={()=>{ if(window.confirm("WARNING: This deletes all student data. Are you sure?")) { localStorage.clear(); window.location.reload(); } }} style={{ padding: '12px 20px', background: '#7f1d1d', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                      <Trash2 size={18}/> Reset Database
                  </button>
                </div>
                <button onClick={()=>setShowUploadModal(false)} style={{ padding: '12px 32px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                    Done
                </button>
            </div>
          </div>
        </div>
      )}

      {renderDebugPanel()}

      {/* MAIN DASHBOARD LAYOUT */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', height: '100%', alignItems: 'start'}}>
        
        {/* LEFT COLUMN: CAMERA & CONTROLS */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
          
          {renderStatusBar()}

          {/* VIDEO FEED CONTAINER */}
          <div style={{
            background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, borderRadius: '16px', overflow: 'hidden', boxShadow: theme.shadow
          }}>
            <div style={{
              padding: '16px 24px', borderBottom: `1px solid ${theme.panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.accentBg
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                  <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '700', color: theme.textPrimary}}>
                    <Camera size={20} color="#3b82f6" /> Live Recognition Feed
                  </h3>
                  {isScanning && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', animation: 'blink 1s infinite' }}></span> LIVE
                    </div>
                  )}
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                  <button onClick={() => setShowCamera(!showCamera)} style={{ background: theme.panelBg, border: `1px solid ${theme.borderColor}`, borderRadius: '8px', padding: '8px', color: theme.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} title="Toggle Camera View">
                    {showCamera ? <Eye size={18}/> : <EyeOff size={18}/>}
                  </button>
                  <button onClick={() => setShowUploadModal(true)} style={{ background: theme.panelBg, border: `1px solid ${theme.borderColor}`, borderRadius: '8px', padding: '8px', color: theme.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} title="Settings">
                      <Settings size={18}/>
                  </button>
              </div>
            </div>
            
            <div style={{position: 'relative', background: '#000', minHeight: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {showCamera ? (
                  <canvas ref={canvasRef} width={640} height={450} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
              ) : (
                  <div style={{ width: '100%', height: '480px', background: theme.bgMain, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <EyeOff size={64} color={theme.textSecondary} style={{opacity: 0.5}}/>
                      <p style={{color: theme.textSecondary, fontWeight: '500'}}>Camera Feed Paused</p>
                  </div>
              )}
              
              <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none'}}>
                  {faceDetected && (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(16, 185, 129, 0.9)', backdropFilter: 'blur(4px)', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        FACE DETECTED
                    </div>
                  )}
              </div>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', gap: '16px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc' }}>
              <button onClick={toggleScanState} style={{
                  flex: 1, padding: '14px', background: isScanning ? '#fee2e2' : '#dcfce7', border: isScanning ? '1px solid #fca5a5' : '1px solid #86efac', 
                  borderRadius: '10px', color: isScanning ? '#b91c1c' : '#15803d', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', fontSize: '14px'
                }}>
                {isScanning ? <><PauseCircle size={20} /> PAUSE SYSTEM</> : <><PlayCircle size={20} /> START RECOGNITION</>}
              </button>
              <button onClick={exportCSVLogs} style={{
                  padding: '14px 24px', background: theme.cardBg, border: `1px solid ${theme.borderColor}`, borderRadius: '10px', color: theme.textPrimary, 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                  <Download size={20} /> Export Log
              </button>
            </div>
            
            {/* AI PIPELINE STATUS WIDGETS */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '24px', borderTop: `1px solid ${theme.panelBorder}`}}>
                <div style={{
                    padding: '24px', background: theme.inputBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px'
                }}>
                    <Camera size={32} color={isScanning ? '#3b82f6' : theme.textSecondary}/>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '16px', fontWeight: '700', color: theme.textPrimary}}>Input Stream</div>
                        <div style={{fontSize: '14px', color: theme.textSecondary}}>{isScanning ? 'Receiving' : 'Standby'}</div>
                    </div>
                </div>

                <div style={{
                    padding: '24px', background: theme.inputBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px'
                }}>
                    <ShieldCheck size={32} color={faceDetected ? '#10b981' : theme.textSecondary}/>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '16px', fontWeight: '700', color: theme.textPrimary}}>Detection</div>
                        <div style={{fontSize: '14px', color: theme.textSecondary}}>{faceDetected ? 'Face Found' : 'Scanning...'}</div>
                    </div>
                </div>

                <div style={{
                    padding: '24px', background: theme.inputBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px'
                }}>
                    <Database size={32} color={labeledDescriptors.length > 0 ? '#f59e0b' : theme.textSecondary}/>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '16px', fontWeight: '700', color: theme.textPrimary}}>Matcher</div>
                        <div style={{fontSize: '14px', color: theme.textSecondary}}>{labeledDescriptors.length} Loaded</div>
                    </div>
                </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVITY FEED */}
        <div>
          <div style={{
            background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, borderRadius: '16px', overflow: 'hidden', height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', boxShadow: theme.shadow
          }}>
            <div style={{
              padding: '20px', borderBottom: `1px solid ${theme.panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.accentBg
            }}>
                <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '700', color: theme.textPrimary}}>
                  <UserCheck size={20} color="#8b5cf6" /> Recent Scans
                </h3>
                <span style={{ background: theme.bgMain, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: theme.textSecondary, border: `1px solid ${theme.borderColor}` }}>
                  {localRecentCheckIns.length} Checked In
                </span>
            </div>
            
            <div style={{flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}} ref={activityFeedRef}>
              {localRecentCheckIns.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: theme.textSecondary, opacity: 0.7 }}>
                    <UserCheck size={48} style={{marginBottom: '16px'}}/>
                    <p style={{fontWeight: '500'}}>Waiting for scans...</p>
                </div>
              ) : (
                localRecentCheckIns.map((c, index) => (
                    <div key={c.id} style={{
                      background: index === 0 ? (darkMode ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4') : theme.cardBg,
                      border: index === 0 ? '1px solid #86efac' : `1px solid ${theme.borderColor}`,
                      borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px',
                      animation: index === 0 ? 'slideInFromRight 0.4s ease-out' : 'none', transition: 'all 0.3s',
                      transform: index === 0 ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: index === 0 ? '0 4px 12px rgba(34, 197, 94, 0.15)' : 'none'
                    }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', background: theme.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)'
                        }}>
                            {c.photo ? <img src={c.photo} alt="student" onError={handleImageError} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <User size={24} color={theme.textSecondary}/>}
                        </div>
                        <div style={{flex: 1, minWidth: 0}}>
                            <div style={{fontWeight: '700', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: theme.textPrimary}}>
                              {c.firstName} {c.lastName}
                            </div>
                            <div style={{fontSize: '12px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '6px'}}>
                              <span>{c.studentId}</span> • <span style={{color: '#3b82f6', fontWeight: '600'}}>{c.program}</span>
                              {/* [ADDED FEATURE] Visual indicator for IN/OUT status */}
                              <span style={{
                                  marginLeft: '4px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  backgroundColor: c.status === 'checked-out' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                  color: c.status === 'checked-out' ? '#ef4444' : '#22c55e',
                                  fontWeight: 'bold',
                                  border: `1px solid ${c.status === 'checked-out' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                              }}>
                                {c.status === 'checked-out' ? 'OUT' : 'IN'}
                              </span>
                            </div>
                        </div>
                        <div style={{textAlign: 'right', flexShrink: 0}}>
                            <div style={{fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: theme.textPrimary}}>{c.time}</div>
                            <div style={{
                              fontSize: '11px', color: '#10b981', fontWeight: '700', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block'
                            }}>
                              {c.confidence}% Match
                            </div>
                        </div>
                    </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInFromRight { from { opacity: 0; transform: translateX(20px) scale(0.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
        
        /* Custom Scrollbar */
        div::-webkit-scrollbar { width: 6px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background: ${darkMode ? '#4b5563' : '#cbd5e1'}; border-radius: 3px; }
        div::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#6b7280' : '#94a3b8'}; }
      `}</style>
    </div>
  );
};

export default CameraView;