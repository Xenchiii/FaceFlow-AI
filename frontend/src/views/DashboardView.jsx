import Dashboard from '../components/Dashboard';
import './DashboardView.css';

export default function DashboardView({ 
  events, 
  currentEvent, 
  onEventSelect, 
  attendanceCount,
  onGenerateQR 
}) {
  return (
    <div className="dashboard-view">
      {/* Pass real events data to Dashboard component */}
      <Dashboard events={events} />
      
      {/* Add other dashboard components here as needed */}
    </div>
  );
}