from flask import Blueprint, jsonify, request
import uuid
from datetime import datetime

attendance_bp = Blueprint('attendance', __name__)

# Functional In-Memory Storage
attendance_log = []

@attendance_bp.route('/check-in', methods=['POST'])
def check_in():
    data = request.json
    record = {
        "id": str(uuid.uuid4()),
        "student_id": data.get('student_id'),
        "event_id": data.get('event_id'),
        "timestamp": datetime.now().isoformat(),
        "method": data.get('method', 'camera')
    }
    attendance_log.append(record)
    return jsonify({"status": "success", "record": record}), 201

@attendance_bp.route('/stats', methods=['GET'])
def get_stats():
    return jsonify({
        "total_checked_in": len(attendance_log),
        "recent": attendance_log[-5:]
    })