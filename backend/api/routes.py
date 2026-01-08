from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from datetime import datetime
import qrcode
import io
import base64
from api.attendance import AttendanceAPI
from api.events import EventsAPI
from api.analytics import AnalyticsAPI
from ai.face_recognition import FaceRecognitionService
from ai.predictions import PredictionService
from ai.sentiment import SentimentAnalysisService
from data.database import DatabaseManager
from utils.validators import validate_event_data, validate_attendance_data
from utils.helpers import generate_student_id, format_response

app = Flask(__name__)
CORS(app)

# Initialize services
db = DatabaseManager()
face_service = FaceRecognitionService()
prediction_service = PredictionService()
sentiment_service = SentimentAnalysisService()
attendance_api = AttendanceAPI(db)
events_api = EventsAPI(db)
analytics_api = AnalyticsAPI(db)

# ============================================
# HEALTH CHECK
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'database': db.check_connection(),
            'face_recognition': face_service.is_ready(),
            'predictions': prediction_service.is_ready()
        }
    })

# ============================================
# EVENT ROUTES
# ============================================

@app.route('/api/events', methods=['GET'])
def get_events():
    """Get all events"""
    try:
        events = events_api.get_all_events()
        return format_response(events, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Get specific event by ID"""
    try:
        event = events_api.get_event_by_id(event_id)
        if event:
            return format_response(event, 200)
        return format_response({'error': 'Event not found'}, 404)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/events', methods=['POST'])
def create_event():
    """Create new event"""
    try:
        data = request.json
        if not validate_event_data(data):
            return format_response({'error': 'Invalid event data'}, 400)
        
        event_id = events_api.create_event(data)
        return format_response({'event_id': event_id, 'message': 'Event created successfully'}, 201)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    """Update event"""
    try:
        data = request.json
        success = events_api.update_event(event_id, data)
        if success:
            return format_response({'message': 'Event updated successfully'}, 200)
        return format_response({'error': 'Event not found'}, 404)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Delete event"""
    try:
        success = events_api.delete_event(event_id)
        if success:
            return format_response({'message': 'Event deleted successfully'}, 200)
        return format_response({'error': 'Event not found'}, 404)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

# ============================================
# QR CODE ROUTES
# ============================================

@app.route('/api/qr/generate', methods=['POST'])
def generate_qr_code():
    """Generate QR code for event or student"""
    try:
        data = request.json
        qr_data = data.get('data')
        event_id = data.get('event_id')
        student_id = data.get('student_id')
        
        if not qr_data:
            # Generate QR data based on event and student
            qr_data = f"EVENT:{event_id}|STUDENT:{student_id}|TIMESTAMP:{datetime.now().isoformat()}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="#7986C7", back_color="#F6F6F6")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return format_response({
            'qr_code': f'data:image/png;base64,{img_str}',
            'qr_data': qr_data
        }, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/qr/validate', methods=['POST'])
def validate_qr_code():
    """Validate QR code data"""
    try:
        data = request.json
        qr_data = data.get('qr_data')
        
        # Parse QR data
        parts = qr_data.split('|')
        parsed_data = {}
        for part in parts:
            key, value = part.split(':')
            parsed_data[key.lower()] = value
        
        # Validate event exists
        event_id = parsed_data.get('event')
        event = events_api.get_event_by_id(int(event_id))
        
        if not event:
            return format_response({'valid': False, 'error': 'Invalid event'}, 400)
        
        return format_response({
            'valid': True,
            'event_id': event_id,
            'student_id': parsed_data.get('student'),
            'event': event
        }, 200)
    except Exception as e:
        return format_response({'valid': False, 'error': str(e)}, 400)

# ============================================
# ATTENDANCE ROUTES
# ============================================

@app.route('/api/attendance/checkin', methods=['POST'])
def check_in():
    """Check-in student to event"""
    try:
        data = request.json
        if not validate_attendance_data(data):
            return format_response({'error': 'Invalid attendance data'}, 400)
        
        result = attendance_api.check_in(
            event_id=data['event_id'],
            student_id=data['student_id'],
            method=data.get('method', 'QR'),
            metadata=data.get('metadata', {})
        )
        
        return format_response(result, 201)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/attendance/event/<int:event_id>', methods=['GET'])
def get_event_attendance(event_id):
    """Get attendance records for an event"""
    try:
        records = attendance_api.get_event_attendance(event_id)
        return format_response(records, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/attendance/student/<student_id>', methods=['GET'])
def get_student_attendance(student_id):
    """Get attendance history for a student"""
    try:
        records = attendance_api.get_student_attendance(student_id)
        return format_response(records, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/attendance/realtime/<int:event_id>', methods=['GET'])
def get_realtime_attendance(event_id):
    """Get real-time attendance stats"""
    try:
        stats = attendance_api.get_realtime_stats(event_id)
        return format_response(stats, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

# ============================================
# FACE RECOGNITION ROUTES
# ============================================

@app.route('/api/face/detect', methods=['POST'])
def detect_faces():
    """Detect faces in uploaded image"""
    try:
        if 'image' not in request.files:
            return format_response({'error': 'No image provided'}, 400)
        
        image = request.files['image']
        result = face_service.detect_faces(image)
        
        return format_response(result, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/face/recognize', methods=['POST'])
def recognize_face():
    """Recognize student from face"""
    try:
        if 'image' not in request.files:
            return format_response({'error': 'No image provided'}, 400)
        
        image = request.files['image']
        event_id = request.form.get('event_id')
        
        result = face_service.recognize_student(image)
        
        if result['recognized']:
            # Auto check-in
            attendance_api.check_in(
                event_id=event_id,
                student_id=result['student_id'],
                method='FACE',
                metadata={'confidence': result['confidence']}
            )
        
        return format_response(result, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/face/register', methods=['POST'])
def register_face():
    """Register student face for recognition"""
    try:
        if 'image' not in request.files:
            return format_response({'error': 'No image provided'}, 400)
        
        image = request.files['image']
        student_id = request.form.get('student_id')
        
        result = face_service.register_student(student_id, image)
        return format_response(result, 201)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

# ============================================
# ANALYTICS ROUTES
# ============================================

@app.route('/api/analytics/dashboard/<int:event_id>', methods=['GET'])
def get_dashboard_analytics(event_id):
    """Get dashboard analytics for event"""
    try:
        analytics = analytics_api.get_dashboard_data(event_id)
        return format_response(analytics, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/analytics/timeseries/<int:event_id>', methods=['GET'])
def get_timeseries_data(event_id):
    """Get time-series attendance data"""
    try:
        data = analytics_api.get_timeseries_data(event_id)
        return format_response(data, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/analytics/demographics/<int:event_id>', methods=['GET'])
def get_demographics(event_id):
    """Get demographic breakdown"""
    try:
        demographics = analytics_api.get_demographics(event_id)
        return format_response(demographics, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/analytics/engagement/<int:event_id>', methods=['GET'])
def get_engagement_segments(event_id):
    """Get student engagement segments"""
    try:
        segments = analytics_api.get_engagement_segments(event_id)
        return format_response(segments, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

# ============================================
# AI PREDICTION ROUTES
# ============================================

@app.route('/api/predictions/attendance/<int:event_id>', methods=['GET'])
def predict_attendance(event_id):
    """Predict final attendance for event"""
    try:
        prediction = prediction_service.predict_final_attendance(event_id)
        return format_response(prediction, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/predictions/anomalies/<int:event_id>', methods=['GET'])
def detect_anomalies(event_id):
    """Detect anomalies in attendance patterns"""
    try:
        anomalies = prediction_service.detect_anomalies(event_id)
        return format_response(anomalies, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/predictions/recommendations', methods=['POST'])
def get_recommendations():
    """Get AI recommendations for event planning"""
    try:
        data = request.json
        recommendations = prediction_service.generate_recommendations(data)
        return format_response(recommendations, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

# ============================================
# SENTIMENT ANALYSIS ROUTES
# ============================================

@app.route('/api/sentiment/analyze', methods=['POST'])
def analyze_sentiment():
    """Analyze feedback sentiment"""
    try:
        data = request.json
        feedback_texts = data.get('feedback', [])
        
        result = sentiment_service.analyze_batch(feedback_texts)
        return format_response(result, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/sentiment/event/<int:event_id>', methods=['GET'])
def get_event_sentiment(event_id):
    """Get sentiment analysis for event feedback"""
    try:
        sentiment = sentiment_service.get_event_sentiment(event_id)
        return format_response(sentiment, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

# ============================================
# STUDENT ROUTES
# ============================================

@app.route('/api/students', methods=['GET'])
def get_students():
    """Get all students"""
    try:
        students = db.get_all_students()
        return format_response(students, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/students/<student_id>', methods=['GET'])
def get_student(student_id):
    """Get student profile"""
    try:
        student = db.get_student_by_id(student_id)
        if student:
            return format_response(student, 200)
        return format_response({'error': 'Student not found'}, 404)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/students', methods=['POST'])
def create_student():
    """Create new student"""
    try:
        data = request.json
        student_id = db.create_student(data)
        return format_response({'student_id': student_id, 'message': 'Student created successfully'}, 201)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/students/<student_id>/recommendations', methods=['GET'])
def get_student_recommendations(student_id):
    """Get personalized event recommendations for student"""
    try:
        recommendations = prediction_service.get_student_recommendations(student_id)
        return format_response(recommendations, 200)
    except Exception as e:
        return format_response({'error': str(e)}, 500)

# ============================================
# EXPORT ROUTES
# ============================================

@app.route('/api/export/attendance/<int:event_id>', methods=['GET'])
def export_attendance(event_id):
    """Export attendance data as CSV"""
    try:
        csv_file = attendance_api.export_to_csv(event_id)
        return send_file(
            csv_file,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'attendance_event_{event_id}.csv'
        )
    except Exception as e:
        return format_response({'error': str(e)}, 500)

@app.route('/api/export/analytics/<int:event_id>', methods=['GET'])
def export_analytics(event_id):
    """Export analytics report as PDF"""
    try:
        pdf_file = analytics_api.export_to_pdf(event_id)
        return send_file(
            pdf_file,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'analytics_event_{event_id}.pdf'
        )
    except Exception as e:
        return format_response({'error': str(e)}, 500)

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return format_response({'error': 'Resource not found'}, 404)

@app.errorhandler(500)
def internal_error(error):
    return format_response({'error': 'Internal server error'}, 500)

# ============================================
# RUN APP
# ============================================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)