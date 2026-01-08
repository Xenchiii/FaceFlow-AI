import { useEffect, useState } from 'react';
import './InsightsView.css';

const InsightsView = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading insights data
    const fetchInsights = async () => {
      try {
        // Simulated data - replace with actual API call
        const mockData = [
          {
            id: 1,
            title: 'Recognition Accuracy',
            value: '94.5%',
            change: '+2.3%',
            trend: 'up',
            icon: '📊'
          },
          {
            id: 2,
            title: 'Total Scans Today',
            value: '1,234',
            change: '+156',
            trend: 'up',
            icon: '🔍'
          },
          {
            id: 3,
            title: 'Active Events',
            value: '8',
            change: '-2',
            trend: 'down',
            icon: '📅'
          },
          {
            id: 4,
            title: 'System Uptime',
            value: '99.9%',
            change: '+0.1%',
            trend: 'up',
            icon: '⚡'
          }
        ];

        setTimeout(() => {
          setInsights(mockData);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="insights-container">
        <div className="insights-loading">
          <div className="spinner"></div>
          <p>Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-container">
      <div className="insights-header">
        <h1>Insights</h1>
        <p className="insights-subtitle">Real-time analytics and performance metrics</p>
      </div>

      <div className="insights-grid">
        {insights.map((insight) => (
          <div key={insight.id} className="insight-card">
            <div className="insight-icon">{insight.icon}</div>
            <div className="insight-content">
              <h3 className="insight-title">{insight.title}</h3>
              <div className="insight-value">{insight.value}</div>
              <div className={`insight-change ${insight.trend}`}>
                <span className="change-icon">{insight.trend === 'up' ? '↑' : '↓'}</span>
                <span>{insight.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="insights-details">
        <div className="detail-section">
          <h2>Recognition Performance</h2>
          <div className="detail-card">
            <div className="detail-row">
              <span className="detail-label">Average Response Time</span>
              <span className="detail-value">124ms</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">False Positive Rate</span>
              <span className="detail-value">0.3%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Processing Queue</span>
              <span className="detail-value">12 pending</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Recent Activity</h2>
          <div className="detail-card">
            <div className="activity-item">
              <span className="activity-time">2 min ago</span>
              <span className="activity-text">Event scan completed at Main Entrance</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">15 min ago</span>
              <span className="activity-text">New recognition profile added</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">1 hour ago</span>
              <span className="activity-text">System performance report generated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsView;