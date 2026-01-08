import React from 'react';
import { Calendar, Users, Activity, TrendingUp, AlertCircle, BarChart3, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { events, yearLevelData, programData, timeSeriesData, engagementSegments, predictions, anomalies } from '../utils/data';

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg`} style={{ backgroundColor: color + '20' }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-sm font-medium text-gray-900 mb-1">{title}</div>
    <div className="text-xs text-gray-500">{subtitle}</div>
  </div>
);

const Dashboard = ({ currentEvent, setCurrentEvent, attendanceCount }) => {
  return (
    <div className="space-y-6">
      {/* Event Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Active Event</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => setCurrentEvent(event)}
              className={`p-5 rounded-xl border-2 transition text-left ${
                currentEvent?.id === event.id
                  ? 'border-secondary bg-secondary bg-opacity-5'
                  : 'border-gray-200 hover:border-secondary hover:bg-gray-50'
              }`}
              style={currentEvent?.id === event.id ? { borderColor: '#7986C7' } : {}}
            >
              <div className="font-semibold text-gray-900 mb-2">{event.name}</div>
              <div className="text-sm text-gray-600 mb-3">{event.date} • {event.time}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{event.venue}</span>
                <span className="font-medium" style={{ color: '#7986C7' }}>
                  {event.registered}/{event.capacity}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {currentEvent && (
        <>
          {/* Real-time Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard 
              title="Current Attendance" 
              value={attendanceCount} 
              subtitle={`${Math.round((attendanceCount/currentEvent.capacity)*100)}% capacity`}
              icon={Users}
              color="#7986C7"
            />
            <StatCard 
              title="Check-in Rate" 
              value="8.2/min" 
              subtitle="Last 15 minutes"
              icon={Activity}
              color="#F73F52"
            />
            <StatCard 
              title="Predicted Final" 
              value={predictions.predicted} 
              subtitle={`${predictions.confidence}% confidence`}
              icon={TrendingUp}
              color="#FFEA85"
            />
            <StatCard 
              title="Anomalies" 
              value={anomalies.length} 
              subtitle="Issues detected"
              icon={AlertCircle}
              color="#5B6FA8"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: '#7986C7' }} />
                Real-time Check-in Flow
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7986C7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7986C7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="time" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="attendees" 
                    stroke="#7986C7" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAttendees)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#F73F52" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: '#7986C7' }} />
                Year Level Distribution
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie
                    data={yearLevelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={entry => `${entry.name}: ${entry.value}`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {yearLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" style={{ color: '#7986C7' }} />
                Program Distribution
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={programData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="program" stroke="#6B7280" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: '#7986C7' }} />
                Student Engagement Segments
              </h3>
              <div className="space-y-4">
                {engagementSegments.map((seg, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">{seg.segment}</span>
                      <span className="text-sm font-semibold" style={{ color: seg.color }}>
                        {seg.count} ({seg.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${seg.percentage}%`,
                          backgroundColor: seg.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;