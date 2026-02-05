import Recommendations from '../components/Recommendations';
import './RecommendationsView.css';
export default function RecommendationsView({ currentEvent, attendanceCount, events }) {
  // Calculate anomalies from real data
  const anomalies = [];
  
  if (currentEvent && attendanceCount) {
    const utilizationRate = (attendanceCount / currentEvent.capacity) * 100;
    
    if (utilizationRate > 90) {
      anomalies.push({
        id: 'capacity-warning',
        type: 'high-capacity',
        severity: 'high',
        description: 'Event nearing full capacity'
      });
    } else if (utilizationRate < 50) {
      anomalies.push({
        id: 'low-attendance',
        type: 'low-capacity',
        severity: 'medium',
        description: 'Low attendance detected'
      });
    }
  }

  // Calculate student data from events if available
  const studentData = events ? {
    totalEvents: events.length,
    averageAttendance: events.reduce((sum, e) => sum + (e.attendance || 0), 0) / events.length || 0,
    totalCapacity: events.reduce((sum, e) => sum + (e.capacity || 0), 0)
  } : {};

  return (
    <Recommendations 
      currentEvent={currentEvent}
      attendanceCount={attendanceCount}
      anomalies={anomalies}
      studentData={studentData}
    />
  );
}