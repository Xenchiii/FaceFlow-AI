import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer 
        className="app-footer"
        style={{
          backgroundColor: 'transparent',
          borderTop: '1px solid #e5e7eb',
          padding: '20px',
          textAlign: 'center',
          marginTop: 'auto' // Pushes footer to bottom if content is short
        }}
      >
        <p className="footer-copyright" style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
          © {currentYear} SparrowFlow AI. All rights reserved.
        </p>
      </footer>

      <style>{`
        /* Dark Mode Support */
        body.dark-mode .app-footer {
          border-top-color: #374151 !important;
        }
        
        body.dark-mode .footer-copyright {
          color: #9ca3af !important; /* Stays neutral, or use #d1d5db for lighter text */
        }
      `}</style>
    </>
  );
};

export default Footer;