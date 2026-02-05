import { useState, useEffect } from 'react';
import SparrowChatbot from './components/SparrowChatbot';
import CameraView from './components/CameraView';
import Dashboard from './components/Dashboard';
import RecommendationsView from './components/Recommendations'; 
import AIInsights from './components/AIInsights'; 
import AuthLogin from './components/AuthLogin';
import StudentRegistration from './components/StudentRegistration';
import QRCodesTab from './components/common/QRCodesTab';
import ImportTab from './components/common/ImportTab';
import Navigation from './Layout/Navigation';
import Footer from './Layout/Footer';
import Header from './Layout/Header';
import MobileNav from './components/MobileNav'; 
import { useAttendance } from './hooks/useAttendance';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [qrSubTab, setQrSubTab] = useState('list');
  const [isScanning, setIsScanning] = useState(false);

  // --- CENTRAL DATA HOOK ---
  const { 
    attendanceCount, 
    setAttendanceCount, 
    recentCheckIns, 
    setRecentCheckIns, 
    registerCheckIn,
    attendanceData 
  } = useAttendance();

  const [currentEvent, setCurrentEvent] = useState(() => {
    const saved = localStorage.getItem('currentEvent');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarExpanded(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { localStorage.setItem('activeTab', activeTab); }, [activeTab]);
  
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const handleLoginSuccess = (status) => {
    setIsAuthenticated(status);
    localStorage.setItem('isAuthenticated', 'true');
    setShowAdminLogin(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setShowAdminLogin(false);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.altKey && event.key === '1') {
        event.preventDefault();
        setShowAdminLogin(true);
      }
      if (event.key === 'Escape' && showAdminLogin && !isAuthenticated) {
        setShowAdminLogin(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAdminLogin, isAuthenticated]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            darkMode={darkMode}
            currentEvent={currentEvent}
            setCurrentEvent={(e) => { setCurrentEvent(e); localStorage.setItem('currentEvent', JSON.stringify(e)); }}
            attendanceCount={attendanceCount}
            attendanceData={attendanceData} 
            onNavigateToCamera={() => setActiveTab('camera')}
          />
        );
      case 'camera':
        return (
          <CameraView
            darkMode={darkMode}
            isScanning={isScanning}
            onToggleScan={() => setIsScanning(!isScanning)}
            onQRScan={registerCheckIn}  
            onNewScan={registerCheckIn} 
            recentCheckIns={recentCheckIns}
            currentEvent={currentEvent}
            attendanceCount={attendanceCount}
          />
        );
      case 'insights':
        return <AIInsights currentEvent={currentEvent} attendanceData={{ current: attendanceCount }} studentData={recentCheckIns} />;
      case 'qrcodes':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ 
              backgroundColor: darkMode ? '#1f2937' : 'white', 
              borderRadius: '12px', 
              padding: '6px', 
              display: 'flex', 
              border: '1px solid #e5e7eb' 
            }}>
              <button 
                onClick={() => setQrSubTab('list')} 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: qrSubTab === 'list' ? '#7986C7' : 'transparent', color: qrSubTab === 'list' ? 'white' : '#6b7280', fontWeight: '600', cursor: 'pointer' }}>
                List
              </button>
              <button 
                onClick={() => setQrSubTab('import')} 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: qrSubTab === 'import' ? '#7986C7' : 'transparent', color: qrSubTab === 'import' ? 'white' : '#6b7280', fontWeight: '600', cursor: 'pointer' }}>
                Import
              </button>
            </div>
            {qrSubTab === 'list' ? (
                <QRCodesTab 
                    darkMode={darkMode} 
                    refreshTrigger={attendanceCount} 
                    // --- UPDATED LOGIC FOR NAVIGATION ---
                    onNewScan={(newRecord) => {
                        registerCheckIn(newRecord); // 1. Save Data
                        setActiveTab('dashboard');  // 2. Switch to Dashboard immediately
                    }}
                />
            ) : (
                <ImportTab 
                    darkMode={darkMode} 
                    onImportComplete={() => setQrSubTab('list')} 
                    onGoToQRCodes={() => setQrSubTab('list')} 
                />
            )}
          </div>
        );
      case 'recommendations':
        return <RecommendationsView currentEvent={currentEvent} attendanceCount={attendanceCount} studentData={recentCheckIns} />;
      default:
        return <div style={{ textAlign: 'center', padding: '50px' }}>Module Not Found</div>;
    }
  };

  if (isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        backgroundColor: darkMode ? '#111827' : '#f3f4f6', 
        overflow: 'hidden' 
      }}>
        
        {!isMobile && (
          <Navigation 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            darkMode={darkMode} 
            toggleDarkMode={() => setDarkMode(!darkMode)} 
            isExpanded={isSidebarExpanded} 
            setIsExpanded={setIsSidebarExpanded} 
            onLogout={handleLogout} 
          />
        )}

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          marginLeft: isMobile ? '0' : (isSidebarExpanded ? '260px' : '80px'),
          transition: 'margin-left 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}>
          
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            isMobile={isMobile} 
            onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)} 
            onLogout={handleLogout} 
          />

          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '16px' : '24px',
            paddingBottom: isMobile ? '120px' : '24px', 
            boxSizing: 'border-box'
          }}>
            {renderContent()}
          </main>

          {!isMobile && <Footer darkMode={darkMode} />}

          {isMobile && (
            <MobileNav 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              darkMode={darkMode} 
              toggleDarkMode={() => setDarkMode(!darkMode)}
              onLogout={handleLogout}
            />
          )}

        </div>

        <SparrowChatbot 
          darkMode={darkMode} 
          onNavigate={(tab) => setActiveTab(tab)} 
        />
      </div>
    );
  }

  if (showAdminLogin) return <AuthLogin onLogin={handleLoginSuccess} />;

  return <StudentRegistration />;
}