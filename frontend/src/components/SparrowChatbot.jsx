import { useState, useEffect } from 'react';
import { X, Send, Bird, Zap, QrCode, Upload, Download } from 'lucide-react';

export default function SparrowChatbot({ onNavigate, darkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m Sparrow, your AI assistant. How can I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [birdPosition, setBirdPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    const interval = setInterval(() => {
      setBirdPosition({
        x: Math.sin(Date.now() / 1000) * 10,
        y: Math.cos(Date.now() / 1500) * 8
      });
    }, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const conversationHistory = messages
        .slice(1)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          history: conversationHistory
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      
      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        throw new Error(data.error || 'Invalid response');
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}. Please try again!`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action, tabName) => {
    setMessages(prev => [...prev, { role: 'user', content: action }]);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: `Navigating to ${action}...` }]);
      if (onNavigate) onNavigate(tabName);
      if (isMobile) setIsOpen(false); // Close on mobile to show navigation result
    }, 400);
  };

  return (
    <>
      {/* Floating Bird Button */}
      {!isOpen && (
        <div
          className="sparrow-float-btn"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: isMobile ? '85px' : '30px', // Lifted on mobile to clear navbars
            right: isMobile ? '20px' : '30px',
            width: isMobile ? '60px' : '70px',
            height: isMobile ? '60px' : '70px',
            borderRadius: '50%',
            backgroundColor: '#7986C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(121, 134, 199, 0.4)',
            zIndex: 1000,
            transform: `translate(${birdPosition.x}px, ${birdPosition.y}px)`,
            transition: 'all 0.3s ease-out',
          }}>
          <Bird size={isMobile ? 32 : 40} color="white" strokeWidth={2} />
          <div style={{
            position: 'absolute', top: '5px', right: '5px', width: '12px', height: '12px',
            borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid white'
          }}/>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="sparrow-window"
          style={{
            position: 'fixed',
            bottom: isMobile ? '0' : '30px',
            right: isMobile ? '0' : '30px',
            width: isMobile ? '100%' : '400px',
            height: isMobile ? '100%' : '600px',
            maxHeight: isMobile ? '100%' : 'calc(100vh - 60px)',
            backgroundColor: darkMode ? '#1f2937' : 'white',
            borderRadius: isMobile ? '0' : '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2000, // Highest layer on mobile
            overflow: 'hidden',
            border: isMobile ? 'none' : '1px solid #e5e7eb'
        }}>
          {/* Header */}
          <div style={{
              background: 'linear-gradient(135deg, #7986C7 0%, #5a6bb8 100%)',
              padding: isMobile ? '16px' : '20px',
              paddingTop: isMobile ? 'calc(16px + env(safe-area-inset-top))' : '20px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                <Bird size={24} color="#7986C7" strokeWidth={2} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Sparrow AI</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                cursor: 'pointer', padding: '8px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              <X size={24} />
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: darkMode ? '#111827' : '#f3f4f6',
            borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap'
          }} className="no-scrollbar">
             <div style={{display:'flex', alignItems:'center', gap:'6px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize:'12px', fontWeight:'600', marginRight:'4px'}}>
                <Zap size={14} fill="currentColor" /> Quick:
             </div>
             <button onClick={() => handleQuickAction('View QR Codes', 'qrcodes')} className="quick-action-chip">
                <QrCode size={14} /> View QRs
             </button>
             <button onClick={() => handleQuickAction('Import Students', 'import')} className="quick-action-chip">
                <Upload size={14} /> Import
             </button>
             <button onClick={() => handleQuickAction('Camera View', 'camera')} className="quick-action-chip">
                <Download size={14} /> Scan
             </button>
          </div>

          {/* Messages */}
          <div style={{
              flex: 1, overflowY: 'auto', padding: '20px',
              backgroundColor: darkMode ? '#111827' : '#f9fafb',
              display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                    maxWidth: '85%', padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: msg.role === 'user' ? '#7986C7' : (darkMode ? '#374151' : 'white'),
                    color: msg.role === 'user' ? 'white' : (darkMode ? '#f3f4f6' : '#1f2937'),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', borderRadius: '18px', backgroundColor: darkMode ? '#374151' : 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} className="sparrow-typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9ca3af', animation: `bounce 1.4s infinite ${i * 0.2}s` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
              padding: '16px',
              backgroundColor: darkMode ? '#1f2937' : 'white',
              borderTop: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
              paddingBottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : '16px'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                disabled={isTyping}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '12px',
                  border: '1px solid #e5e7eb', outline: 'none',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : 'black',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                style={{
                  padding: '12px', borderRadius: '12px', border: 'none',
                  backgroundColor: (inputMessage.trim() && !isTyping) ? '#7986C7' : '#e5e7eb',
                  color: 'white', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .quick-action-chip {
            background: white; border: 1px solid #e5e7eb; border-radius: 16px;
            padding: 6px 12px; font-size: 12px; font-weight: 500; color: #374151;
            cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
        }
        .quick-action-chip:hover { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-10px); } }
        @keyframes pulse { 0%, 100% { box-shadow: 0 8px 24px rgba(121, 134, 199, 0.4); } 50% { box-shadow: 0 8px 32px rgba(121, 134, 199, 0.6); } }
        
        body.dark-mode .quick-action-chip { background-color: #374151 !important; border-color: #4b5563 !important; color: #d1d5db !important; }
        body.dark-mode .quick-action-chip:hover { background-color: #064e3b !important; color: #86efac !important; border-color: #059669 !important; }
      `}</style>
    </>
  );
}