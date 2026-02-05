import React from 'react';
import { Home, Camera, QrCode, Lightbulb, BarChart3, Moon, Sun } from 'lucide-react';

const MobileNav = ({ activeTab, setActiveTab, darkMode, toggleDarkMode }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'camera', icon: Camera, label: 'Scan' },
    { id: 'qrcodes', icon: QrCode, label: 'QR List' },
    { id: 'insights', icon: Lightbulb, label: 'AI' },
    { id: 'recommendations', icon: BarChart3, label: 'Recs' }, // Added Recommendations
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '75px',
      backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1500,
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
    }}>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: isActive ? '#7986C7' : (darkMode ? '#9ca3af' : '#6b7280'),
              cursor: 'pointer',
              flex: 1,
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute',
                top: '-15px',
                width: '20px',
                height: '3px',
                backgroundColor: '#7986C7',
                borderRadius: '2px'
              }} />
            )}

            <item.icon 
              size={20} 
              strokeWidth={isActive ? 2.5 : 2} 
              style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
            />
            
            <span style={{ 
              fontSize: '9px', 
              fontWeight: isActive ? '700' : '500',
              letterSpacing: '0.1px'
            }}>
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Theme Toggle Button */}
      <button
        onClick={toggleDarkMode}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          color: darkMode ? '#fbbf24' : '#6b7280', // Yellow in dark mode
          cursor: 'pointer',
          flex: 1,
          transition: 'all 0.2s ease'
        }}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        <span style={{ fontSize: '9px', fontWeight: '500' }}>
          {darkMode ? 'Light' : 'Dark'}
        </span>
      </button>
    </nav>
  );
};

export default MobileNav;