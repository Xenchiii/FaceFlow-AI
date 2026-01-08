import { AlertCircle, CheckCircle, MessageSquare, Star, TrendingUp } from 'lucide-react';
import { anomalies, feedbackSentiment, predictions, recommendations } from '../utils/data';

const AIInsights = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Predictions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: '#7986C7' }} />
          Predictive Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="text-5xl font-bold mb-2" style={{ color: '#7986C7' }}>
              {predictions.predicted}
            </div>
            <div className="text-gray-600 mb-4">Expected Final Attendance</div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">Confidence Level</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all"
                      style={{ 
                        width: `${predictions.confidence}%`,
                        backgroundColor: '#7986C7'
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: '#7986C7' }}>
                    {predictions.confidence}%
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Prediction Range</div>
                <div className="text-lg font-semibold text-gray-900">
                  {predictions.range[0]} - {predictions.range[1]} attendees
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">Model Factors</div>
            <div className="space-y-2">
              {predictions.factors.map((factor, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#7986C7' }} />
                  <span className="text-sm text-gray-700">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" style={{ color: '#F73F52' }} />
          Anomaly Detection
        </h2>
        <div className="space-y-4">
          {anomalies.map(anomaly => {
            const Icon = anomaly.icon;
            const severityColors = {
              high: '#F73F52',
              medium: '#FFEA85',
              low: '#7986C7'
            };
            return (
              <div 
                key={anomaly.id}
                className="p-4 rounded-lg border-l-4"
                style={{ 
                  borderColor: severityColors[anomaly.severity],
                  backgroundColor: severityColors[anomaly.severity] + '10'
                }}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: severityColors[anomaly.severity] }} />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">{anomaly.type}</div>
                    <div className="text-sm text-gray-700 mb-2">{anomaly.description}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {anomaly.time && <span>Time: {anomaly.time}</span>}
                      {anomaly.segment && <span>Segment: {anomaly.segment}</span>}
                      <span className="px-2 py-1 rounded" style={{ 
                        backgroundColor: severityColors[anomaly.severity] + '20',
                        color: severityColors[anomaly.severity]
                      }}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Star className="w-5 h-5" style={{ color: '#7986C7' }} />
          AI-Powered Recommendations
        </h2>
        <div className="space-y-4">
          {recommendations.map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <div 
                key={idx} 
                className="p-5 rounded-lg border-2 transition hover:shadow-md"
                style={{ borderColor: rec.color + '40' }}
              >
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
                      <div className="font-semibold text-gray-900">{rec.title}</div>
                      <span 
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ 
                          backgroundColor: rec.color + '20',
                          color: rec.color
                        }}
                      >
                        {rec.impact} Impact
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">{rec.insight}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NLP Sentiment Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" style={{ color: '#7986C7' }} />
          Feedback Sentiment Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-center mb-6">
              <div className="text-5xl font-bold mb-2" style={{ color: '#7986C7' }}>
                {feedbackSentiment.positive}%
              </div>
              <div className="text-gray-600">Positive Sentiment</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Positive</span>
                  <span className="font-semibold" style={{ color: '#7986C7' }}>
                    {feedbackSentiment.positive}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${feedbackSentiment.positive}%`,
                      backgroundColor: '#7986C7'
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Neutral</span>
                  <span className="font-semibold text-gray-700">
                    {feedbackSentiment.neutral}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gray-400"
                    style={{ width: `${feedbackSentiment.neutral}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Negative</span>
                  <span className="font-semibold" style={{ color: '#F73F52' }}>
                    {feedbackSentiment.negative}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${feedbackSentiment.negative}%`,
                      backgroundColor: '#F73F52'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">Top Themes</div>
            <div className="space-y-2">
              {feedbackSentiment.themes.map((theme, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{theme.topic}</span>
                  <span className="text-sm font-semibold" style={{ color: '#7986C7' }}>
                    {theme.mentions} mentions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;