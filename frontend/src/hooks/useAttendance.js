import { useEffect, useState } from 'react';

export const useAttendance = () => {
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulate fetching attendance data
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // Simulate API call with dummy data
      const dummyData = [
        {
          id: 1,
          name: 'John Doe',
          date: new Date().toISOString(),
          status: 'present',
          timeIn: '09:00 AM',
          timeOut: '05:00 PM',
        },
        {
          id: 2,
          name: 'Jane Smith',
          date: new Date().toISOString(),
          status: 'present',
          timeIn: '08:45 AM',
          timeOut: '05:15 PM',
        },
        {
          id: 3,
          name: 'Bob Johnson',
          date: new Date().toISOString(),
          status: 'absent',
          timeIn: null,
          timeOut: null,
        },
      ];

      setTimeout(() => {
        setAttendanceData(dummyData);
        setAttendanceCount(dummyData.filter(d => d.status === 'present').length);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const registerCheckIn = (personData) => {
    const newCheckIn = {
      id: Date.now(),
      name: personData.name || 'Unknown',
      time: new Date().toLocaleTimeString(),
      timestamp: new Date().toISOString(),
    };
    
    setRecentCheckIns((prev) => [newCheckIn, ...prev].slice(0, 10));
    setAttendanceCount((prev) => prev + 1);
  };

  const markAttendance = (personId, status) => {
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.id === personId
          ? {
              ...item,
              status,
              timeIn: status === 'present' ? new Date().toLocaleTimeString() : null,
            }
          : item
      )
    );
  };

  const addAttendanceRecord = (record) => {
    setAttendanceData((prev) => [...prev, { ...record, id: Date.now() }]);
  };

  return {
    attendanceData,
    attendanceCount,
    recentCheckIns,
    loading,
    error,
    registerCheckIn,
    markAttendance,
    addAttendanceRecord,
    refreshAttendance: fetchAttendanceData,
  };
};

export default useAttendance;