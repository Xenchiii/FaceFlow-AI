import cv2
import numpy as np
from typing import Dict, List, Tuple
import base64

class FaceDetector:
    """Face detection using Haar Cascade Classifier"""
    
    def __init__(self):
        # Load Haar Cascade for face detection
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        if self.face_cascade.empty():
            raise Exception("Failed to load Haar Cascade classifier")
        
        print("✅ Face Detector initialized")
    
    def detect_faces(self, image_bytes: bytes) -> Dict:
        """
        Detect faces in image
        
        Args:
            image_bytes: Image data in bytes
            
        Returns:
            Dict with detection results
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return {"error": "Invalid image data"}
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            # Extract face information
            face_list = []
            for (x, y, w, h) in faces:
                face_list.append({
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h),
                    "confidence": 0.95  # Simulated confidence
                })
            
            return {
                "face_count": len(faces),
                "faces": face_list,
                "image_size": {"width": image.shape[1], "height": image.shape[0]},
                "status": "success"
            }
            
        except Exception as e:
            return {"error": str(e), "status": "failed"}
    
    def process_frame(self, frame_bytes: bytes) -> Dict:
        """
        Process single video frame
        
        Args:
            frame_bytes: Frame data in bytes
            
        Returns:
            Dict with detection results
        """
        return self.detect_faces(frame_bytes)
    
    def estimate_demographics(self, image_bytes: bytes) -> Dict:
        """
        Estimate age and gender (aggregated, not individual)
        
        NOTE: This is a simplified version. In production,
        use pre-trained models like DeepFace for better accuracy.
        
        Args:
            image_bytes: Image data
            
        Returns:
            Dict with demographic estimates
        """
        # For now, return simulated data
        # In production, integrate age/gender detection models
        return {
            "age_distribution": {
                "18-20": 0.35,
                "21-23": 0.45,
                "24-26": 0.20
            },
            "gender_distribution": {
                "male": 0.55,
                "female": 0.45
            },
            "note": "Aggregated estimates only, privacy-preserving"
        }
    
    def calculate_crowd_density(self, face_count: int, area_sqm: float) -> float:
        """
        Calculate crowd density
        
        Args:
            face_count: Number of detected faces
            area_sqm: Area in square meters
            
        Returns:
            Density (people per square meter)
        """
        if area_sqm <= 0:
            return 0.0
        return round(face_count / area_sqm, 2)
    
    def draw_detections(self, image_bytes: bytes) -> bytes:
        """
        Draw bounding boxes on detected faces
        
        Args:
            image_bytes: Original image
            
        Returns:
            Annotated image bytes
        """
        try:
            # Convert bytes to image
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
            )
            
            # Draw rectangles
            for (x, y, w, h) in faces:
                cv2.rectangle(image, (x, y), (x+w, y+h), (121, 134, 199), 2)
                cv2.putText(
                    image, 
                    "Face", 
                    (x, y-10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.5, 
                    (121, 134, 199), 
                    2
                )
            
            # Encode back to bytes
            _, buffer = cv2.imencode('.jpg', image)
            return buffer.tobytes()
            
        except Exception as e:
            print(f"Error drawing detections: {e}")
            return image_bytes