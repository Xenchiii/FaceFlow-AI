import React from 'react';
import AIInsights from '../components/AIInsights';

const InsightsView = ({ currentEvent, attendanceData, studentData }) => {
  return (
    <div className="insights-container" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <AIInsights 
        currentEvent={currentEvent}
        attendanceData={attendanceData}
        studentData={studentData}
      />
    </div>
  );
};

export default InsightsView;