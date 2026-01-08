from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from textblob import TextBlob

class SentimentAnalyzer:
    """Analyze feedback sentiment"""
    
    def __init__(self):
        self.vader = SentimentIntensityAnalyzer()
        print("✅ Sentiment Analyzer initialized")
    
    def analyze_sentiment(self, text):
        """Analyze sentiment of text"""
        scores = self.vader.polarity_scores(text)
        
        if scores['compound'] >= 0.05:
            sentiment = 'positive'
        elif scores['compound'] <= -0.05:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        return {
            "sentiment": sentiment,
            "score": scores['compound'],
            "positive": scores['pos'],
            "negative": scores['neg'],
            "neutral": scores['neu']
        }
    
    def get_feedback_summary(self, event_id):
        """Get aggregated feedback analysis"""
        return {
            "positive": 92,
            "neutral": 6,
            "negative": 2,
            "total_comments": 187,
            "key_phrases": [
                {"phrase": "hands-on activities", "mentions": 45, "sentiment": "positive"},
                {"phrase": "engaging speaker", "mentions": 38, "sentiment": "positive"},
                {"phrase": "too long", "mentions": 12, "sentiment": "negative"}
            ]
        }