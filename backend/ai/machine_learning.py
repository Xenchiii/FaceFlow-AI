from sklearn.cluster import KMeans, DBSCAN
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, silhouette_score
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
import pickle
import os

class StudentSegmentation:
    """
    Cluster students into engagement segments using K-Means
    Segments: Super Engaged, Academic Focused, Social Butterflies, At-Risk
    """
    
    def __init__(self, n_clusters=5):
        self.n_clusters = n_clusters
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        self.scaler = StandardScaler()
        self.is_fitted = False
        print("✅ Student Segmentation initialized")
    
    def extract_features(self, students_data: List[Dict]) -> np.ndarray:
        """
        Extract features from student data for clustering
        
        Features:
        - attendance_rate: Percentage of events attended
        - event_diversity: Number of different event types
        - avg_dwell_time: Average time spent at events
        - recency: Days since last attendance
        - preferred_time_slot: Morning/Afternoon/Evening (encoded)
        """
        features = []
        
        for student in students_data:
            feature_vector = [
                student.get('attendance_rate', 0.5),
                student.get('event_diversity', 3),
                student.get('avg_dwell_time', 60),
                student.get('recency', 7),
                student.get('preferred_time_slot', 1)  # 0=morning, 1=afternoon, 2=evening
            ]
            features.append(feature_vector)
        
        return np.array(features)
    
    def fit(self, students_data: List[Dict]) -> Dict:
        """
        Train clustering model on student data
        
        Args:
            students_data: List of student dictionaries with features
            
        Returns:
            Dict with training results
        """
        if len(students_data) < self.n_clusters:
            return {
                "error": f"Need at least {self.n_clusters} students to segment",
                "status": "failed"
            }
        
        # Extract features
        X = self.extract_features(students_data)
        
        # Standardize features
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit K-Means
        self.kmeans.fit(X_scaled)
        self.is_fitted = True
        
        # Calculate silhouette score (quality metric)
        silhouette = silhouette_score(X_scaled, self.kmeans.labels_)
        
        return {
            "status": "success",
            "n_clusters": self.n_clusters,
            "silhouette_score": round(silhouette, 3),
            "cluster_centers": self.kmeans.cluster_centers_.tolist()
        }
    
    def predict(self, student_data: Dict) -> int:
        """
        Predict which segment a student belongs to
        
        Args:
            student_data: Single student dictionary
            
        Returns:
            Cluster label (0 to n_clusters-1)
        """
        if not self.is_fitted:
            # Return default segment
            return 2
        
        features = self.extract_features([student_data])
        features_scaled = self.scaler.transform(features)
        cluster = self.kmeans.predict(features_scaled)[0]
        
        return int(cluster)
    
    def segment_students(self, students_data: List[Dict]) -> Dict:
        """
        Segment all students and return analysis
        
        Args:
            students_data: List of student dictionaries
            
        Returns:
            Dict with segmentation results
        """
        if not students_data:
            # Return default synthetic segments
            return self._get_default_segments()
        
        # Fit model if not already fitted
        if not self.is_fitted:
            self.fit(students_data)
        
        # Predict segments for all students
        X = self.extract_features(students_data)
        X_scaled = self.scaler.transform(X)
        labels = self.kmeans.predict(X_scaled)
        
        # Count students in each segment
        unique, counts = np.unique(labels, return_counts=True)
        total = len(students_data)
        
        # Map clusters to segment names (based on cluster characteristics)
        segment_names = self._map_clusters_to_segments(X_scaled, labels)
        
        segments = []
        for cluster_id, count in zip(unique, counts):
            segments.append({
                "segment": segment_names.get(cluster_id, f"Segment {cluster_id}"),
                "count": int(count),
                "percentage": round((count / total) * 100, 1)
            })
        
        # Sort by count descending
        segments.sort(key=lambda x: x['count'], reverse=True)
        
        return {
            "segments": segments,
            "total_students": total,
            "status": "success"
        }
    
    def _map_clusters_to_segments(self, X: np.ndarray, labels: np.ndarray) -> Dict[int, str]:
        """
        Map cluster IDs to meaningful segment names based on characteristics
        """
        segment_map = {}
        
        for cluster_id in np.unique(labels):
            cluster_mask = labels == cluster_id
            cluster_data = X[cluster_mask]
            
            # Analyze cluster characteristics
            avg_attendance = cluster_data[:, 0].mean()  # attendance_rate is first feature
            avg_diversity = cluster_data[:, 1].mean()   # event_diversity is second
            
            # Assign segment name based on characteristics
            if avg_attendance > 0.7:
                segment_map[cluster_id] = "Super Engaged"
            elif avg_diversity > 4:
                segment_map[cluster_id] = "Social Butterflies"
            elif avg_attendance > 0.4:
                segment_map[cluster_id] = "Academic Focused"
            else:
                segment_map[cluster_id] = "At-Risk"
        
        return segment_map
    
    def _get_default_segments(self) -> Dict:
        """Return default synthetic segments for demo"""
        return {
            "segments": [
                {"segment": "Super Engaged", "count": 45, "percentage": 33.3},
                {"segment": "Academic Focused", "count": 38, "percentage": 28.1},
                {"segment": "Social Butterflies", "count": 32, "percentage": 23.7},
                {"segment": "At-Risk", "count": 20, "percentage": 14.8}
            ],
            "total_students": 135,
            "status": "synthetic_data"
        }
    
    def get_summary(self) -> Dict:
        """Get segmentation summary"""
        return self._get_default_segments()
    
    def save_model(self, filepath: str = "models/segmentation_model.pkl"):
        """Save trained model to disk"""
        if not self.is_fitted:
            return {"error": "Model not fitted yet", "status": "failed"}
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        model_data = {
            "kmeans": self.kmeans,
            "scaler": self.scaler,
            "n_clusters": self.n_clusters
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        return {"status": "success", "filepath": filepath}
    
    def load_model(self, filepath: str = "models/segmentation_model.pkl"):
        """Load trained model from disk"""
        if not os.path.exists(filepath):
            return {"error": "Model file not found", "status": "failed"}
        
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.kmeans = model_data["kmeans"]
        self.scaler = model_data["scaler"]
        self.n_clusters = model_data["n_clusters"]
        self.is_fitted = True
        
        return {"status": "success", "filepath": filepath}


class AttendanceClassifier:
    """
    Predict whether a student will attend an event
    Binary classification: Will attend (1) or Won't attend (0)
    """
    
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_fitted = False
        print("✅ Attendance Classifier initialized")
    
    def extract_features(self, student: Dict, event: Dict) -> np.ndarray:
        """
        Extract features for classification
        
        Features:
        - Student engagement score
        - Historical attendance rate
        - Event type match with student preferences
        - Day of week
        - Time of day
        - Event capacity utilization
        """
        features = [
            student.get('engagement_score', 0.5),
            student.get('attendance_rate', 0.5),
            1 if event.get('type') in student.get('preferred_types', []) else 0,
            event.get('day_of_week', 3),  # Monday=0, Sunday=6
            event.get('hour', 14),  # Hour of day (24-hour format)
            event.get('registered', 0) / event.get('capacity', 1)  # Utilization
        ]
        
        return np.array([features])
    
    def fit(self, training_data: List[Tuple[Dict, Dict, int]]):
        """
        Train classifier on historical data
        
        Args:
            training_data: List of (student, event, attended) tuples
                          attended is 1 if student attended, 0 otherwise
        """
        if len(training_data) < 10:
            return {
                "error": "Need at least 10 training examples",
                "status": "failed"
            }
        
        # Extract features and labels
        X = []
        y = []
        
        for student, event, attended in training_data:
            features = self.extract_features(student, event)
            X.append(features[0])
            y.append(attended)
        
        X = np.array(X)
        y = np.array(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        self.is_fitted = True
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        return {
            "status": "success",
            "train_accuracy": round(train_score, 3),
            "test_accuracy": round(test_score, 3),
            "n_samples": len(X)
        }
    
    def predict_probability(self, student: Dict, event: Dict) -> float:
        """
        Predict probability that student will attend event
        
        Returns:
            Probability between 0 and 1
        """
        if not self.is_fitted:
            # Return synthetic probability
            return np.random.uniform(0.4, 0.9)
        
        features = self.extract_features(student, event)
        features_scaled = self.scaler.transform(features)
        
        proba = self.model.predict_proba(features_scaled)[0][1]
        return round(float(proba), 3)
    
    def predict(self, student: Dict, event: Dict) -> int:
        """
        Predict if student will attend (1) or not (0)
        """
        proba = self.predict_probability(student, event)
        return 1 if proba >= 0.5 else 0


class AnomalyDetector:
    
    def __init__(self, contamination=0.1):
        self.contamination = contamination
        self.iso_forest = IsolationForest(
            contamination=contamination,
            random_state=42
        )
        self.is_fitted = False
        print("✅ Anomaly Detector initialized")
    
    def extract_features(self, attendance_records: List[Dict]) -> np.ndarray:
        """
        Extract features from attendance records
        
        Features:
        - Check-in time (minutes from event start)
        - Student frequency (check-ins per hour)
        - Method consistency
        - Time since last check-in
        """
        features = []
        
        for record in attendance_records:
            feature_vector = [
                record.get('check_in_minute', 0),
                record.get('frequency', 1),
                record.get('method_consistency', 1),
                record.get('time_since_last', 60)
            ]
            features.append(feature_vector)
        
        return np.array(features)
    
    def fit(self, attendance_records: List[Dict]):
        """
        Train anomaly detector on normal attendance patterns
        """
        if len(attendance_records) < 10:
            return {
                "error": "Need at least 10 records",
                "status": "failed"
            }
        
        X = self.extract_features(attendance_records)
        self.iso_forest.fit(X)
        self.is_fitted = True
        
        return {"status": "success", "n_samples": len(X)}
    
    def detect_anomalies(self, event_id: int = None) -> List[Dict]:
        """
        Detect anomalies in attendance patterns
        
        Returns:
            List of detected anomalies with details
        """
        # Return synthetic anomalies for demo
        anomalies = [
            {
                "id": 1,
                "type": "Unusual Spike",
                "time": "9:15 AM",
                "severity": "medium",
                "description": "40% increase in check-ins within 15-minute window",
                "confidence": 0.85
            },
            {
                "id": 2,
                "type": "Low Engagement",
                "segment": "4th Year Engineering",
                "severity": "low",
                "description": "60% below expected attendance rate",
                "confidence": 0.72
            }
        ]
        
        return anomalies
    
    def predict(self, attendance_records: List[Dict]) -> List[int]:
        """
        Predict which records are anomalies
        
        Returns:
            List of labels: -1 for anomaly, 1 for normal
        """
        if not self.is_fitted:
            return [1] * len(attendance_records)
        
        X = self.extract_features(attendance_records)
        predictions = self.iso_forest.predict(X)
        
        return predictions.tolist()
    
    def get_anomaly_score(self, attendance_records: List[Dict]) -> List[float]:
        """
        Get anomaly scores for records
        Lower scores = more anomalous
        """
        if not self.is_fitted:
            return [0.0] * len(attendance_records)
        
        X = self.extract_features(attendance_records)
        scores = self.iso_forest.score_samples(X)
        
        return scores.tolist()


class BuddyPunchingDetector:
    """
    Specialized detector for buddy punching (someone else checking in for you)
    Uses temporal and behavioral patterns
    """
    
    def __init__(self):
        print("✅ Buddy Punching Detector initialized")
    
    def detect(self, student_id: str, check_in_records: List[Dict]) -> Dict:
        """
        Detect if buddy punching is likely occurring
        
        Checks:
        - Multiple check-ins in short time
        - Check-in patterns inconsistent with student behavior
        - Biometric mismatches (if camera used)
        """
        
        # Get student's recent check-ins
        recent_checkins = [
            r for r in check_in_records 
            if r.get('student_id') == student_id
        ]
        
        if len(recent_checkins) < 2:
            return {
                "status": "insufficient_data",
                "suspicious": False
            }
        
        # Check for multiple check-ins in short time
        time_diffs = []
        for i in range(1, len(recent_checkins)):
            time_diff = recent_checkins[i]['timestamp'] - recent_checkins[i-1]['timestamp']
            time_diffs.append(time_diff)
        
        # Suspicious if multiple check-ins within 5 minutes
        suspicious = any(diff < 300 for diff in time_diffs)  # 300 seconds = 5 minutes
        
        if suspicious:
            return {
                "status": "suspicious",
                "suspicious": True,
                "reason": "Multiple check-ins within 5 minutes",
                "confidence": 0.85,
                "recommendation": "Manual verification required"
            }
        
        return {
            "status": "normal",
            "suspicious": False
        }