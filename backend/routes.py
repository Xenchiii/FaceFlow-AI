from flask import Flask, jsonify
from flask_cors import CORS
from api.attendance import attendance_bp
from api.events import events_bp

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
app.register_blueprint(events_bp, url_prefix='/api/events')

@app.route('/')
def health_check():
    return jsonify({"status": "healthy", "service": "FaceFlow AI Backend"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)