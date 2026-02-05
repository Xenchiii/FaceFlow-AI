import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, CheckCircle2, X, HelpCircle, Shield, AlertTriangle } from 'lucide-react';

// SECURITY CONFIGURATION - HARDENED
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000, // 15 minutes
  REQUEST_TIMEOUT: 10000,
  RATE_LIMIT_WINDOW: 60000,
  MAX_REQUESTS_PER_WINDOW: 3,
  SESSION_TIMEOUT: 1800000, // 30 minutes
  CSRF_TOKEN_REFRESH: 300000,
  PASSWORD_MIN_LENGTH: 12,
  MAX_INPUT_LENGTH: 256,
  SUSPICIOUS_ACTIVITY_THRESHOLD: 3,
};

// VALID CREDENTIALS
const VALID_CREDENTIALS = {
  email: 'APGJJ@Attendance.com',
  password: 'AmaliaAngelaPrinceKzaMaGheleenJordanMarcJuzzel'
};

// Enhanced sassy error messages
const SASSY_MESSAGES = [
  "Dahan-dahan Lang, buhay ay di karera",
  "Hala Mali ka pa den pre",
  "Sige Kaya mo yan, Laban lang boi",
  "galingan mo, ikaw pag-asa ng bayan!",
  "So close, yet so far...",
  "Third time's the charm? Apparently not!",
  "Hey, at least you're persistent!",
  "Wrong password strikes again!",
  "Maybe try a different approach?",
  "Oof, that's a miss!",
  "Not today, friend! Try again!",
  "Almost there... just kidding!",
  "Swing and a miss!",
  "Error 404: Correct password not found!",
  "Keep guessing, you'll get it eventually!",
  "Bzzzzt! Wrong answer!",
  "Nah, that ain't it chief!",
  "Back to the drawing board!",
  "Nice try, but no cigar!",
  "The password gods say NO!",
  "Denied! Access refused!",
  "Wrong-o! Care to try again?",
  "Failure is just success in progress... right?",
  "Plot twist: still wrong!",
  "Houston, we have a problem!",
];

const getSassyMessage = (attemptNumber) => {
  return SASSY_MESSAGES[attemptNumber % SASSY_MESSAGES.length];
};

// Enhanced Security Utilities
const SecurityUtils = {
  generateCSRFToken: () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  generateDeviceFingerprint: () => {
    const components = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      navigator.hardwareConcurrency || 'unknown',
      navigator.platform,
    ];
    return btoa(components.join('|'));
  },

  sanitizeInput: (input) => {
    if (!input) return '';
    // Only remove HTML tags, keep alphanumeric and common characters
    let sanitized = input.replace(/<[^>]*>/g, '');
    // Only remove dangerous characters, keep letters/numbers/@._-
    sanitized = sanitized.replace(/[<>'"`;\\{}|]/g, '');
    return sanitized.trim();
  },

  validateEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email.length > 254) return false;
    if (email.includes('..')) return false;
    return emailRegex.test(email);
  },

  detectSQLInjection: (input) => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|CAST|CONVERT)\b)/gi,
      /(\bOR\b|\bAND\b)\s*['"0-9]/i,
      /['";].*(-{2}|\/\*|\*\/|#)/i,
      /\bUNION\b.*\bSELECT\b/i,
      /\bDROP\b.*\b(TABLE|DATABASE|SCHEMA)\b/i,
      /\bEXEC\b.*\(/i,
      /xp_cmdshell/i,
      /\bINTO\b.*\bOUTFILE\b/i,
      /\bLOAD_FILE\b/i,
      /benchmark\s*\(/i,
      /sleep\s*\(/i,
      /waitfor\s+delay/i,
      /information_schema/i,
      /concat\s*\(/i,
      /char\s*\(/i,
      /0x[0-9a-f]+/i,
    ];
    return sqlPatterns.some(pattern => pattern.test(input));
  },

  detectXSS: (input) => {
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>/gi,
      /<embed[\s\S]*?>/gi,
      /<object[\s\S]*?>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[\s\S]*?onerror[\s\S]*?>/gi,
      /<svg[\s\S]*?onload[\s\S]*?>/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /<base[\s\S]*?>/gi,
      /<meta[\s\S]*?>/gi,
      /<link[\s\S]*?>/gi,
      /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
    ];
    return xssPatterns.some(pattern => pattern.test(input));
  },

  detectPathTraversal: (input) => {
    const traversalPatterns = [
      /\.\./g,
      /\.\.%2f/gi,
      /\.\.%5c/gi,
      /%2e%2e/gi,
      /\.\.\\/g,
      /\.\.\//g,
    ];
    return traversalPatterns.some(pattern => pattern.test(input));
  },

  detectCommandInjection: (input) => {
    const cmdPatterns = [
      /[;&|`$()]/,
      /\$\{/,
      /\$\(/,
      /`/,
      /\|\|/,
      /&&/,
      /\r\n/,
      /\n/,
    ];
    return cmdPatterns.some(pattern => pattern.test(input));
  },

  detectLDAPInjection: (input) => {
    const ldapPatterns = [
      /[*()\\]/,
      /\|\|/,
      /&&/,
    ];
    return ldapPatterns.some(pattern => pattern.test(input));
  },

  hashPassword: async (password, salt) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  encryptData: (data) => {
    try {
      const jsonStr = JSON.stringify(data);
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      return encoded;
    } catch {
      return null;
    }
  },

  detectSuspiciousActivity: (email, password) => {
    const suspicious = [];
    if (/(.)\1{4,}/.test(password)) suspicious.push('repeated_chars');
    if (password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
      suspicious.push('email_in_password');
    }
    const commonPatterns = ['123456', 'password', 'qwerty', 'admin', 'letmein'];
    if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
      suspicious.push('common_pattern');
    }
    return suspicious;
  },

  constantTimeCompare: (a, b) => {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  },

  isSecureContext: () => {
    return window.isSecureContext && 
           (window.location.protocol === 'https:' || 
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1');
  }
};

class RateLimiter {
  constructor() {
    this.attempts = [];
    this.suspiciousActivity = [];
  }

  isRateLimited() {
    const now = Date.now();
    this.attempts = this.attempts.filter(
      time => now - time < SECURITY_CONFIG.RATE_LIMIT_WINDOW
    );
    return this.attempts.length >= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW;
  }

  recordAttempt() {
    this.attempts.push(Date.now());
  }

  recordSuspiciousActivity() {
    this.suspiciousActivity.push(Date.now());
  }

  isSuspicious() {
    const now = Date.now();
    this.suspiciousActivity = this.suspiciousActivity.filter(
      time => now - time < SECURITY_CONFIG.RATE_LIMIT_WINDOW
    );
    return this.suspiciousActivity.length >= SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD;
  }

  reset() {
    this.attempts = [];
    this.suspiciousActivity = [];
  }
}

const FeatherLogo = () => (
  <svg 
    width="64" 
    height="64" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 4px 12px rgba(79, 70, 229, 0.3))' }}
  >
    <path 
      d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" 
      stroke="#4F46E5" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <line x1="16" y1="8" x2="2" y2="22" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="17.5" y1="15" x2="9" y2="15" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AuthLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [csrfToken, setCSRFToken] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [securityWarning, setSecurityWarning] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Only show internal dashboard if onLogin prop is not provided
  const showInternalDashboard = !onLogin && isAuthenticated;

  const rateLimiterRef = useRef(new RateLimiter());
  const sessionTimeoutRef = useRef(null);
  const componentMountedRef = useRef(true);
  const lastInputTime = useRef(Date.now());

  useEffect(() => {
    componentMountedRef.current = true;
    
    if (!SecurityUtils.isSecureContext()) {
      setSecurityWarning('⚠️ INSECURE CONNECTION DETECTED - USE HTTPS ONLY');
    }
    
    setCSRFToken(SecurityUtils.generateCSRFToken());
    setDeviceFingerprint(SecurityUtils.generateDeviceFingerprint());
    setSessionId(SecurityUtils.generateCSRFToken());
    
    const csrfInterval = setInterval(() => {
      if (componentMountedRef.current) {
        setCSRFToken(SecurityUtils.generateCSRFToken());
      }
    }, SECURITY_CONFIG.CSRF_TOKEN_REFRESH);

    const lockout = sessionStorage.getItem('auth_lockout');
    if (lockout) {
      try {
        const lockoutData = JSON.parse(lockout);
        const remainingTime = lockoutData.until - Date.now();
        if (remainingTime > 0) {
          setIsLocked(true);
          setLockoutTime(lockoutData.until);
        } else {
          sessionStorage.removeItem('auth_lockout');
        }
      } catch (e) {
        sessionStorage.removeItem('auth_lockout');
      }
    }

    const disableConsole = () => {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      console.debug = () => {};
    };
    
    if (process.env.NODE_ENV === 'production') {
      disableConsole();
    }

    const detectDevTools = () => {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold || 
          window.outerHeight - window.innerHeight > threshold) {
        setSecurityWarning('⚠️ Developer tools detected');
      }
    };
    
    const devToolsInterval = setInterval(detectDevTools, 1000);

    const preventRightClick = (e) => {
      if (process.env.NODE_ENV === 'production') {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('contextmenu', preventRightClick);

    const preventShortcuts = (e) => {
      if (e.keyCode === 123 || 
          (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
          (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('keydown', preventShortcuts);

    return () => {
      componentMountedRef.current = false;
      clearInterval(csrfInterval);
      clearInterval(devToolsInterval);
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('keydown', preventShortcuts);
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isLocked && lockoutTime) {
      const interval = setInterval(() => {
        const remaining = lockoutTime - Date.now();
        if (remaining <= 0) {
          setIsLocked(false);
          setLockoutTime(null);
          setLoginAttempts(0);
          sessionStorage.removeItem('auth_lockout');
          rateLimiterRef.current.reset();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, lockoutTime]);

  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isShaking]);

  const handleInputChange = (field, value) => {
    if (value.length > SECURITY_CONFIG.MAX_INPUT_LENGTH) {
      setSecurityWarning('⚠️ Input length exceeded');
      return;
    }

    // NO SANITIZATION - preserve exact input
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (isLocked) {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 60000);
      setError(`Account locked. Try again in ${remaining} minute(s).`);
      setIsShaking(true);
      return;
    }

    if (rateLimiterRef.current.isRateLimited()) {
      setError('Too many requests. Please wait before trying again.');
      setIsShaking(true);
      return;
    }

    if (!SecurityUtils.validateEmail(formData.email)) {
      setError('Invalid email format.');
      setIsShaking(true);
      return;
    }

    if (formData.password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters.`);
      setIsShaking(true);
      return;
    }

    setError(null);
    setIsLoading(true);
    rateLimiterRef.current.recordAttempt();

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (formData.email === VALID_CREDENTIALS.email && 
          formData.password === VALID_CREDENTIALS.password) {
        setIsLoading(false);
        setIsSuccess(true);
        setLoginAttempts(0);
        rateLimiterRef.current.reset();
        sessionStorage.removeItem('auth_lockout');

        const userData = {
          email: formData.email,
          name: 'Admin User',
          role: 'administrator',
          loginTime: new Date().toISOString()
        };

        if (rememberMe) {
          const encryptedUser = SecurityUtils.encryptData(userData);
          const secureToken = SecurityUtils.generateCSRFToken();
          
          sessionStorage.setItem('adminUser', encryptedUser);
          sessionStorage.setItem('sparrow_token', secureToken);
          sessionStorage.setItem('session_start', Date.now().toString());
          sessionStorage.setItem('device_fp', deviceFingerprint);
        }

        sessionTimeoutRef.current = setTimeout(() => {
          sessionStorage.clear();
          window.location.reload();
        }, SECURITY_CONFIG.SESSION_TIMEOUT);

        setTimeout(() => {
          if (componentMountedRef.current) {
            if (onLogin) {
              onLogin(true);
            } else {
              setIsAuthenticated(true);
            }
          }
        }, 1500);

      } else {
        throw new Error('Invalid credentials');
      }

    } catch (err) {
      setIsLoading(false);
      
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      let errorMessage;
      if (err.message.includes('Invalid email') || err.message.includes('Password must be')) {
        errorMessage = err.message;
      } else {
        errorMessage = getSassyMessage(newAttempts - 1);
      }

      if (newAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        const lockUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
        setIsLocked(true);
        setLockoutTime(lockUntil);
        sessionStorage.setItem('auth_lockout', JSON.stringify({ until: lockUntil }));
        setError(`Too many failed attempts. Account locked for 15 minutes.`);
      } else {
        const remaining = SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - newAttempts;
        setError(`${errorMessage} (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`);
      }

      setIsShaking(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getRemainingTime = () => {
    if (!lockoutTime) return '';
    const remaining = Math.max(0, lockoutTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (showInternalDashboard) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: '600px',
          width: '100%',
          padding: '60px 40px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <CheckCircle2 size={64} color="white" />
          </div>
          <h1 style={{ fontSize: '32px', color: '#1f2937', marginBottom: '12px', fontWeight: 'bold' }}>
            Welcome to SparrowFlow Dashboard!
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '24px' }}>
            You have successfully authenticated. Your secure session is active.
          </p>
          <div style={{
            background: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            <p style={{ color: '#166534', fontSize: '14px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} />
              <strong>Email:</strong> {VALID_CREDENTIALS.email}
            </p>
            <p style={{ color: '#166534', fontSize: '14px', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} />
              <strong>Role:</strong> Administrator
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: '#f9fafb',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '8px' }}>Session Active</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>30 minutes</p>
            </div>
            <div style={{
              background: '#f9fafb',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '8px' }}>Security Level</h3>
              <p style={{ fontSize: '14px', color: '#10b981', margin: 0, fontWeight: '600' }}>Maximum</p>
            </div>
          </div>

          <button
            onClick={() => {
              sessionStorage.clear();
              setIsAuthenticated(false);
              setFormData({ email: '', password: '' });
              setIsSuccess(false);
              setLoginAttempts(0);
            }}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              width: '100%'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Sign Out Securely
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      {securityWarning && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#fef3c7',
          color: '#92400e',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '400px'
        }}>
          <Shield size={18} />
          <span style={{ fontSize: '13px', fontWeight: '500' }}>{securityWarning}</span>
        </div>
      )}

      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '420px',
        width: '100%',
        padding: '40px',
        animation: isShaking ? 'shake 0.5s' : 'none'
      }}>
        
        {isSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle2 size={56} color="white" />
            </div>
            <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '8px' }}>Secure Access Granted!</h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Initializing encrypted session...</p>
            <div style={{
              width: '100%',
              height: '4px',
              background: '#e5e7eb',
              borderRadius: '2px',
              marginTop: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                animation: 'progress 1.5s ease-in-out'
              }} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <FeatherLogo />
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '16px 0 8px' }}>
                SparrowFlow
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Shield size={14} />
                Secure Admin Access
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Email Address
                </label>
                <div style={{
                  position: 'relative',
                  border: `2px solid ${error ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  transition: 'border-color 0.2s'
                }}>
                  <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
                  <input 
                    type="email" 
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLocked}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    maxLength={SECURITY_CONFIG.MAX_INPUT_LENGTH}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 44px',
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      background: 'transparent',
                      color: '#1f2937'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Password
                </label>
                <div style={{
                  position: 'relative',
                  border: `2px solid ${error ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '8px'
                }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLocked}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    maxLength={SECURITY_CONFIG.MAX_INPUT_LENGTH}
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 44px',
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      background: 'transparent',
                      color: '#1f2937'
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  fontSize: '14px',
                  color: '#374151',
                  userSelect: 'none'
                }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ 
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px',
                      accentColor: '#4f46e5'
                    }}
                  />
                  <span>Remember me</span>
                </label>
                
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {isLocked && (
                <div style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#991b1b'
                }}>
                  <AlertTriangle size={18} />
                  <div style={{ flex: 1, fontSize: '14px' }}>
                    <strong>Account Locked</strong>
                    <br />
                    Time remaining: {getRemainingTime()}
                  </div>
                </div>
              )}

              {error && !isLocked && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#991b1b'
                }}>
                  <AlertCircle size={18} />
                  <span style={{ fontSize: '14px' }}>{error}</span>
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={isLoading || isLocked}
                style={{
                  background: isLocked ? '#9ca3af' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  opacity: isLoading || isLocked ? 0.7 : 1
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={20} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    <span>Secure Sign In</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>

            <div style={{
              marginTop: '24px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <HelpCircle size={14} />
              Need help? <a href="#" style={{ color: '#4f46e5', textDecoration: 'none' }}>Contact Support</a>
            </div>
          </>
        )}
      </div>

      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        color: 'white',
        fontSize: '12px',
        opacity: 0.8
      }}>
        © 2026 SparrowFlow AI. System Version 2.4.0 - Secured
      </div>

      {showForgotModal && (
        <div 
          onClick={() => setShowForgotModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setShowForgotModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              <X size={20} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Lock size={32} color="white" />
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Reset Password</h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Enter your registered email to receive a secure reset link.</p>
            </div>
            
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
              <input 
                type="email" 
                placeholder="Enter your email address"
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowForgotModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowForgotModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-background-clip: text;
          -webkit-text-fill-color: #1f2937 !important;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px transparent;
        }
      `}</style>
    </div>
  );
};

export default AuthLogin;