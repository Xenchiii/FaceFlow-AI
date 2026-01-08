import { Calendar, Eye, Lightbulb, Target, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import './RecommendationsView.css';
export default function RecommendationsView() {
  const [selectedImpact, setSelectedImpact] = useState('all');
  const [expandedCard, setExpandedCard] = useState(null);

  const recommendations = [
    {
      id: 1,
      title: 'Target Low-Engagement Segments',
      category: 'Marketing',
      impact: 'high',
      description: '4th year students show 35% lower engagement than average. Send personalized invites highlighting career networking opportunities and alumni speakers to boost attendance.',
      metrics: {
        expectedIncrease: '+35%',
        targetAudience: '4th Year Students',
        effort: 'Medium'
      },
      icon: <Target className="w-6 h-6" />
    },
    {
      id: 2,
      title: 'Schedule Strategic Follow-up',
      category: 'Engagement',
      impact: 'high',
      description: 'Attendees who engage within 48 hours post-event are 60% more likely to attend future events. Schedule automated thank-you emails with feedback surveys tomorrow at 10 AM.',
      metrics: {
        expectedIncrease: '+60%',
        targetAudience: 'Recent Attendees',
        effort: 'Low'
      },
      icon: <Calendar className="w-6 h-6" />
    },
    {
      id: 3,
      title: 'Launch Student Ambassador Program',
      category: 'Engagement',
      impact: 'high',
      description: 'Peer influence drives 40% higher registration rates. Create an ambassador program where active attendees can invite their networks with exclusive perks.',
      metrics: {
        expectedIncrease: '+40%',
        targetAudience: 'Active Students',
        effort: 'High'
      },
      icon: <Users className="w-6 h-6" />
    },
    {
      id: 4,
      title: 'Optimize Event Timing',
      category: 'Operations',
      impact: 'medium',
      description: 'Events scheduled between 2-4 PM on Thursdays show 25% higher attendance. Consider rescheduling recurring events to these peak time slots.',
      metrics: {
        expectedIncrease: '+25%',
        targetAudience: 'All Students',
        effort: 'Low'
      },
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 5,
      title: 'Enhance Social Media Promotion',
      category: 'Marketing',
      impact: 'medium',
      description: 'Events with 5+ social media posts get 30% more registrations. Increase posting frequency with engaging content like speaker highlights and event previews.',
      metrics: {
        expectedIncrease: '+30%',
        targetAudience: 'All Students',
        effort: 'Medium'
      },
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 6,
      title: 'Improve Check-in Experience',
      category: 'Operations',
      impact: 'low',
      description: 'Average check-in time is 3 minutes. Deploy additional QR scanning stations at entrances to reduce wait times and improve first impressions.',
      metrics: {
        expectedIncrease: '+15%',
        targetAudience: 'All Attendees',
        effort: 'Low'
      },
      icon: <Users className="w-6 h-6" />
    }
  ];

  const impactColors = {
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-700'
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-700'
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-700'
    }
  };

  const filteredRecommendations = selectedImpact === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.impact === selectedImpact);

  const impactCounts = {
    all: recommendations.length,
    high: recommendations.filter(r => r.impact === 'high').length,
    medium: recommendations.filter(r => r.impact === 'medium').length,
    low: recommendations.filter(r => r.impact === 'low').length
  };

  return (
    <div className="recommendations-view">
      {/* Header */}
      <div className="view-header">
        <div className="header-content">
          <div className="header-icon">
            <Lightbulb className="w-8 h-8" />
          </div>
          <div>
            <h2 className="view-title">AI Recommendations</h2>
            <p className="view-subtitle">Data-driven insights to optimize your event performance</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          onClick={() => setSelectedImpact('all')}
          className={`filter-tab ${selectedImpact === 'all' ? 'active' : ''}`}
        >
          All ({impactCounts.all})
        </button>
        <button
          onClick={() => setSelectedImpact('high')}
          className={`filter-tab ${selectedImpact === 'high' ? 'active' : ''}`}
        >
          <span className="impact-dot high"></span>
          High Impact ({impactCounts.high})
        </button>
        <button
          onClick={() => setSelectedImpact('medium')}
          className={`filter-tab ${selectedImpact === 'medium' ? 'active' : ''}`}
        >
          <span className="impact-dot medium"></span>
          Medium ({impactCounts.medium})
        </button>
        <button
          onClick={() => setSelectedImpact('low')}
          className={`filter-tab ${selectedImpact === 'low' ? 'active' : ''}`}
        >
          <span className="impact-dot low"></span>
          Low ({impactCounts.low})
        </button>
      </div>

      {/* Recommendations Grid */}
      <div className="recommendations-grid">
        {filteredRecommendations.map((rec) => (
          <div
            key={rec.id}
            className={`recommendation-card ${impactColors[rec.impact].bg} ${impactColors[rec.impact].border}`}
          >
            {/* Card Header */}
            <div className="card-header">
              <div className="card-icon" style={{
                background: `linear-gradient(135deg, ${rec.impact === 'high' ? '#ef4444' : rec.impact === 'medium' ? '#f59e0b' : '#3b82f6'} 0%, ${rec.impact === 'high' ? '#dc2626' : rec.impact === 'medium' ? '#d97706' : '#2563eb'} 100%)`
              }}>
                {rec.icon}
              </div>
              <div className="card-header-content">
                <div className="card-category">{rec.category}</div>
                <h3 className="card-title">{rec.title}</h3>
              </div>
              <span className={`impact-badge ${impactColors[rec.impact].badge}`}>
                {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)} Impact
              </span>
            </div>

            {/* Card Body */}
            <p className="card-description">{rec.description}</p>

            {/* Metrics */}
            <div className="card-metrics">
              <div className="metric">
                <TrendingUp className="w-4 h-4" />
                <div>
                  <div className="metric-label">Expected Increase</div>
                  <div className="metric-value">{rec.metrics.expectedIncrease}</div>
                </div>
              </div>
              <div className="metric">
                <Users className="w-4 h-4" />
                <div>
                  <div className="metric-label">Target Audience</div>
                  <div className="metric-value">{rec.metrics.targetAudience}</div>
                </div>
              </div>
              <div className="metric">
                <Target className="w-4 h-4" />
                <div>
                  <div className="metric-label">Effort Required</div>
                  <div className="metric-value">{rec.metrics.effort}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card-actions">
              <button className="btn-primary">
                Implement Now
              </button>
              <button className="btn-secondary">
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="empty-state">
          <Lightbulb className="w-16 h-16 text-gray-400" />
          <h3 className="empty-title">No recommendations found</h3>
          <p className="empty-text">Try selecting a different impact filter</p>
        </div>
      )}
    </div>
  );
}   