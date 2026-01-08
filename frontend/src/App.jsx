import { useState } from 'react';

// Views
import CameraView from './views/CameraView';
import DashboardView from './views/DashboardView';
import InsightsView from './views/InsightsView';
import RecommendationsView from './views/RecommendationsView';

// Common Components
import QRCodeGenerator from './components/common/QRCodeGenerator';

// Logic Hooks
import { useAttendance } from './hooks/useAttendance';
import { useEvents } from './hooks/useEvents';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  
  const { attendanceCount, recentCheckIns, registerCheckIn } = useAttendance();
  const { events, currentEvent, selectEvent } = useEvents();

  const [showQRModal, setShowQRModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(true);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'camera', label: 'Camera View', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { id: 'insights', label: 'Insights', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'qrcodes', label: 'QR Codes', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
    { id: 'recommendations', label: 'Recommendations', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            events={events}
            currentEvent={currentEvent} 
            onEventSelect={selectEvent} 
            attendanceCount={attendanceCount}
            onGenerateQR={() => setShowQRModal(true)}
          />
        );
      case 'camera':
        return (
          <CameraView 
            isScanning={isScanning}
            onToggleScan={() => setIsScanning(!isScanning)}
            onQRScan={registerCheckIn}
            recentCheckIns={recentCheckIns}
            showCamera={showCamera}
            onToggleCamera={() => setShowCamera(!showCamera)}
          />
        );
      case 'insights':
        return <InsightsView />;
      case 'qrcodes':
        return (
          <div className="qr-generator">
            <h3>QR Code Generator</h3>
            <label htmlFor="qrInput">Enter Text or URL</label>
            <input type="text" id="qrInput" placeholder="Enter text, URL, or data..." />
            <button onClick={() => alert('Generate QR Code')}>Generate QR Code</button>
          </div>
        );
      case 'recommendations':
        return <RecommendationsView />;
      default:
        return (
          <div className="placeholder-content">
            <div className="placeholder-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2>Section Under Development</h2>
            <p>This feature is coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand">
          <h1>FaceFlow AI</h1>
          <p>Facial Recognition Platform</p>
        </div>

        {/* Navigation */}
        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="dark-mode-toggle" onClick={toggleDarkMode}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {darkMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              )}
            </svg>
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>

          <div className="user-profile">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <h3>ADMIN</h3>
              <p>ID: 00000</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="welcome">
            <h2>Welcome, Admin!</h2>
            <p>Here are the latest updates...</p>
          </div>
          <button className="logout-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </header>

        {/* Content Area */}
        <main className="content-area">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="footer">
          <div>
            <strong>Connect With Us</strong>
            <div className="connect-icons">
              <div className="connect-icon">F</div>
              <div className="connect-icon">T</div>
              <div className="connect-icon">I</div>
              <div className="connect-icon">L</div>
            </div>
            <p style={{ marginTop: '20px' }}>© 2026 FaceFlow AI. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* QR Modal */}
      {showQRModal && activeTab !== 'qrcodes' && (
        <QRCodeGenerator 
          isOpen={showQRModal} 
          onClose={() => setShowQRModal(false)} 
          event={currentEvent} 
        />
      )}
    </div>
  );
}