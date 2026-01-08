import { Camera, CheckCircle, Pause, Play, QrCode } from 'lucide-react';
import { useRef, useState } from 'react';
import './CameraView.css';

export default function CameraView({ 
  isScanning = false, 
  onToggleScan = () => {}, 
  onQRScan = () => {}, 
  recentCheckIns = [], 
  showCamera = true, 
  onToggleCamera = () => {} 
}) {
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, success, error
  const videoRef = useRef(null);

  // Simulate QR scan
  const handleScan = () => {
    setScanStatus('scanning');
    
    // Simulate scan delay
    setTimeout(() => {
      const mockQRData = {
        id: `USER-${Math.floor(Math.random() * 10000)}`,
        name: `User ${Math.floor(Math.random() * 100)}`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setScanResult(mockQRData);
      setScanStatus('success');
      onQRScan(mockQRData);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setScanStatus('idle');
        setScanResult(null);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="camera-view">
      {/* Header */}
      <div className="view-header">
        <div className="header-content">
          <div className="header-icon">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h2 className="view-title">Camera View</h2>
            <p className="view-subtitle">Scan QR codes for facial recognition check-in</p>
          </div>
        </div>
      </div>

      <div className="camera-content">
        {/* Camera Section */}
        <div className="camera-section">
          <div className="camera-container">
            {showCamera ? (
              <div className="camera-feed">
                <div className="scan-overlay">
                  <div className="scan-corners">
                    <div className="corner top-left"></div>
                    <div className="corner top-right"></div>
                    <div className="corner bottom-left"></div>
                    <div className="corner bottom-right"></div>
                  </div>
                  
                  {scanStatus === 'scanning' && (
                    <div className="scanning-line"></div>
                  )}
                  
                  <QrCode className="qr-icon" />
                  
                  {scanStatus === 'success' && scanResult && (
                    <div className="scan-success">
                      <CheckCircle className="w-16 h-16" />
                      <h3>Scan Successful!</h3>
                      <p>{scanResult.name}</p>
                      <span className="user-id">ID: {scanResult.id}</span>
                    </div>
                  )}
                  
                  {scanStatus === 'idle' && (
                    <div className="scan-instruction">
                      <p>Position QR code within frame</p>
                    </div>
                  )}
                </div>
                
                {/* Camera placeholder */}
                <div className="camera-placeholder">
                  <Camera className="w-24 h-24 text-gray-400" />
                </div>
              </div>
            ) : (
              <div className="camera-off">
                <Camera className="w-24 h-24 text-gray-400" />
                <h3>Camera is Off</h3>
                <p>Enable camera to start scanning</p>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="camera-controls">
            <button 
              onClick={onToggleCamera}
              className={`control-btn ${showCamera ? 'active' : ''}`}
            >
              <Camera className="w-5 h-5" />
              {showCamera ? 'Camera On' : 'Camera Off'}
            </button>
            
            <button 
              onClick={handleScan}
              disabled={!showCamera || scanStatus === 'scanning'}
              className="control-btn scan-btn"
            >
              <QrCode className="w-5 h-5" />
              {scanStatus === 'scanning' ? 'Scanning...' : 'Scan QR Code'}
            </button>
            
            <button 
              onClick={onToggleScan}
              className={`control-btn ${isScanning ? 'active' : ''}`}
            >
              {isScanning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isScanning ? 'Stop' : 'Start'} Auto-Scan
            </button>
          </div>

          {/* Scan Status */}
          <div className="scan-stats">
            <div className="stat-item">
              <div className="stat-label">Total Scans Today</div>
              <div className="stat-value">{recentCheckIns.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Scan Status</div>
              <div className="stat-value">
                {scanStatus === 'scanning' ? 'Scanning...' : 
                 scanStatus === 'success' ? 'Success' : 'Ready'}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Camera Status</div>
              <div className="stat-value">{showCamera ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="recent-checkins">
          <h3>Recent Check-ins</h3>
          
          {recentCheckIns.length > 0 ? (
            <div className="checkin-list">
              {recentCheckIns.slice(0, 8).map((checkin, index) => (
                <div key={index} className="checkin-item">
                  <div className="checkin-avatar">
                    {checkin.name ? checkin.name.charAt(0) : 'U'}
                  </div>
                  <div className="checkin-info">
                    <h4>{checkin.name || 'Unknown User'}</h4>
                    <p>ID: {checkin.id || 'N/A'}</p>
                  </div>
                  <div className="checkin-time">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{checkin.timestamp || 'Just now'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-checkins">
              <QrCode className="w-12 h-12 text-gray-400" />
              <p>No check-ins yet</p>
              <span>Scan QR codes to see check-ins here</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}