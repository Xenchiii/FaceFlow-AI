from datetime import datetime
import json

def format_timestamp(dt):
    """Format datetime to string"""
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def calculate_percentage(part, total):
    """Calculate percentage"""
    if total == 0:
        return 0
    return round((part / total) * 100, 2)

def generate_id(prefix="ID"):
    """Generate unique ID"""
    timestamp = datetime.now().timestamp()
    return f"{prefix}-{int(timestamp)}"