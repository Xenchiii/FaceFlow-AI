import React from 'react';
import { Home, Camera, BarChart3, QrCode, Star, Menu, X, Moon, Sun, LogOut } from 'lucide-react';

export default function Navigation({ 
  activeTab, 
  setActiveTab, 
  darkMode, 
  toggleDarkMode, 
  isExpanded, 
  setIsExpanded,
  isMobile,
  onLogout // <--- 1. Added this prop to receive the function from App.jsx
}) {

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'camera', label: 'Camera View', icon: Camera },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'qrcodes', label: 'QR Codes', icon: QrCode },
    { id: 'recommendations', label: 'Recommendations', icon: Star }
  ];
    
  // --- FIX 2: MOBILE LOGIC ---
  // On Desktop: Expanded = 260px, Collapsed = 80px
  // On Mobile:  Expanded = 260px, Collapsed = 0px (Hidden)
  const sidebarWidth = isMobile 
    ? (isExpanded ? '260px' : '0px') 
    : (isExpanded ? '260px' : '80px');
  
  return (
    <>
      {/* Mobile Overlay: Darkens background when menu is open */}
      {isMobile && isExpanded && (
        <div 
          onClick={() => setIsExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
        />
      )}

      <aside 
        className="app-sidebar"
        style={{
          position: 'fixed', // Always fixed to stay on left
          left: 0,
          top: 0,
          height: '100vh',
          width: sidebarWidth,
          backgroundColor: '#ffffff', 
          borderRight: '1px solid #e5e7eb',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          boxShadow: isExpanded ? '4px 0 24px rgba(0,0,0,0.05)' : 'none',
          
          // --- FIX 3: SLIDE OFF SCREEN ON MOBILE ---
          // If mobile and closed -> Slide left (-100%)
          // If desktop or open -> Stay at 0
          transform: (isMobile && !isExpanded) ? 'translateX(-100%)' : 'translateX(0)',
          visibility: (isMobile && !isExpanded) ? 'hidden' : 'visible'
        }}
      >
        {/* Header & Hamburger */}
        <div style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          borderBottom: '1px solid',
          borderColor: 'inherit',
          minHeight: '80px',
          boxSizing: 'border-box'
        }}>
          {isExpanded && (
            <h1 className="nav-logo-text" style={{
              fontSize: '20px',
              fontWeight: '800',
              color: '#1e293b',
              margin: 0,
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>
              SparrowFlow
            </h1>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: isExpanded ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: '1px solid',
              borderColor: isExpanded ? 'transparent' : '#e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              padding: 0
            }}
            className="nav-toggle-btn"
          >
            {isExpanded ? 
              <X size={18} className="nav-icon-color" /> : 
              <Menu size={20} className="nav-icon-color" />
            }
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{
          flex: 1,
          padding: '24px 12px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobile && isExpanded) setIsExpanded(false);
                }}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{
                  width: isExpanded ? '100%' : '50px',
                  height: '50px',
                  margin: isExpanded ? '0' : '0 auto', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  padding: isExpanded ? '0 16px' : '0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '15px',
                  fontWeight: isActive ? '600' : '500',
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                {/* Active Indicator (Left Stripe) */}
                {isActive && isExpanded && (
                   <div style={{
                     position: 'absolute',
                     left: 0,
                     top: '10px', 
                     bottom: '10px',
                     width: '4px',
                     backgroundColor: '#3b82f6',
                     borderTopRightRadius: '4px',
                     borderBottomRightRadius: '4px'
                   }} />
                )}

                {/* Collapsed Active Background Box */}
                {isActive && !isExpanded && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '14px'
                  }} />
                )}

                <IconComponent 
                  size={22} 
                  className={isActive ? 'nav-icon-active' : ''}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{ zIndex: 1, flexShrink: 0 }}
                />
                
                {isExpanded && (
                  <span style={{
                    whiteSpace: 'nowrap',
                    marginLeft: '14px',
                    zIndex: 1,
                    opacity: 1
                  }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions Container */}
        <div style={{
          padding: isExpanded ? '0 16px' : '0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '10px',
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box'
        }}>
           
           {/* Dark Mode Toggle */}
           {isExpanded ? (
             <div 
               className="theme-toggle-container"
               onClick={toggleDarkMode}
               style={{
                 width: '100%',
                 padding: '6px',
                 borderRadius: '99px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 cursor: 'pointer',
                 border: '1px solid',
                 position: 'relative',
                 height: '44px'
               }}
             >
               <div style={{
                 position: 'absolute',
                 left: darkMode ? 'calc(100% - 50% - 4px)' : '4px',
                 top: '4px',
                 bottom: '4px',
                 width: '50%',
                 borderRadius: '99px',
                 backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                 transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                 zIndex: 0
               }} />

               <div style={{
                 flex: 1,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 zIndex: 1,
                 gap: '6px',
                 opacity: !darkMode ? 1 : 0.5,
                 transition: 'opacity 0.2s'
               }}>
                 <Sun size={18} className={!darkMode ? 'sun-glow' : ''} color={!darkMode ? '#f59e0b' : '#94a3b8'} />
                 <span style={{ fontSize: '13px', fontWeight: '600', color: !darkMode ? '#1e293b' : '#94a3b8' }}>Light</span>
               </div>

               <div style={{
                 flex: 1,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 zIndex: 1,
                 gap: '6px',
                 opacity: darkMode ? 1 : 0.5,
                 transition: 'opacity 0.2s'
               }}>
                 <Moon size={18} className={darkMode ? 'moon-glow' : ''} color={darkMode ? '#818cf8' : '#94a3b8'} />
                 <span style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#f8fafc' : '#94a3b8' }}>Dark</span>
               </div>
             </div>
           ) : (
             <button 
                onClick={toggleDarkMode}
                className="theme-btn-collapsed"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  border: '1px solid',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  padding: 0 
                }}
             >
                {darkMode ? 
                  <Moon size={22} className="moon-glow" color="#818cf8" /> : 
                  <Sun size={22} className="sun-glow" color="#f59e0b" />
                }
             </button>
           )}
        </div>

        {/* User Footer Info & Logout */}
        <div 
          className="nav-user-footer"
          style={{
            padding: '20px',
            borderTop: '1px solid',
            transition: 'background-color 0.2s',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {isExpanded ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'white',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                }}>
                  A
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h3 className="nav-user-name" style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                  }}>
                    ADMIN
                  </h3>
                  <p className="nav-user-id" style={{
                    fontSize: '12px',
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}>
                    ID: 4817120
                  </p>
                </div>
              </div>

              {/* FIX 4: ATTACH LOGOUT FUNCTION HERE */}
              <button 
                className="mini-logout-btn"
                onClick={onLogout} 
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#94a3af',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Log Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                onClick={onLogout} // FIX 5: ATTACH LOGOUT TO COLLAPSED ICON TOO
                title="Log Out"
              >
                A
              </div>
          )}
        </div>
      </aside>

      <style>{`
        /* ... (Keep existing animations: glow-sun, glow-moon) ... */
        @keyframes glow-sun {
          0% { filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.5)); transform: rotate(0deg); }
          50% { filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.8)); transform: rotate(180deg); }
          100% { filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.5)); transform: rotate(360deg); }
        }

        @keyframes glow-moon {
          0% { filter: drop-shadow(0 0 2px rgba(129, 140, 248, 0.5)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 8px rgba(129, 140, 248, 0.8)); transform: scale(1.1); }
          100% { filter: drop-shadow(0 0 2px rgba(129, 140, 248, 0.5)); transform: scale(1); }
        }

        .sun-glow { animation: glow-sun 3s infinite linear; }
        .moon-glow { animation: glow-moon 2s infinite ease-in-out; }

        .nav-icon-color { color: #64748b; }
        .nav-toggle-btn:hover { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; }
        .nav-toggle-btn:hover .nav-icon-color { color: #3b82f6; }
        
        .nav-item:hover { background-color: #f8fafc !important; color: #3b82f6 !important; }
        .nav-item.active { color: #2563eb !important; }
        
        .theme-toggle-container { background-color: #f1f5f9; border-color: #e2e8f0; }
        .theme-btn-collapsed { background-color: #f8fafc; border-color: #e2e8f0; }
        .theme-btn-collapsed:hover { background-color: #f1f5f9; border-color: #cbd5e1; }

        .nav-user-footer { border-color: #e5e7eb; background-color: transparent; }
        .nav-user-name { color: #1e293b; }
        .nav-user-id { color: #64748b; }

        .mini-logout-btn:hover { background-color: #fef2f2 !important; color: #ef4444 !important; transform: scale(1.1); }

        /* --- DARK MODE OVERRIDES --- */
        body.dark-mode .app-sidebar {
          background-color: #0f172a !important; 
          border-right-color: #1e293b !important;
        }

        body.dark-mode .nav-logo-text {
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%) !important;
          -webkit-background-clip: text !important;
        }

        body.dark-mode .nav-toggle-btn {
          border-color: #334155 !important;
        }
        body.dark-mode .nav-toggle-btn:hover {
          background-color: #1e293b !important;
        }
        body.dark-mode .nav-icon-color { color: #94a3b8; }

        body.dark-mode .nav-item { color: #94a3b8 !important; }
        body.dark-mode .nav-item:hover { background-color: #1e293b !important; color: #60a5fa !important; }
        body.dark-mode .nav-item.active { color: #60a5fa !important; }

        body.dark-mode .theme-toggle-container { background-color: #020617 !important; border-color: #1e293b !important; }
        body.dark-mode .theme-btn-collapsed { background-color: #1e293b !important; border-color: #334155 !important; }
        body.dark-mode .theme-btn-collapsed:hover { background-color: #334155 !important; border-color: #475569 !important; }

        body.dark-mode .nav-user-footer { border-color: #1e293b !important; }
        body.dark-mode .nav-user-name { color: #f8fafc !important; }
        body.dark-mode .nav-user-id { color: #94a3b8 !important; }
        
        body.dark-mode .mini-logout-btn:hover { background-color: #450a0a !important; color: #f87171 !important; }
      `}</style>
    </>
  );
}