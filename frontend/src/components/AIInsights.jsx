import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, MessageSquare, Star, TrendingUp, RefreshCw, Loader, Brain, Zap, Target, Activity, GitCompare, Clock, BarChart3 } from 'lucide-react';
import './AIInsights.css';

const AIInsights = ({ currentEvent, attendanceData, studentData }) => {
  const [predictions, setPredictions] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [feedbackSentiment, setFeedbackSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAI, setSelectedAI] = useState('llama');
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState({});
  const [insightHistory, setInsightHistory] = useState([]);

  const aiModels = {
    llama: {
      name: 'Llama 3.1 8B',
      icon: <Brain style={{ width: '20px', height: '20px' }} />,
      color: '#7986C7',
      description: 'Fast general-purpose AI',
      model: '@cf/meta/llama-3.1-8b-instruct'
    },
    llama70b: {
      name: 'Llama 3.1 70B',
      icon: <Brain style={{ width: '20px', height: '20px' }} />,
      color: '#10b981',
      description: 'Advanced reasoning',
      model: '@cf/meta/llama-3.1-70b-instruct'
    },
    mistral: {
      name: 'Mistral 7B',
      icon: <Zap style={{ width: '20px', height: '20px' }} />,
      color: '#F73F52',
      description: 'Efficient analysis',
      model: '@cf/mistral/mistral-7b-instruct-v0.1'
    },
  };

  const generateInsights = async () => {
    if (!currentEvent) {
      setError('No event selected');
      return;
    }

    setLoading(true);
    setError(null);

    const prompt = `Analyze this event data and provide insights in JSON format:

Event: ${currentEvent.name}
Capacity: ${currentEvent.capacity}
Current Attendance: ${attendanceData?.current || 0}
Utilization: ${Math.round(((attendanceData?.current || 0) / currentEvent.capacity) * 100)}%

Provide ONLY valid JSON with this structure (keep it concise):
{
  "predictions": {
    "predicted": 250,
    "confidence": 85,
    "range": [200, 300],
    "factors": ["factor1", "factor2", "factor3"]
  },
  "anomalies": [
    {"id": 1, "type": "issue type", "description": "brief description", "severity": "high"}
  ],
  "recommendations": [
    {"id": "R1", "title": "Brief Title", "insight": "Short insight", "category": "Operations", "impact": "High", "color": "#7986C7"}
  ],
  "sentiment": {
    "positive": 65,
    "neutral": 25,
    "negative": 10,
    "themes": [{"topic": "topic name", "mentions": 10}]
  }
}

IMPORTANT: Keep descriptions SHORT (under 50 words). Return ONLY the JSON, nothing else.`;

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiModels[selectedAI].model,
          messages: [
            { 
              role: 'system', 
              content: 'You are an AI analyst. Always respond with valid JSON only, no markdown formatting.' 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.response) {
        let cleanText = data.response
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }
        
        try {
          const insights = JSON.parse(cleanText);
          
          if (!insights.predictions || !insights.predictions.predicted) {
            throw new Error('Invalid insights structure');
          }
          
          setPredictions(insights.predictions);
          setAnomalies(insights.anomalies || []);
          setRecommendations(insights.recommendations || []);
          setFeedbackSentiment(insights.sentiment);
          setError(null); 

          setInsightHistory(prev => [{
            timestamp: new Date().toISOString(),
            model: aiModels[selectedAI].name,
            eventName: currentEvent.name,
            prediction: insights.predictions.predicted,
            confidence: insights.predictions.confidence
          }, ...prev.slice(0, 9)]);
          
          setLoading(false); 
          return; 
          
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          throw new Error('AI returned invalid JSON format. Please try again.');
        }
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('AI Insights Error:', error);
      setError(error.message || 'Failed to generate insights');
      setPredictions(null);
      setAnomalies([]);
      setRecommendations([]);
      setFeedbackSentiment(null);
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async () => {
    setCompareMode(true);
    setLoading(true);
    setError(null);
    
    const results = {};
    
    for (const [key, model] of Object.entries(aiModels)) {
      try {
        const prompt = `Analyze this event and predict final attendance. Event: ${currentEvent.name}, Capacity: ${currentEvent.capacity}, Current: ${attendanceData?.current || 0}. Return only: {"predicted": number, "confidence": number}`;
        
        const response = await fetch('/api/insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model.model,
            messages: [
              { role: 'system', content: 'Respond only with valid JSON.' },
              { role: 'user', content: prompt }
            ]
          })
        });
        
        const data = await response.json();
        if (data.response) {
          const cleanText = data.response.replace(/```json|```/g, '').trim();
          const result = JSON.parse(cleanText);
          results[key] = {
            name: model.name,
            color: model.color,
            predicted: result.predicted,
            confidence: result.confidence
          };
        }
      } catch (err) {
        console.error(`Error with ${key}:`, err);
        results[key] = { error: true, name: model.name };
      }
    }
    
    setCompareResults(results);
    setLoading(false);
  };

  useEffect(() => {
    if (currentEvent) {
      generateInsights();
    } else {
      // RESET ALL STATE TO ZERO/NULL WHEN NO EVENT IS PRESENT
      setPredictions(null);
      setAnomalies([]);
      setRecommendations([]);
      setFeedbackSentiment(null);
      setError(null);
    }
  }, [currentEvent?.id, selectedAI]);

  if (loading) {
    return (
      <div className="ai-loading">
        <Loader className="ai-loading-spinner" style={{ color: aiModels[selectedAI].color }} />
        <p className="ai-loading-title">
          {aiModels[selectedAI].name} is analyzing...
        </p>
        <p className="ai-loading-subtitle">Processing event data with Workers AI</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-error-card">
        <AlertCircle className="ai-error-icon" />
        <h3 className="ai-error-title">
          Unable to Generate Insights
        </h3>
        <p className="ai-error-message">{error}</p>
        <button onClick={generateInsights} className="ai-error-button">
          <RefreshCw style={{ width: '16px', height: '16px' }} />
          Retry Analysis
        </button>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="ai-empty-state">
        <TrendingUp className="ai-empty-icon" />
        <h3 className="ai-empty-title">No Event Selected</h3>
        <p className="ai-empty-text">Select an event to generate AI-powered insights</p>
      </div>
    );
  }

  return (
    <div className="ai-insights-container">
      
      {/* New Professional Header - WITH DARK MODE CLASS */}
      <div className="ai-view-header ai-card-bg">
        <div>
          <h1 className="ai-header-title" style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            AI Predictive Analytics
          </h1>
          <p className="ai-header-subtitle" style={{ fontSize: '14px', margin: '4px 0 0 0' }}>
            Real-time event forecasting and operational recommendations powered by Cloudflare Workers AI
          </p>
        </div>
      </div>

      {/* AI Model Selection */}
      <div className="ai-model-selection-card ai-card-bg">
        <h2 className="ai-section-title">
          <Activity style={{ width: '20px', height: '20px' }} />
          Select Workers AI Model
        </h2>
        <div className="ai-models-grid">
          {Object.entries(aiModels).map(([key, ai]) => (
            <button
              key={key}
              onClick={() => setSelectedAI(key)}
              className={`ai-model-button ${selectedAI === key ? 'ai-model-button-active' : ''} ai-model-btn-bg`}
              style={{
                borderColor: selectedAI === key ? ai.color : '', // Handled by CSS for default
                borderWidth: selectedAI === key ? '3px' : '2px'
              }}>
              <div className="ai-model-icon" style={{ backgroundColor: ai.color }}>
                {ai.icon}
              </div>
              <div className="ai-model-info">
                <div className="ai-model-name">{ai.name}</div>
                <div className="ai-model-description">{ai.description}</div>
              </div>
              {selectedAI === key && (
                <CheckCircle className="ai-model-check" style={{ color: ai.color }} />
              )}
            </button>
          ))}
        </div>
        <div className="ai-controls-bar">
          <div className="ai-current-model">
            <strong>Currently using:</strong> {aiModels[selectedAI].name}
          </div>
          <div className="ai-action-buttons">
            <button onClick={runComparison} disabled={loading} className="ai-compare-button">
              <GitCompare style={{ width: '16px', height: '16px' }} />
              Compare All Models
            </button>
            <button 
              onClick={generateInsights} 
              disabled={loading} 
              className="ai-refresh-button"
              style={{ backgroundColor: aiModels[selectedAI].color }}>
              <RefreshCw style={{ width: '16px', height: '16px' }} />
              Refresh Insights
            </button>
          </div>
        </div>
      </div>

      {/* AI Comparison View */}
      {compareMode && Object.keys(compareResults).length > 0 && (
        <div className="ai-comparison-card ai-card-bg">
          <div className="ai-comparison-header">
            <h2 className="ai-section-title">
              <GitCompare style={{ width: '20px', height: '20px', color: '#7c3aed' }} />
              AI Model Comparison
            </h2>
            <button onClick={() => setCompareMode(false)} className="ai-comparison-close">
              Close Comparison
            </button>
          </div>
          <div className="ai-comparison-grid">
            {Object.entries(compareResults).map(([key, result]) => (
              <div
                key={key}
                className="ai-comparison-item"
                style={{ borderColor: result.error ? '#ef4444' : aiModels[key].color }}>
                <div className="ai-comparison-model-header">
                  <div className="ai-comparison-model-icon" style={{ backgroundColor: aiModels[key].color }}>
                    {aiModels[key].icon}
                  </div>
                  <div className="ai-comparison-model-name">{result.name}</div>
                </div>
                {result.error ? (
                  <div className="ai-comparison-error">Analysis failed</div>
                ) : (
                  <>
                    <div className="ai-comparison-predicted" style={{ color: aiModels[key].color }}>
                      {result.predicted}
                    </div>
                    <div className="ai-comparison-label">Predicted Attendance</div>
                    <div className="ai-comparison-confidence">
                      <div className="ai-comparison-confidence-bar-bg">
                        <div
                          className="ai-comparison-confidence-bar-fill"
                          style={{
                            width: `${result.confidence}%`,
                            backgroundColor: aiModels[key].color
                          }} />
                      </div>
                      <span className="ai-comparison-confidence-value" style={{ color: aiModels[key].color }}>
                        {result.confidence}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="ai-comparison-consensus">
            <div className="ai-comparison-consensus-text">
              <strong>Consensus:</strong> {(() => {
                const predictions = Object.values(compareResults)
                  .filter(r => !r.error)
                  .map(r => r.predicted);
                if (predictions.length === 0) return 'Unable to calculate';
                const avg = Math.round(predictions.reduce((a, b) => a + b, 0) / predictions.length);
                const min = Math.min(...predictions);
                const max = Math.max(...predictions);
                return `Average: ${avg} attendees (Range: ${min}-${max})`;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Insight History Timeline */}
      {insightHistory.length > 0 && !compareMode && (
        <div className="ai-history-card ai-card-bg">
          <h2 className="ai-section-title">
            <Clock style={{ width: '20px', height: '20px', color: '#2563eb' }} />
            Prediction History
          </h2>
          <div className="ai-history-list">
            {insightHistory.map((insight, idx) => (
              <div key={idx} className="ai-history-item">
                <div className="ai-history-item-left">
                  <div className="ai-history-dot" />
                  <div>
                    <div className="ai-history-event-name">{insight.eventName}</div>
                    <div className="ai-history-timestamp">
                      {new Date(insight.timestamp).toLocaleString()} • {insight.model}
                    </div>
                  </div>
                </div>
                <div className="ai-history-item-right">
                  <div className="ai-history-prediction">{insight.prediction}</div>
                  <div className="ai-history-confidence">{insight.confidence}% confidence</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!predictions ? (
        <div className="ai-empty-state ai-card-bg">
          <AlertCircle className="ai-empty-icon" />
          <h3 className="ai-empty-title">No Insights Available</h3>
          <p className="ai-empty-text">Click the button above to generate insights</p>
        </div>
      ) : (
        <>
          {/* Predictions */}
          <div className="ai-predictions-card ai-card-bg">
            <h2 className="ai-section-title">
              <TrendingUp style={{ width: '20px', height: '20px', color: aiModels[selectedAI].color }} />
              Predictive Analytics
              <span 
                className="ai-model-badge"
                style={{ 
                  backgroundColor: `${aiModels[selectedAI].color}20`,
                  color: aiModels[selectedAI].color
                }}>
                {aiModels[selectedAI].name}
              </span>
            </h2>
            <div className="ai-predictions-content">
              <div className="ai-predictions-main">
                <div className="ai-predictions-value" style={{ color: aiModels[selectedAI].color }}>
                  {predictions.predicted}
                </div>
                <div className="ai-predictions-label">Expected Final Attendance</div>
                <div className="ai-predictions-confidence">
                  <div className="ai-predictions-confidence-label">Confidence Level</div>
                  <div className="ai-predictions-confidence-bar">
                    <div className="ai-predictions-confidence-bar-bg">
                      <div 
                        className="ai-predictions-confidence-bar-fill"
                        style={{ 
                          width: `${predictions.confidence}%`,
                          backgroundColor: aiModels[selectedAI].color
                        }} />
                    </div>
                    <span className="ai-predictions-confidence-percent" style={{ color: aiModels[selectedAI].color }}>
                      {predictions.confidence}%
                    </span>
                  </div>
                </div>
                <div className="ai-predictions-range">
                  <div className="ai-predictions-range-label">Prediction Range</div>
                  <div className="ai-predictions-range-value">
                    {predictions.range[0]} - {predictions.range[1]} attendees
                  </div>
                </div>
              </div>
              <div className="ai-predictions-factors">
                <div className="ai-predictions-factors-title">Analysis Factors</div>
                {predictions.factors && predictions.factors.length > 0 ? (
                  predictions.factors.map((factor, idx) => (
                    <div key={idx} className="ai-factor-item">
                      <CheckCircle style={{ width: '20px', height: '20px', color: aiModels[selectedAI].color }} />
                      <span>{factor}</span>
                    </div>
                  ))
                ) : (
                  <p className="ai-no-data">No factors available</p>
                )}
              </div>
            </div>
          </div>

          {/* Anomalies */}
          {anomalies && anomalies.length > 0 && (
            <div className="ai-anomalies-card ai-card-bg">
              <h2 className="ai-section-title">
                <AlertCircle style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                Anomaly Detection
              </h2>
              <div className="ai-anomalies-grid">
                {anomalies.map(anomaly => {
                  const colors = { high: '#F73F52', medium: '#FFEA85', low: '#7986C7' };
                  return (
                    <div 
                      key={anomaly.id}
                      className="ai-anomaly-item"
                      style={{ 
                        borderLeftColor: colors[anomaly.severity],
                        backgroundColor: colors[anomaly.severity] + '10'
                      }}>
                      <div className="ai-anomaly-content">
                        <AlertCircle style={{ width: '20px', height: '20px', color: colors[anomaly.severity] }} />
                        <div className="ai-anomaly-info">
                          <div className="ai-anomaly-type">{anomaly.type}</div>
                          <div className="ai-anomaly-description">{anomaly.description}</div>
                          <span 
                            className="ai-anomaly-severity"
                            style={{ 
                              backgroundColor: colors[anomaly.severity] + '30',
                              color: colors[anomaly.severity]
                            }}>
                            {anomaly.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="ai-recommendations-card ai-card-bg">
              <h2 className="ai-section-title">
                <Star style={{ width: '20px', height: '20px', color: aiModels[selectedAI].color }} />
                AI Recommendations
              </h2>
              <div className="ai-recommendations-grid">
                {recommendations.map(rec => (
                  <div 
                    key={rec.id}
                    className="ai-recommendation-item"
                    style={{ borderColor: rec.color + '40' }}>
                    <div className="ai-recommendation-content">
                      <div className="ai-recommendation-icon" style={{ backgroundColor: rec.color }}>
                        <Star style={{ width: '28px', height: '28px', color: 'white' }} />
                      </div>
                      <div className="ai-recommendation-info">
                        <div className="ai-recommendation-header">
                          <div className="ai-recommendation-title">{rec.title}</div>
                          <span 
                            className="ai-recommendation-impact"
                            style={{ 
                              backgroundColor: rec.color + '20',
                              color: rec.color
                            }}>
                            {rec.impact} Impact
                          </span>
                        </div>
                        <div className="ai-recommendation-insight">{rec.insight}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment */}
          {feedbackSentiment && (
            <div className="ai-sentiment-card ai-card-bg">
              <h2 className="ai-section-title">
                <MessageSquare style={{ width: '20px', height: '20px', color: aiModels[selectedAI].color }} />
                Sentiment Analysis
              </h2>
              <div className="ai-sentiment-content">
                <div className="ai-sentiment-overview">
                  <div className="ai-sentiment-main-stat">
                    <div className="ai-sentiment-value" style={{ color: aiModels[selectedAI].color }}>
                      {feedbackSentiment.positive}%
                    </div>
                    <div className="ai-sentiment-label">Positive Sentiment</div>
                  </div>
                  {[
                    { label: 'Positive', value: feedbackSentiment.positive, color: aiModels[selectedAI].color },
                    { label: 'Neutral', value: feedbackSentiment.neutral, color: '#9ca3af' },
                    { label: 'Negative', value: feedbackSentiment.negative, color: '#F73F52' }
                  ].map(item => (
                    <div key={item.label} className="ai-sentiment-bar-item">
                      <div className="ai-sentiment-bar-header">
                        <span className="ai-sentiment-bar-label">{item.label}</span>
                        <span className="ai-sentiment-bar-value" style={{ color: item.color }}>{item.value}%</span>
                      </div>
                      <div className="ai-sentiment-bar-bg">
                        <div 
                          className="ai-sentiment-bar-fill"
                          style={{ 
                            width: `${item.value}%`,
                            backgroundColor: item.color
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ai-sentiment-themes">
                  <div className="ai-sentiment-themes-title">Top Themes</div>
                  {feedbackSentiment.themes && feedbackSentiment.themes.length > 0 ? (
                    feedbackSentiment.themes.map((theme, idx) => (
                      <div key={idx} className="ai-theme-item">
                        <span className="ai-theme-topic">{theme.topic}</span>
                        <span className="ai-theme-mentions" style={{ color: aiModels[selectedAI].color }}>
                          {theme.mentions} mentions
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="ai-no-data">No feedback themes available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Force Dark Mode Styles via Inline CSS Overrides */}
      <style>{`
        .ai-view-header {
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          padding: 32px;
          margin-bottom: 32px;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Default Light Mode Colors */
        .ai-card-bg { background-color: white; border-color: #e5e7eb; }
        .ai-header-title { color: #1f2937; }
        .ai-header-subtitle { color: #6b7280; }
        .ai-model-btn-bg { background-color: white; border-color: #e5e7eb; }
        .ai-current-model { color: #374151; }
        .ai-section-title { color: #1f2937; }
        .ai-model-name { color: #1f2937; }
        .ai-model-description { color: #6b7280; }
        .ai-comparison-label { color: #6b7280; }
        .ai-predictions-label { color: #6b7280; }
        .ai-predictions-confidence-label { color: #6b7280; }
        .ai-predictions-range-label { color: #6b7280; }
        .ai-predictions-range-value { color: #1f2937; }
        .ai-predictions-factors-title { color: #374151; }
        .ai-factor-item { color: #4b5563; }
        .ai-anomaly-type { color: #1f2937; }
        .ai-anomaly-description { color: #4b5563; }
        .ai-recommendation-title { color: #1f2937; }
        .ai-recommendation-insight { color: #4b5563; }
        .ai-sentiment-label { color: #6b7280; }
        .ai-sentiment-bar-label { color: #4b5563; }
        .ai-sentiment-themes-title { color: #374151; }
        .ai-theme-topic { color: #1f2937; }
        .ai-empty-title { color: #1f2937; }
        .ai-empty-text { color: #6b7280; }
        .ai-loading-title { color: #1f2937; }
        .ai-loading-subtitle { color: #6b7280; }
        .ai-history-event-name { color: #1f2937; }
        .ai-history-timestamp { color: #6b7280; }
        .ai-history-prediction { color: #1f2937; }
        .ai-history-confidence { color: #6b7280; }
        .ai-history-item-left .ai-history-dot { background-color: #e5e7eb; }
        .ai-comparison-model-name { color: #1f2937; }
        .ai-comparison-header { border-bottom: 1px solid #e5e7eb; }
        .ai-comparison-consensus { border-top: 1px solid #e5e7eb; }
        .ai-comparison-consensus-text { color: #374151; }

        /* DARK MODE OVERRIDES */
        body.dark-mode .ai-card-bg,
        body.dark-mode .ai-view-header,
        body.dark-mode .ai-model-selection-card,
        body.dark-mode .ai-empty-state,
        body.dark-mode .ai-error-card,
        body.dark-mode .ai-loading {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
        }

        body.dark-mode .ai-header-title,
        body.dark-mode .ai-section-title,
        body.dark-mode .ai-current-model,
        body.dark-mode .ai-predictions-range-value,
        body.dark-mode .ai-predictions-factors-title,
        body.dark-mode .ai-anomaly-type,
        body.dark-mode .ai-recommendation-title,
        body.dark-mode .ai-sentiment-themes-title,
        body.dark-mode .ai-theme-topic,
        body.dark-mode .ai-empty-title,
        body.dark-mode .ai-loading-title,
        body.dark-mode .ai-history-event-name,
        body.dark-mode .ai-history-prediction,
        body.dark-mode .ai-comparison-model-name,
        body.dark-mode .ai-comparison-consensus-text {
          color: #f3f4f6 !important;
        }

        body.dark-mode .ai-header-subtitle,
        body.dark-mode .ai-model-description,
        body.dark-mode .ai-comparison-label,
        body.dark-mode .ai-predictions-label,
        body.dark-mode .ai-predictions-confidence-label,
        body.dark-mode .ai-predictions-range-label,
        body.dark-mode .ai-factor-item,
        body.dark-mode .ai-anomaly-description,
        body.dark-mode .ai-recommendation-insight,
        body.dark-mode .ai-sentiment-label,
        body.dark-mode .ai-sentiment-bar-label,
        body.dark-mode .ai-empty-text,
        body.dark-mode .ai-loading-subtitle,
        body.dark-mode .ai-history-timestamp,
        body.dark-mode .ai-history-confidence {
          color: #9ca3af !important;
        }

        body.dark-mode .ai-model-btn-bg {
          background-color: #111827 !important;
          border-color: #374151 !important;
        }
        
        body.dark-mode .ai-model-name {
          color: #e2e8f0 !important;
        }

        body.dark-mode .ai-model-button-active {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }

        body.dark-mode .ai-history-item-left .ai-history-dot {
          background-color: #4b5563 !important;
        }

        body.dark-mode .ai-comparison-header,
        body.dark-mode .ai-comparison-consensus {
          border-color: #374151 !important;
        }
        
        body.dark-mode .ai-comparison-close {
          color: #9ca3af !important;
        }
        
        body.dark-mode .ai-comparison-close:hover {
          color: #f3f4f6 !important;
          background-color: #374151 !important;
        }
      `}</style>
    </div>
  );
};

export default AIInsights;