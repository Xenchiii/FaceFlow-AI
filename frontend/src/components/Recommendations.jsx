import { Award, Calendar, CheckCircle, Clock, Eye, Megaphone, MessageSquare, Target, TrendingUp, Users, X, RefreshCw, Loader, AlertCircle, Sparkles, BookOpen, Code, Briefcase, GraduationCap, Trophy, Music, HeartPulse, Wifi, ShieldAlert, Monitor, FileText, Globe, Zap, MapPin, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

const Recommendations = ({ currentEvent, attendanceCount, anomalies, studentData }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('impact');
  const [dismissedIds, setDismissedIds] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ACCOUNT_ID = '64523cd0c5915c95d192adaa4b4c230f';
  const API_TOKEN = '3EKiBdfDpcD5R7qwT2cg9-2-cklfCVM_J82tRm8m';

  const getRandomSubset = (arr, n) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  };

  const generateAIRecommendations = async () => {
    if (!currentEvent) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    setError(null);

    const utilization = currentEvent.capacity > 0 
      ? Math.round((attendanceCount / currentEvent.capacity) * 100) 
      : 0;
    
    const programCounts = {};
    if (studentData && studentData.length > 0) {
      studentData.forEach(student => {
        programCounts[student.program] = (programCounts[student.program] || 0) + 1;
      });
    }
    const topPrograms = Object.entries(programCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([program]) => program);
    const studentContext = topPrograms.length > 0 
      ? `Top Student Programs: ${topPrograms.join(', ')}` 
      : 'General Student Body';

    const category = currentEvent.category || 'General';
    const eventName = currentEvent.name || '';
    
    const isTech = category === 'Academic' || eventName.includes('AI') || eventName.includes('CCS') || eventName.includes('Computer') || eventName.includes('Tech');
    const isSports = category === 'Sports' || eventName.includes('Sport') || eventName.includes('Palaro') || eventName.includes('Festival');

    const focusAngles = [
      "Focus on Innovative Technology & Modern Trends.",
      "Focus on Cost-Effective & Budget Friendly solutions.",
      "Focus on Student Engagement & Hype.",
      "Focus on Safety, Security & Risk Management.",
      "Focus on Operational Efficiency & Speed."
    ];
    const randomAngle = focusAngles[Math.floor(Math.random() * focusAngles.length)];

    let specificFocus = "";
    if (isTech) {
      specificFocus = `
      CONTEXT: College of Computer Studies (CCS) event in the Philippines.
      ANGLE: ${randomAngle}
      
      1. Suggest 2 fresh Global/Local Tech Events (e.g. hackathons, summits).
      2. Suggest 2 operational tips for tech venues.
      3. Suggest 2 engagement ideas for IT students.
      `;
    } else if (isSports) {
      specificFocus = `
      CONTEXT: University Sports Festival in the Philippines.
      ANGLE: ${randomAngle}
      
      1. Suggest safety/health protocols.
      2. Suggest crowd hype & fan engagement.
      3. Suggest facility logistics.
      `;
    } else {
      specificFocus = `
      CONTEXT: General University Event.
      ANGLE: ${randomAngle}
      
      1. Suggest logistics improvements.
      2. Suggest creative student experience ideas.
      `;
    }

    const prompt = `You are an Event Consultant for a Philippine University.
    
    EVENT: "${eventName}" (${category})
    STATUS: ${attendanceCount}/${currentEvent.capacity} attendees.
    AUDIENCE: ${studentContext}

    TASK: Generate 6 unique recommendations.
    ${specificFocus}

    Format strictly as JSON array (no markdown):
    [{
      "id": "unique_string",
      "title": "Title",
      "insight": "One sentence summary.",
      "summary": "Detailed description of the activity/event.",
      "category": "Operations" | "Marketing" | "Planning" | "Engagement",
      "impact": "High" | "Medium" | "Low",
      "color": "#7986C7" (Ops) | "#5B6FA8" (Mktg) | "#F73F52" (Plan) | "#FFEA85" (Engage),
      "isExternal": boolean,
      "url": "https://link.com" (or null)
    }]`;

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are an AI assistant. Return valid JSON only.' },
              { role: 'user', content: prompt }
            ]
          })
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      
      if (data.result?.response) {
        let cleanText = data.result.response.replace(/```json/g, '').replace(/```/g, '').trim();
        const start = cleanText.indexOf('[');
        const end = cleanText.lastIndexOf(']');
        
        if (start !== -1 && end !== -1) {
          cleanText = cleanText.substring(start, end + 1);
          const aiRecs = JSON.parse(cleanText);

          const recsWithIcons = aiRecs.map((rec, index) => ({
            ...rec,
            id: rec.id || `ai-${index}-${Date.now()}`,
            icon: getIconForCategory(rec.category),
            color: rec.color || getCategoryColor(rec.category),
            isExternal: !!rec.isExternal,
            url: rec.url || null
          }));

          setRecommendations(recsWithIcons);
        } else {
           throw new Error('Invalid JSON format');
        }
      } else {
        throw new Error('No response');
      }
    } catch (error) {
      console.error('AI Error:', error);
      setError(null); 
      setRecommendations(generateRandomSmartFallbacks(currentEvent));
    } finally {
      setLoading(false);
    }
  };


  const getIconForCategory = (category) => {
    const iconMap = { 'Operations': Clock, 'Marketing': Megaphone, 'Planning': Users, 'Engagement': Award };
    return iconMap[category] || Target;
  };

  const getCategoryColor = (category) => {
    const colorMap = { 'Operations': '#7986C7', 'Marketing': '#5B6FA8', 'Planning': '#F73F52', 'Engagement': '#FFEA85' };
    return colorMap[category] || '#7986C7';
  };

   const generateRandomSmartFallbacks = (event) => {
    if (!event) return [];

    const name = event.name || '';
    const category = event.category || '';
    
    const isTech = category === 'Academic' || name.includes('AI') || name.includes('CCS') || name.includes('Computer');
    const isSports = category === 'Sports' || name.includes('Sport') || name.includes('Festival');

    let pool = [];

    if (isTech) {
      pool = [
        {
          id: 'tech-1', title: 'Global Event: GitHub Universe', insight: 'Host a local viewing party.', summary: 'GitHub Universe is the premiere global dev event. Host a watch party for keynotes on AI and Security.', category: 'Engagement', impact: 'High', color: '#FFEA85', icon: Globe, isExternal: true, url: 'https://githubuniverse.com/'
        },
        {
          id: 'tech-2', title: 'Google DevFest Manila', insight: 'Connect students to global Google experts.', summary: 'DevFest Philippines features GDEs from around the world covering Android, Cloud, and AI.', category: 'Planning', impact: 'High', color: '#F73F52', icon: Code, isExternal: true, url: 'https://gdg.community.dev/'
        },
        {
          id: 'tech-3', title: 'AWS Community Day PH', insight: 'Career networking in Cloud Computing.', summary: 'A major event for cloud professionals. Great for students to meet potential employers in the AWS ecosystem.', category: 'Planning', impact: 'Medium', color: '#F73F52', icon: Users, isExternal: true, url: 'https://www.meetup.com/aws-philippines/'
        },
        {
          id: 'tech-4', title: 'Lab WiFi Stress Test', insight: 'Ensure connectivity for live demos.', summary: 'Run a load test on the gym/lab routers to ensure they handle 300+ concurrent connections.', category: 'Operations', impact: 'High', color: '#7986C7', icon: Wifi, isExternal: false
        },
        {
          id: 'tech-5', title: 'NASA Space Apps Challenge', insight: 'Join the world\'s largest hackathon.', summary: 'A global hackathon solving real-world problems using open data. Excellent for student portfolios.', category: 'Engagement', impact: 'Medium', color: '#FFEA85', icon: Trophy, isExternal: true, url: 'https://www.spaceappschallenge.org/'
        },
        {
          id: 'tech-6', title: 'Partner: AI Pilipinas', insight: 'Guest speakers on Generative AI.', summary: 'Invite experts from the AI Pilipinas community to discuss LLMs and the future of tech jobs.', category: 'Planning', impact: 'High', color: '#F73F52', icon: Briefcase, isExternal: true, url: 'https://www.facebook.com/groups/aipilipinas/'
        },
        {
          id: 'tech-7', title: 'Live Coding Battle', insight: 'Interactive intermission number.', summary: 'Host a "Code in the Dark" or speed debugging contest on stage for instant engagement.', category: 'Engagement', impact: 'Medium', color: '#FFEA85', icon: Code, isExternal: false
        },
        {
          id: 'tech-8', title: 'Power Redundancy Check', insight: 'Prevent demo failures.', summary: 'Ensure extension cords have surge protectors and backup power sources are ready for servers.', category: 'Operations', impact: 'High', color: '#7986C7', icon: Zap, isExternal: false
        }
      ];
    } 
    else if (isSports) {
      pool = [
        {
          id: 'spt-1', title: 'FIFA Crowd Standards', insight: 'Implement sector-based entry.', summary: 'Divide entry gates by color codes (like FIFA stadiums) to streamline student entry flow.', category: 'Operations', impact: 'High', color: '#7986C7', icon: Globe, isExternal: false
        },
        {
          id: 'spt-2', title: 'Heat Index Monitoring', insight: 'Safety first for athletes.', summary: 'If PAGASA heat index >40C, enforce mandatory hydration breaks every 20 mins.', category: 'Operations', impact: 'High', color: '#7986C7', icon: ShieldAlert, isExternal: false
        },
        {
          id: 'spt-3', title: 'Red Cross Medics', insight: 'Emergency readiness.', summary: 'Coordinate a standby ambulance at the main gate for injury response.', category: 'Planning', impact: 'High', color: '#F73F52', icon: HeartPulse, isExternal: false
        },
        {
          id: 'spt-4', title: 'Live Digital Brackets', insight: 'Reduce admin table questions.', summary: 'Use Challonge.com and display a QR code for live-updated tournament standings.', category: 'Engagement', impact: 'Medium', color: '#FFEA85', icon: Trophy, isExternal: false
        },
        {
          id: 'spt-5', title: 'Halftime "Half-Court Shot"', insight: 'NBA-style fan engagement.', summary: 'Pick a random student to attempt a half-court shot for a tuition discount or prize.', category: 'Engagement', impact: 'Medium', color: '#FFEA85', icon: Activity, isExternal: false
        },
        {
          id: 'spt-6', title: 'Hydration Sponsors', insight: 'Free water for students.', summary: 'Partner with Gatorade or Pocari for free hydration booths in exchange for banners.', category: 'Marketing', impact: 'Medium', color: '#5B6FA8', icon: Megaphone, isExternal: false
        }
      ];
    }
    else {
      pool = [
        { id: 'gen-1', title: 'Virtual Queue System', insight: 'Manage lines digitally.', summary: 'Use a QR numbering system so students can wait in the shade.', category: 'Operations', impact: 'High', color: '#7986C7', icon: Users, isExternal: false },
        { id: 'gen-2', title: 'RFID Wristbands', insight: 'Speedy entry protocol.', summary: 'Use NFC wristbands for tap-to-enter access control.', category: 'Operations', impact: 'High', color: '#7986C7', icon: Zap, isExternal: false },
        { id: 'gen-3', title: 'Photo Wall Contest', insight: 'Viral marketing.', summary: 'Setup a neon-lit photo booth and track the event hashtag.', category: 'Marketing', impact: 'Medium', color: '#5B6FA8', icon: Camera, isExternal: false },
        { id: 'gen-4', title: 'Feedback Wall', insight: 'Instant sentiment analysis.', summary: 'A physical or digital wall where students tap emojis to rate the event.', category: 'Engagement', impact: 'Low', color: '#FFEA85', icon: MessageSquare, isExternal: false },
        { id: 'gen-5', title: 'Sound & Lights Check', insight: 'Production quality.', summary: 'Run a full tech rehearsal 2 hours before gates open.', category: 'Planning', impact: 'High', color: '#F73F52', icon: Music, isExternal: false }
      ];
    }

    return getRandomSubset(pool, 5);
  };

  useEffect(() => {
    if (currentEvent) {
      if (recommendations.length === 0) {
        generateAIRecommendations();
      }
    } else {
      setRecommendations([]);
    }
  }, [currentEvent?.id]); 

  const activeRecommendations = recommendations.filter(rec => !dismissedIds.includes(rec.id));
  const filteredRecs = filter === 'all' 
    ? activeRecommendations 
    : activeRecommendations.filter(rec => rec.impact && rec.impact.toLowerCase() === filter);

  const sortedRecs = [...filteredRecs].sort((a, b) => {
    if (sortBy === 'impact') {
      const impactOrder = { High: 0, Medium: 1, Low: 2 };
      const valA = impactOrder[a.impact] !== undefined ? impactOrder[a.impact] : 3;
      const valB = impactOrder[b.impact] !== undefined ? impactOrder[b.impact] : 3;
      return valA - valB;
    }
    return 0;
  });

  const handleDismiss = (id) => {
    setDismissedIds([...dismissedIds, id]);
    if (selectedRec?.id === id) setSelectedRec(null);
  };

  const impactCounts = {
    all: activeRecommendations.length,
    high: activeRecommendations.filter(r => r.impact === 'High').length,
    medium: activeRecommendations.filter(r => r.impact === 'Medium').length,
    low: activeRecommendations.filter(r => r.impact === 'Low').length,
  };

  return (
    <div className="rec-container" style={{ display: 'grid', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Styles */}
      <style>{`
        .rec-card-bg { background-color: white; border: 1px solid #e5e7eb; }
        .rec-text-primary { color: #1f2937; }
        .rec-text-secondary { color: #6b7280; }
        .rec-text-tertiary { color: #374151; }
        .rec-btn-sort { background-color: white; border: 1px solid #e5e7eb; color: #374151; }
        .rec-filter-btn-active { background-color: #7986C7; color: white; }
        .rec-filter-btn-inactive { background-color: #f3f4f6; color: #374151; }
        .rec-expanded-bg { background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
        .rec-dismissed-bg { background-color: #f9fafb; border: 1px solid #e5e7eb; }
        .rec-error-bg { background-color: #fef2f2; border: 2px solid #f87171; }
        .rec-error-title { color: #dc2626; }
        .rec-error-text { color: #991b1b; }

        body.dark-mode .rec-card-bg { background-color: #1f2937; border-color: #374151; }
        body.dark-mode .rec-text-primary { color: #f3f4f6; }
        body.dark-mode .rec-text-secondary { color: #9ca3af; }
        body.dark-mode .rec-text-tertiary { color: #d1d5db; }
        body.dark-mode .rec-btn-sort { background-color: #374151; border-color: #4b5563; color: #d1d5db; }
        body.dark-mode .rec-filter-btn-inactive { background-color: #111827; color: #9ca3af; }
        body.dark-mode .rec-filter-btn-inactive:hover { background-color: #374151; }
        body.dark-mode .rec-expanded-bg { background-color: #111827; border-top-color: #374151; }
        body.dark-mode .rec-dismissed-bg { background-color: #1f2937; border-color: #374151; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
          <Loader className="rec-icon-color" style={{ width: '48px', height: '48px', color: '#7986C7', animation: 'spin 1s linear infinite' }} />
          <p className="rec-text-secondary" style={{ fontSize: '18px', fontWeight: '600' }}>
            <Sparkles className="rec-icon-color" style={{ width: '20px', height: '20px', display: 'inline', marginRight: '8px', color: '#7986C7' }} />
            Analyzing Global & Local Trends...
          </p>
          <p className="rec-text-secondary" style={{ fontSize: '14px' }}>Finding fresh insights for {currentEvent ? currentEvent.name : 'your event'}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !currentEvent && (
         <div className="rec-card-bg" style={{ borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
            <Calendar className="rec-text-secondary" style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 className="rec-text-primary" style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>No Event Selected</h3>
            <p className="rec-text-secondary">Please select an event from the Dashboard to view recommendations.</p>
         </div>
      )}

      {/* Content */}
      {!loading && currentEvent && (!error || recommendations.length > 0) && (
        <>
          {/* Header */}
          <div className="rec-card-bg" style={{ borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className="rec-text-primary" style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  AI Recommendations: {currentEvent.name}
                </h2>
                <p className="rec-text-secondary" style={{ fontSize: '14px' }}>
                  Global Standards • {currentEvent.category} • Philippine Context
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setSortBy(sortBy === 'impact' ? 'default' : 'impact')} className="rec-btn-sort" style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Sort by Impact
                </button>
                <button onClick={generateAIRecommendations} disabled={loading} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#7986C7', color: 'white', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.5 : 1 }}>
                  <RefreshCw style={{ width: '16px', height: '16px' }} />
                  Refresh (New List)
                </button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {['all', 'high', 'medium', 'low'].map((level) => (
                <button key={level} onClick={() => setFilter(level)} className={filter === level ? 'rec-filter-btn-active' : 'rec-filter-btn-inactive'} style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.8 }}>({impactCounts[level]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recommendations List */}
          {sortedRecs.length === 0 ? (
            <div className="rec-card-bg" style={{ borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
              <CheckCircle className="rec-text-secondary" style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 className="rec-text-primary" style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>All Set!</h3>
              <p className="rec-text-secondary">No recommendations match your current filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {sortedRecs.map((rec) => {
                const Icon = rec.icon || Target;
                return (
                  <div key={rec.id} className="rec-card-bg" style={{ borderRadius: '16px', borderLeft: `5px solid ${rec.color}`, transition: 'all 0.2s' }}>
                    <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flexShrink: 0 }}>
                          <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: rec.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon style={{ width: '28px', height: '28px', color: 'white' }} />
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div className="rec-text-primary" style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{rec.title}</div>
                              <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: rec.color + '20', color: rec.color }}>{rec.category}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ padding: '6px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700', backgroundColor: rec.color + '20', color: rec.color }}>{rec.impact} Impact</span>
                              <button onClick={() => setSelectedRec(selectedRec?.id === rec.id ? null : rec)} style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
                                <Eye className="rec-text-secondary" style={{ width: '16px', height: '16px' }} />
                              </button>
                              <button onClick={() => handleDismiss(rec.id)} style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
                                <X className="rec-text-secondary" style={{ width: '16px', height: '16px' }} />
                              </button>
                            </div>
                          </div>
                          <div className="rec-text-tertiary" style={{ fontSize: '14px', lineHeight: '1.6' }}>{rec.insight}</div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details with Summary & Implementation Plan */}
                    {selectedRec?.id === rec.id && (
                      <div className="rec-expanded-bg" style={{ padding: '24px' }}>
                        
                        {/* New Summary Section */}
                        {rec.summary && (
                          <div style={{ marginBottom: '24px' }}>
                            <h4 className="rec-text-primary" style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={18} className="rec-icon-color"/> Global Context & Details
                            </h4>
                            <p className="rec-text-tertiary" style={{ fontSize: '14px', lineHeight: '1.6', backgroundColor: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '8px', borderLeft: `3px solid ${rec.color}` }}>
                              {rec.summary}
                            </p>
                          </div>
                        )}

                        <h4 className="rec-text-primary" style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Implementation Plan</h4>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {['Discuss this recommendation with the event committee', 'Assign a point person to execute this task', 'Track success metrics in real-time', 'Adapt global standard to local budget'].map((step, idx) => (
                            <div key={idx} className="rec-text-tertiary" style={{ display: 'flex', gap: '8px', fontSize: '14px' }}>
                              <CheckCircle style={{ width: '16px', height: '16px', color: rec.color, flexShrink: 0, marginTop: '2px' }} />
                              {step}
                            </div>
                          ))}
                        </div>
                        {rec.isExternal && rec.url && (
                          <div style={{ marginTop: '16px' }}>
                             <a href={rec.url} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: rec.color, fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                               View External Resource <Target style={{ width: '14px', height: '14px' }}/>
                             </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Dismissed */}
          {dismissedIds.length > 0 && (
            <div className="rec-dismissed-bg" style={{ borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <p className="rec-text-secondary" style={{ fontSize: '14px' }}>
                {dismissedIds.length} dismissed.{' '}
                <button onClick={() => setDismissedIds([])} style={{ fontSize: '14px', fontWeight: '600', color: '#7986C7', textDecoration: 'underline', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>Restore all</button>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Recommendations;