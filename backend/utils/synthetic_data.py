import json
import random
from datetime import datetime, timedelta

def get_synthetic_students():
    """Generate synthetic student data"""
    programs = ['Computer Science', 'Information Tech', 'Engineering', 'Business Admin']
    years = [1, 2, 3, 4]
    
    students = []
    for i in range(500):
        student = {
            "student_id": f"2024-{random.choice(['CS', 'IT', 'ENG', 'BUS'])}-{str(i+1).zfill(3)}",
            "year_level": random.choice(years),
            "program": random.choice(programs),
            "age": random.randint(18, 24),
            "gender": random.choice(['Male', 'Female']),
            "engagement_score": round(random.uniform(0.2, 0.95), 2)
        }
        students.append(student)
    
    return students

def get_synthetic_events():
    """Generate synthetic event data"""
    events = [
        {
            "id": 1,
            "name": "Tech Innovation Seminar",
            "date": "2026-01-15",
            "time": "09:00 AM",
            "venue": "Main Auditorium",
            "capacity": 200,
            "type": "seminar",
            "registered": 187
        },
        {
            "id": 2,
            "name": "Sports Fest Opening",
            "date": "2026-01-20",
            "time": "08:00 AM",
            "venue": "Sports Complex",
            "capacity": 500,
            "type": "sports",
            "registered": 456
        },
        {
            "id": 3,
            "name": "AI Workshop Series",
            "date": "2026-01-25",
            "time": "02:00 PM",
            "venue": "Computer Lab 1",
            "capacity": 150,
            "type": "workshop",
            "registered": 142
        }
    ]
    return events