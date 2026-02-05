import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Settings, Clock, Calendar, X, CheckCircle, 
  MessageSquare, AlertTriangle, Volume2, Mail, ChevronDown, ChevronUp,
  Activity, ShieldCheck, User, Moon, Sun
} from 'lucide-react';

const Header = ({ darkMode, isMobile, setDarkMode, onLogout }) => { 
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // -- DROPDOWN STATES --
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState(null); 
  
  // -- REFS --
  const notifRef = useRef(null);
  const settingsRef = useRef(null);

  // -- SETTINGS STATE --
  const [settings, setSettings] = useState({
    emailAlerts: true,
    soundEffects: false,
  });

  // -- NOTIFICATIONS STATE --
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // -- LIVE CLOCK --
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // -- LIVE NOTIFICATION API CONNECTION --
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const formatted = data.map(n => ({
            id: n.id,
            type: n.type, 
            title: n.title,
            text: n.text_summary,
            detail: n.detail_body,
            time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: Boolean(n.is_read)
          }));
          
          setNotifications(formatted);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // -- CLICK OUTSIDE HANDLER --
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (settingsRef.current && !settingsRef.current.contains(event.target)) setShowSettings(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // -- HELPERS --
  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (expandedNotifId === id) setExpandedNotifId(null);
  };

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedNotifId(expandedNotifId === id ? null : id);
  };

  const toggleSetting = (key, e) => {
    e.stopPropagation();
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <header 
        className="app-header"
        style={{
          height: '80px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 32px',
          flexShrink: 0,
          transition: 'background-color 0.3s, border-color 0.3s',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 50
        }}
      >
        {/* Left Side - Welcome Message */}
        <div style={{ minWidth: 0 }}>
          <h2 className="header-title" style={{ 
            margin: 0, 
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700', 
            color: '#111827',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {isMobile ? 'Welcome!' : 'Welcome, Admin!'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span className="status-dot"></span>
            <p className="header-subtitle" style={{ 
              margin: 0, 
              color: '#6b7280', 
              fontSize: '13px',
              fontWeight: '500'
            }}>
              System Online
            </p>
          </div>
        </div>

        {/* Right Side - Widgets & Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '24px' }}>
          
          {!isMobile && (
            <div className="header-widget" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              backgroundColor: '#f9fafb',
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} className="widget-icon" style={{ color: '#7986C7' }} />
                <span className="widget-text" style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  {formatDate(currentDate)}
                </span>
              </div>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#d1d5db' }} className="widget-divider"></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} className="widget-icon" style={{ color: '#7986C7' }} />
                <span className="widget-text" style={{ fontSize: '13px', fontWeight: '600', color: '#374151', minWidth: '60px' }}>
                  {formatTime(currentDate)}
                </span>
              </div>
            </div>
          )}

          {/* Icons Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '12px', position: 'relative' }}>
            
            {/* --- NOTIFICATIONS BUTTON --- */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                className={`header-icon-btn ${showNotifications ? 'active' : ''}`}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowSettings(false);
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="dropdown-menu" style={{ right: isMobile ? '-50px' : '-10px', width: isMobile ? '280px' : '320px' }}>
                  <div className="dropdown-header">
                    <h3>Notifications</h3>
                    <button onClick={markAllRead} className="text-btn">Mark all read</button>
                  </div>
                  <div className="dropdown-content custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="empty-state">
                        <Bell size={24} style={{ opacity: 0.3 }} />
                        <p>No new notifications</p>
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const isExpanded = expandedNotifId === notif.id;
                        return (
                          <div 
                            key={notif.id} 
                            className={`notif-item ${!notif.read ? 'unread' : ''} ${isExpanded ? 'expanded' : ''}`}
                            onClick={(e) => toggleExpand(notif.id, e)} 
                          >
                            <div className="notif-header-row">
                                <div className={`notif-icon ${notif.type}`}>
                                  {notif.type === 'qr' && <CheckCircle size={14} />}
                                  {notif.type === 'feedback' && <MessageSquare size={14} />}
                                  {notif.type === 'alert' && <AlertTriangle size={14} />}
                                </div>
                                <div className="notif-info">
                                  <div style={{display:'flex', justifyContent:'space-between'}}>
                                    <p className="notif-title">{notif.title}</p>
                                    <span className="notif-time">{notif.time}</span>
                                  </div>
                                  <p className="notif-text">{notif.text}</p>
                                </div>
                                <button className="notif-close" onClick={(e) => removeNotification(notif.id, e)}>
                                  <X size={12} />
                                </button>
                            </div>
                            {isExpanded && (
                                <div className="notif-expanded-content">
                                    {notif.detail}
                                </div>
                            )}
                            <div className="notif-hover-controls">
                                {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="dropdown-footer">
                    <button className="view-all-btn">View All Activity</button>
                  </div>
                </div>
              )}
            </div>
            
            {/* --- SETTINGS BUTTON --- ENSURED VISIBLE ON MOBILE --- */}
            <div ref={settingsRef} style={{ position: 'relative' }}>
              <button 
                className={`header-icon-btn ${showSettings ? 'active' : ''}`}
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowNotifications(false);
                }}
              >
                <Settings size={20} />
              </button>

              {showSettings && (
                <div className="dropdown-menu settings-menu" style={{ right: isMobile ? '0px' : '-10px', width: isMobile ? '260px' : '300px' }}>
                  <div className="dropdown-header">
                    <h3>Header Preferences</h3>
                  </div>
                  <div className="dropdown-content">
                    
                    {/* User Summary Section */}
                    <div className="setting-section-label">ACCOUNT</div>
                    <div className="setting-item static">
                      <div className="setting-label">
                        <User size={16} />
                        <div style={{display:'flex', flexDirection:'column'}}>
                           <span style={{fontWeight:'700'}}>System Admin</span>
                           <span style={{fontSize:'11px', color:'#6b7280'}}>Primary Controller</span>
                        </div>
                      </div>
                    </div>

                    {/* NEW: THEME TOGGLE FOR MOBILE/DESKTOP */}
                    <div className="setting-section-label">APPEARANCE</div>
                    <div className="setting-item" onClick={(e) => { e.stopPropagation(); setDarkMode(!darkMode); }}>
                      <div className="setting-label">
                        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                        <span>{darkMode ? 'Switch to Light' : 'Switch to Dark'}</span>
                      </div>
                      <div className={`toggle-switch ${darkMode ? 'on' : ''}`}>
                        <div className="toggle-handle"></div>
                      </div>
                    </div>

                    {/* Email Alerts Toggle */}
                    <div className="setting-section-label">ALERTS</div>
                    <div className="setting-item" onClick={(e) => toggleSetting('emailAlerts', e)}>
                      <div className="setting-label">
                        <Mail size={16} />
                        <span>Email Alerts</span>
                      </div>
                      <div className={`toggle-switch ${settings.emailAlerts ? 'on' : ''}`}>
                        <div className="toggle-handle"></div>
                      </div>
                    </div>

                    <div className="setting-item" onClick={(e) => toggleSetting('soundEffects', e)}>
                      <div className="setting-label">
                        <Volume2 size={16} />
                        <span>Sound Effects</span>
                      </div>
                      <div className={`toggle-switch ${settings.soundEffects ? 'on' : ''}`}>
                        <div className="toggle-handle"></div>
                      </div>
                    </div>

                    {!isMobile && (
                      <>
                        <div className="setting-section-label">DIAGNOSTICS</div>
                        <div className="setting-item static">
                          <div className="setting-label">
                            <Activity size={16} color="#10b981" />
                            <span>API Latency: 24ms</span>
                          </div>
                        </div>
                      </>
                    )}

                  </div>
                  <div className="dropdown-footer">
                     <p style={{margin:0, fontSize:'10px', color:'#9ca3af'}}>SparrowFlow v2.4.0-Stable</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      <style>{`
        .header-icon-btn {
          position: relative;
          padding: 10px;
          border-radius: 50%;
          background-color: transparent;
          border: none;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .header-icon-btn:hover, .header-icon-btn.active {
          background-color: #f3f4f6;
          color: #7986C7;
          transform: translateY(-2px);
        }

        .notification-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          min-width: 14px;
          height: 14px;
          padding: 0 3px;
          border-radius: 10px;
          background-color: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
        }

        .dropdown-menu {
          position: absolute;
          top: 50px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          z-index: 100;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-header {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dropdown-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }

        .text-btn {
          background: none;
          border: none;
          color: #7986C7;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .dropdown-content {
          max-height: 400px;
          overflow-y: auto;
        }

        .notif-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f9fafb;
          transition: background 0.2s;
          position: relative;
          cursor: pointer;
          flex-direction: column;
          display: flex;
          align-items: stretch;
        }

        .notif-header-row {
            display: flex;
            gap: 12px;
            align-items: start;
        }

        .notif-item:hover {
          background-color: #f9fafb;
        }

        .notif-item.unread { background-color: #f0fdf4; }
        .notif-item.expanded { background-color: #f3f4f6; }

        .notif-item.unread::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background-color: #10b981;
        }

        .notif-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-icon.qr { background-color: #d1fae5; color: #059669; }
        .notif-icon.feedback { background-color: #ede9fe; color: #7c3aed; }
        .notif-icon.alert { background-color: #fee2e2; color: #dc2626; }

        .notif-info { flex: 1; }
        .notif-title { margin: 0; font-size: 13px; font-weight: 700; color: #111827; }
        .notif-text { margin: 0; font-size: 13px; color: #374151; line-height: 1.4; }
        .notif-time { font-size: 11px; color: #9ca3af; display: block; }
        .notif-close { background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px; opacity: 0.5; }

        .notif-expanded-content {
            margin-top: 10px;
            margin-left: 40px;
            font-size: 12px;
            color: #4b5563;
            background: #ffffff;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            line-height: 1.4;
            animation: fadeIn 0.2s ease-in;
        }

        .notif-hover-controls { position: absolute; right: 10px; bottom: 5px; opacity: 0; transition: opacity 0.2s; color: #9ca3af; }
        .notif-item:hover .notif-hover-controls { opacity: 1; }

        .setting-section-label {
          padding: 12px 16px 4px 16px;
          font-size: 10px;
          font-weight: 800;
          color: #9ca3af;
          letter-spacing: 0.05em;
        }

        .setting-item {
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .setting-item.static { cursor: default; }
        .setting-item:not(.static):hover { background-color: #f9fafb; }

        .setting-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #374151;
        }

        .toggle-switch {
          width: 36px;
          height: 20px;
          background-color: #e5e7eb;
          border-radius: 20px;
          position: relative;
          transition: background 0.3s;
        }

        .toggle-switch.on { background-color: #7986C7; }
        .toggle-handle { width: 16px; height: 16px; background-color: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: transform 0.3s; }
        .toggle-switch.on .toggle-handle { transform: translateX(16px); }

        .dropdown-footer {
          padding: 10px;
          background-color: #f9fafb;
          border-top: 1px solid #f3f4f6;
          text-align: center;
        }

        .view-all-btn {
          width: 100%;
          padding: 8px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          border-radius: 6px;
        }

        .view-all-btn:hover { color: #7986C7; background-color: #f0f9ff; }

        body.dark-mode .app-header { background-color: #1f2937 !important; border-bottom-color: #374151 !important; }
        body.dark-mode .header-title { color: #f3f4f6 !important; }
        body.dark-mode .header-subtitle { color: #9ca3af !important; }
        body.dark-mode .header-widget { background-color: #111827 !important; border-color: #374151 !important; }
        body.dark-mode .widget-text { color: #e5e7eb !important; }
        body.dark-mode .header-icon-btn { color: #9ca3af !important; }
        body.dark-mode .dropdown-menu { background-color: #1f2937 !important; border-color: #374151 !important; }
        body.dark-mode .dropdown-header h3 { color: #f3f4f6 !important; }
        body.dark-mode .notif-item { border-bottom-color: #374151 !important; }
        body.dark-mode .notif-title { color: #f3f4f6 !important; }
        body.dark-mode .notif-text { color: #e5e7eb !important; }
        body.dark-mode .notif-expanded-content { background: #1f2937 !important; border-color: #374151 !important; color: #d1d5db !important; }
        body.dark-mode .setting-label { color: #e5e7eb !important; }
        body.dark-mode .setting-item:not(.static):hover { background-color: #111827 !important; }
        body.dark-mode .dropdown-footer { background-color: #111827 !important; border-top-color: #374151 !important; }

        .status-dot {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-green 2s infinite;
        }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </>
  );
};

export default Header;