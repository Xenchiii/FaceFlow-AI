import { useState, useRef, useEffect } from 'react';

export const useAttendance = () => {
  // --- 1. INITIALIZE STATE FROM LOCAL STORAGE (PERSISTENCE) ---
  // Instead of starting with 0 or [], we check if data exists in the browser first.
  
  const [attendanceCount, setAttendanceCount] = useState(() => {
    try {
      const saved = localStorage.getItem('sparrow_attendanceCount');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) { return 0; }
  });

  const [recentCheckIns, setRecentCheckIns] = useState(() => {
    try {
      const saved = localStorage.getItem('sparrow_recentCheckIns');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [attendanceData, setAttendanceData] = useState(() => {
    try {
      const saved = localStorage.getItem('sparrow_attendanceData');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // COOLDOWN TRACKER: Stores timestamp of last scan per ID to prevent accidental double-scans
  const lastScanTimes = useRef({});

  // --- 2. AUTO-SAVE EFFECTS ---
  // Whenever the variables change, these effects save them to Local Storage immediately.

  useEffect(() => {
    localStorage.setItem('sparrow_attendanceData', JSON.stringify(attendanceData));
  }, [attendanceData]);

  useEffect(() => {
    localStorage.setItem('sparrow_recentCheckIns', JSON.stringify(recentCheckIns));
  }, [recentCheckIns]);

  useEffect(() => {
    localStorage.setItem('sparrow_attendanceCount', attendanceCount.toString());
  }, [attendanceCount]);


  // --- 3. FUNCTIONS ---

  const fetchAttendanceData = async () => {
    // This function acts as a "Reset/Clear" in this context
    if(window.confirm("Are you sure you want to clear all attendance data?")) {
        setLoading(true);
        try {
          setAttendanceData([]);
          setRecentCheckIns([]);
          setAttendanceCount(0);
          lastScanTimes.current = {}; 
          
          // Clear browser storage
          localStorage.removeItem('sparrow_attendanceData');
          localStorage.removeItem('sparrow_recentCheckIns');
          localStorage.removeItem('sparrow_attendanceCount');
          
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
    }
  };

  /**
   * The Master Handler for New Scans (QR or Face)
   * Handles Check-IN and Check-OUT toggling.
   */
  const registerCheckIn = (personData) => {
    const now = Date.now();
    const id = personData.studentId;

    // 1. COOLDOWN CHECK (Prevent accidental double scans within 5 seconds)
    if (lastScanTimes.current[id] && (now - lastScanTimes.current[id] < 5000)) {
        console.log("Scan ignored (Cooldown active)");
        return; 
    }
    lastScanTimes.current[id] = now;

    // 2. CHECK STATUS: Is this person currently inside?
    // We look for the latest record of this student.
    const lastRecordIndex = attendanceData.map(r => r.studentId).lastIndexOf(id);
    const isCurrentlyInside = lastRecordIndex !== -1 && attendanceData[lastRecordIndex].status === 'present';

    if (isCurrentlyInside) {
        // --- CHECK OUT LOGIC ---
        const updatedData = [...attendanceData];
        const recordToUpdate = updatedData[lastRecordIndex];
        
        updatedData[lastRecordIndex] = {
            ...recordToUpdate,
            status: 'checked-out',
            timeOut: new Date().toLocaleTimeString(),
            timestampOut: new Date().toISOString()
        };

        setAttendanceData(updatedData);
        setAttendanceCount(prev => Math.max(0, prev - 1)); // Decrease count

        // Add "OUT" notification to sidebar
        const outRecord = { 
            ...recordToUpdate,
            id: Date.now(), // New ID for the sidebar list animation
            status: 'checked-out', 
            method: 'Check-out',
            time: new Date().toLocaleTimeString() 
        };
        setRecentCheckIns(prev => [outRecord, ...prev].slice(0, 15));

    } else {
        // --- CHECK IN LOGIC ---
        const newRecord = {
            id: now,
            studentId: id,
            name: personData.name || personData.studentName || 'Unknown',
            course: personData.course || 'Unassigned',
            yearLevel: personData.yearLevel || 'N/A',
            time: new Date().toLocaleTimeString(),
            timestamp: new Date().toISOString(),
            status: 'present', // Active status
            method: personData.method || 'Manual',
            photo: personData.photo || null,
            timeOut: null,
            timestampOut: null
        };

        setAttendanceData(prev => [...prev, newRecord]);
        setAttendanceCount(prev => prev + 1); // Increase count
        setRecentCheckIns(prev => [newRecord, ...prev].slice(0, 15));
    }
  };

  const markAttendance = (personId, status) => {
    setAttendanceData((prev) =>
      prev.map((item) => item.id === personId ? { ...item, status } : item)
    );
  };

  return {
    attendanceData,
    attendanceCount,
    recentCheckIns,
    loading,
    error,
    registerCheckIn,
    markAttendance,
    refreshAttendance: fetchAttendanceData,
  };
};

export default useAttendance;