import React, { useState, useEffect, useRef } from 'react';
import { Camera, PlayCircle, PauseCircle, QrCode, UserCheck, Eye, EyeOff, Brain, Database, TrendingUp, Zap, CheckCircle } from 'lucide-react';

const CameraView = ({ currentEvent, attendanceCount, setAttendanceCount, recentCheckIns, setRecentCheckIns }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const canvasRef = useRef(null);

  // Simulate camera and face detection
  useEffect(() => {
    if (isScanning && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const simulateVideo = setInterval(() => {
        if (context && canvas) {
          // Draw simulated camera feed
          context.fillStyle = '#2a2a2a';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw simulated face detection boxes
          const numFaces = Math.floor(Math.random() * 3) + 1;
          context.strokeStyle = '#7986C7';
          context.lineWidth = 3;
          
          for (let i = 0; i < numFaces; i++) {
            const x = Math.random() * (canvas.width - 100);
            const y = Math.random() * (canvas.height - 100);
            context.strokeRect(x, y, 80, 100);
          }
          
          setAttendanceCount(prev => Math.min(prev + numFaces, currentEvent?.capacity || 200));
        }
      }, 2000);

      return () => clearInterval(simulateVideo);
    }
  }, [isScanning, currentEvent, setAttendanceCount]);

  // Simulate QR check-ins
  const simulateQRCheckIn = () => {
    const programs = ['Computer Science', 'Information Tech', 'Engineering', 'Business Admin'];
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    
    const newCheckIn = {
      id: Date.now(),
      studentId: `2024-${Math.floor(Math.random() * 9000) + 1000}`,
      program: programs[Math.floor(Math.random() * programs.length)],
      year: years[Math.floor(Math.random() * years.length)],
      time: new Date().toLocaleTimeString(),
      method: 'QR'
    };

    setRecentCheckIns(prev => [newCheckIn, ...prev.slice(0, 9)]);
    setAttendanceCount(prev => prev + 1);
  };

  // Auto check-in simulation
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          simulateQRCheckIn();
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5" style={{ color: '#7986C7' }} />
                Computer Vision Station
              </h2>
              <button
                onClick={() => setShowCamera(!showCamera)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                {showCamera ? (
                  <Eye className="w-5 h-5 text-gray-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>

            {showCamera ? (
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <canvas 
                  ref={canvasRef}
                  width={640}
                  height={400}
                  className="w-full h-full"
                />
                {isScanning && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-lg text-white text-sm font-medium flex items-center gap-2" style={{ backgroundColor: '#7986C7' }}>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Detecting Faces
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-60 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-white text-sm">
                    <div>
                      <div className="text-gray-300 text-xs mb-1">Faces Detected</div>
                      <div className="text-2xl font-bold">{isScanning ? Math.floor(Math.random() * 3) + 1 : 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-300 text-xs mb-1">Processing FPS</div>
                      <div className="text-2xl font-bold">{isScanning ? '30' : '0'}</div>
                    </div>
                    <div>
                      <div className="text-gray-300 text-xs mb-1">Accuracy</div>
                      <div className="text-2xl font-bold">95%</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height: '400px' }}>
                <div className="text-center">
                  <EyeOff className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Camera feed hidden</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setIsScanning(!isScanning)}
                className="flex-1 py-3 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2"
                style={{ backgroundColor: isScanning ? '#F73F52' : '#7986C7' }}
              >
                {isScanning ? (
                  <>
                    <PauseCircle className="w-5 h-5" />
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    Start Scanning
                  </>
                )}
              </button>
              <button
                onClick={simulateQRCheckIn}
                className="px-6 py-3 rounded-lg font-semibold text-gray-900 transition border-2"
                style={{ 
                  borderColor: '#FFEA85',
                  backgroundColor: '#FFEA85'
                }}
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* AI Processing Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" style={{ color: '#7986C7' }} />
              AI Processing Pipeline
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Camera className="w-8 h-8 mx-auto mb-2" style={{ color: '#7986C7' }} />
                <div className="text-xs font-medium text-gray-900">Computer Vision</div>
                <div className="text-xs text-gray-500 mt-1">Face Detection</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Database className="w-8 h-8 mx-auto mb-2" style={{ color: '#F73F52' }} />
                <div className="text-xs font-medium text-gray-900">Machine Learning</div>
                <div className="text-xs text-gray-500 mt-1">Segmentation</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: '#FFEA85' }} />
                <div className="text-xs font-medium text-gray-900">Predictive</div>
                <div className="text-xs text-gray-500 mt-1">Forecasting</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Zap className="w-8 h-8 mx-auto mb-2" style={{ color: '#5B6FA8' }} />
                <div className="text-xs font-medium text-gray-900">Real-time</div>
                <div className="text-xs text-gray-500 mt-1">Updates</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5" style={{ color: '#7986C7' }} />
              Recent Check-ins
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {recentCheckIns.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No check-ins yet. Start scanning to see activity.
                </div>
              ) : (
                recentCheckIns.map(checkIn => (
                  <div key={checkIn.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900 text-sm">{checkIn.studentId}</div>
                      <CheckCircle className="w-4 h-4" style={{ color: '#7986C7' }} />
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{checkIn.year} • {checkIn.program}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{checkIn.time}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ 
                        backgroundColor: '#7986C7' + '20',
                        color: '#7986C7'
                      }}>
                        {checkIn.method}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraView;