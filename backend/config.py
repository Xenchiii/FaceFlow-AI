import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    
    # Database
    DATABASE_URI = os.getenv('DATABASE_URI', 'postgresql://localhost/faceflow')
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/faceflow')
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # Face Recognition
    FACE_RECOGNITION_TOLERANCE = float(os.getenv('FACE_TOLERANCE', '0.6'))
    FACE_MODEL = os.getenv('FACE_MODEL', 'large')
    
    # ML Models
    MODEL_PATH = os.getenv('MODEL_PATH', './models')
    PREDICTION_CONFIDENCE_THRESHOLD = float(os.getenv('PREDICTION_THRESHOLD', '0.7'))
    
    # QR Code
    QR_VERSION = int(os.getenv('QR_VERSION', '1'))
    QR_BOX_SIZE = int(os.getenv('QR_BOX_SIZE', '10'))
    QR_BORDER = int(os.getenv('QR_BORDER', '4'))
    
    # File Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # API Settings
    API_RATE_LIMIT = os.getenv('API_RATE_LIMIT', '100 per minute')
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # Analytics
    ANALYTICS_CACHE_TTL = int(os.getenv('ANALYTICS_CACHE_TTL', '300'))  # 5 minutes
    
    # Email (for notifications)
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_USE_TLS = True