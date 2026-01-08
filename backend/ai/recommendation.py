from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class EventRecommender:
    """Recommend events to students"""
    
    def __init__(self):
        print("✅ Event Recommender initialized")
    
    def get_recommendations(self, student_id, limit=5):
        """Get personalized recommendations"""
        # Simulated recommendations
        recommendations = [
            {
                "event_name": "Machine Learning Bootcamp",
                "match": 94,
                "date": "2026-02-05",
                "reason": "Based on your attendance at AI Workshop"
            },
            {
                "event_name": "Data Science Seminar",
                "match": 89,
                "date": "2026-02-12",
                "reason": "Students like you rated this 4.8/5"
            },
            {
                "event_name": "Hackathon 2026",
                "match": 87,
                "date": "2026-02-20",
                "reason": "Similar to Coding Competition"
            }
        ]
        return recommendations[:limit]
    
    def get_similar_events(self, event_id, limit=5):
        """Get similar events"""
        similar = [
            {"event_id": 10, "name": "Advanced AI Workshop", "similarity": 0.92},
            {"event_id": 15, "name": "Python Programming", "similarity": 0.85},
            {"event_id": 22, "name": "Tech Talk Series", "similarity": 0.78}
        ]
        return similar[:limit]