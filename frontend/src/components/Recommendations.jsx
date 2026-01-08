import { ArrowUpDown, Award, Calendar, CheckCircle, Clock, Eye, Megaphone, MessageSquare, Target, TrendingUp, Users, X } from 'lucide-react';
import { useState } from 'react';

const Recommendations = ({ currentEvent, attendanceCount, anomalies }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('impact');
  const [dismissedIds, setDismissedIds] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);

  // Generate dynamic recommendations based on current event data
  const generateRecommendations = () => {
    const recs = [];
    
    // Check-in flow optimization (based on attendance rate)
    if (currentEvent && attendanceCount) {
      const attendanceRate = (attendanceCount / currentEvent.capacity) * 100;
      const checkInRate = 8.2; // from your stat card
      
      if (checkInRate > 7) {
        recs.push({
          id: 'checkin-flow',
          title: 'Optimize Check-in Flow',
          insight: `Current check-in rate of ${checkInRate}/min suggests potential bottlenecks. Deploy 2 additional QR scanning stations during peak hours to reduce wait times by 40%.`,
          icon: Clock,
          color: '#7986C7',
          impact: 'High',
          category: 'Operations'
        });
      }
    }

    // Capacity planning
    if (currentEvent) {
      const utilizationRate = (attendanceCount / currentEvent.capacity) * 100;
      
      if (utilizationRate > 85) {
        recs.push({
          id: 'capacity-expand',
          title: 'Expand Capacity for Next Event',
          insight: `Current capacity at ${Math.round(utilizationRate)}%. Predictive models indicate 15% higher demand. Consider booking a larger venue or adding overflow rooms with live streaming.`,
          icon: Users,
          color: '#FFEA85',
          impact: 'Medium',
          category: 'Planning'
        });
      } else if (utilizationRate < 60) {
        recs.push({
          id: 'capacity-reduce',
          title: 'Right-size Future Capacity',
          insight: `Current utilization at ${Math.round(utilizationRate)}%. Consider a more intimate venue to reduce costs and create a better atmosphere while maintaining quality.`,
          icon: Users,
          color: '#5B6FA8',
          impact: 'Medium',
          category: 'Planning'
        });
      }
    }

    // Anomaly-based recommendations
    if (anomalies && anomalies.length > 0) {
      const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
      
      if (highSeverityAnomalies.length > 0) {
        recs.push({
          id: 'address-anomalies',
          title: 'Address Critical Issues',
          insight: `${highSeverityAnomalies.length} high-severity anomalies detected. Immediate action required to prevent impact on attendee experience and event success.`,
          icon: Target,
          color: '#F73F52',
          impact: 'High',
          category: 'Operations'
        });
      }
    }

    // Engagement optimization
    recs.push({
      id: 'engagement-segments',
      title: 'Target Low-Engagement Segments',
      insight: '4th year students show 35% lower engagement than average. Send personalized invites highlighting career networking opportunities and alumni speakers to boost attendance.',
      icon: Target,
      color: '#F73F52',
      impact: 'High',
      category: 'Marketing'
    });

    // Social media optimization
    recs.push({
      id: 'social-media',
      title: 'Enhance Social Media Campaign',
      insight: 'Instagram posts generate 3x more engagement than other channels. Increase Instagram Stories and Reels featuring student testimonials to drive last-minute registrations.',
      icon: Megaphone,
      color: '#5B6FA8',
      impact: 'Medium',
      category: 'Marketing'
    });

    // Program balance
    recs.push({
      id: 'program-balance',
      title: 'Improve Program Balance',
      insight: 'Computer Science program is overrepresented (45% vs 25% student population). Partner with Engineering and Business departments to promote cross-discipline networking.',
      icon: TrendingUp,
      color: '#7986C7',
      impact: 'Medium',
      category: 'Planning'
    });

    // Follow-up strategy
    recs.push({
      id: 'followup',
      title: 'Schedule Strategic Follow-up',
      insight: 'Attendees who engage within 48 hours post-event are 60% more likely to attend future events. Schedule automated thank-you emails with feedback surveys tomorrow at 10 AM.',
      icon: Calendar,
      color: '#F73F52',
      impact: 'High',
      category: 'Engagement'
    });

    // Ambassador program
    recs.push({
      id: 'ambassadors',
      title: 'Launch Student Ambassador Program',
      insight: 'Highly engaged attendees (top 15%) can influence 5-8 peers each. Recruit 10 ambassadors from this segment to promote upcoming events and boost organic reach.',
      icon: Award,
      color: '#FFEA85',
      impact: 'High',
      category: 'Engagement'
    });

    // Feedback themes
    recs.push({
      id: 'feedback-action',
      title: 'Address Negative Feedback Themes',
      insight: 'NLP analysis shows 18% of feedback mentions "venue temperature". Install portable heaters and communicate climate control adjustments to improve attendee comfort.',
      icon: MessageSquare,
      color: '#5B6FA8',
      impact: 'Low',
      category: 'Operations'
    });

    return recs;
  };

  const recommendations = generateRecommendations().filter(rec => !dismissedIds.includes(rec.id));

  // Filter recommendations
  const filteredRecs = filter === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.impact.toLowerCase() === filter);

  // Sort recommendations
  const sortedRecs = [...filteredRecs].sort((a, b) => {
    if (sortBy === 'impact') {
      const impactOrder = { High: 0, Medium: 1, Low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    }
    return 0;
  });

  const handleDismiss = (id) => {
    setDismissedIds([...dismissedIds, id]);
    if (selectedRec?.id === id) setSelectedRec(null);
  };

  const impactCounts = {
    all: recommendations.length,
    high: recommendations.filter(r => r.impact === 'High').length,
    medium: recommendations.filter(r => r.impact === 'Medium').length,
    low: recommendations.filter(r => r.impact === 'Low').length,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5" style={{ color: '#7986C7' }} />
              AI-Powered Recommendations
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Data-driven insights to optimize your event performance
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'impact' ? 'default' : 'impact')}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition flex items-center gap-2 text-sm"
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort by Impact
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'high', 'medium', 'low'].map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                filter === level
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={filter === level ? { backgroundColor: '#7986C7' } : {}}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
              <span className="ml-2 text-xs opacity-75">({impactCounts[level]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Grid */}
      {sortedRecs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No recommendations match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRecs.map((rec) => {
            const Icon = rec.icon;
            return (
              <div
                key={rec.id}
                className="bg-white rounded-xl border-2 transition hover:shadow-md"
                style={{ borderColor: rec.color + '40' }}
              >
                <div className="p-5">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className="w-14 h-14 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: rec.color }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-lg mb-1">
                            {rec.title}
                          </div>
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium inline-block"
                            style={{
                              backgroundColor: rec.color + '20',
                              color: rec.color
                            }}
                          >
                            {rec.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-3 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: rec.color + '20',
                              color: rec.color
                            }}
                          >
                            {rec.impact} Impact
                          </span>
                          <button
                            onClick={() => setSelectedRec(selectedRec?.id === rec.id ? null : rec)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDismiss(rec.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {rec.insight}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedRec?.id === rec.id && (
                  <div className="border-t border-gray-200 p-5 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-3">Action Steps</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: rec.color }} />
                        Review current metrics and baseline performance
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: rec.color }} />
                        Implement recommended changes within 24-48 hours
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: rec.color }} />
                        Monitor impact through analytics dashboard
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: rec.color }} />
                        Schedule follow-up review in one week
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dismissed Counter */}
      {dismissedIds.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-600">
            {dismissedIds.length} recommendation{dismissedIds.length > 1 ? 's' : ''} dismissed.{' '}
            <button
              onClick={() => setDismissedIds([])}
              className="text-sm font-medium underline"
              style={{ color: '#7986C7' }}
            >
              Restore all
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default Recommendations;