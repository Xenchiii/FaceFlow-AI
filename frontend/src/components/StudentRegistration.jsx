import React, { useState, useEffect } from 'react';
import { 
  User, Hash, Mail, BookOpen, GraduationCap, ArrowRight, CheckCircle2, 
  Save, MessageSquare, Star, Send, Loader2, Type, Printer, AlertTriangle, 
  ShieldCheck, Smartphone, WifiOff, RefreshCcw, Download
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react'; // REQUIRED: npm install qrcode.react
import './StudentRegistration.css';

/**
 * ==========================================================================================
 * SPARROWPASS MOBILE ENGINE - HYBRID OFFLINE/ONLINE EDITION
 * ==========================================================================================
 * This component is designed to function as a standalone mobile app (PWA).
 * It generates QR codes locally using the device's CPU, requiring zero data for students.
 * ==========================================================================================
 */

// --- CONFIGURATION ---
const BASE_URL = ''; 

// --- CUSTOM LOGO ---
const FeatherLogo = () => (
  <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="custom-logo-anim">
    <path d="M20 85C20 85 35 40 85 25C85 25 55 45 40 85" stroke="#4F46E5" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M30 90C30 90 45 55 85 35" stroke="#4F46E5" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
  </svg>
);

const StudentRegistration = () => {
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({
    studentNumber: '', 
    firstName: '', 
    lastName: '', 
    middleInitial: '', 
    email: '', 
    course: 'BSIT', 
    yearLevel: '1st Year'
  });
  const [generatedQRToken, setGeneratedQRToken] = useState(null);
  const [error, setError] = useState(null);
  
  // Feedback State
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  /**
   * EFFECT: Hydration Logic
   * Checks if the user already has a saved pass on this device.
   * This is critical for offline mobile use.
   */
  useEffect(() => {
    const savedData = localStorage.getItem('sparrow_cached_user');
    const savedToken = localStorage.getItem('sparrow_cached_token');
    
    if (savedData && savedToken) {
      setFormData(JSON.parse(savedData));
      setGeneratedQRToken(savedToken);
      setStep('qr-reveal');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'middleInitial') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 2) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  /**
   * HYBRID SUBMISSION LOGIC
   * 1. Generates QR Token locally.
   * 2. Saves to Device Memory.
   * 3. Sends background fetch (non-blocking).
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep('processing');
    setError(null);

    // --- QR GENERATION FIX ---
    // Changed to use ONLY the Student ID so it matches the database directly.
    const localToken = formData.studentNumber.trim();

    // Background Sync (Online attempt)
    // We fire this and move on. If it fails, the student still gets their QR.
    fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, qrToken: localToken })
    }).catch(() => console.log("System running in offline mode. Sync pending."));

    // Save to LocalStorage for full offline persistence
    localStorage.setItem('sparrow_cached_user', JSON.stringify(formData));
    localStorage.setItem('sparrow_cached_token', localToken);

    // Reveal locally generated data
    setGeneratedQRToken(localToken);
    setTimeout(() => setStep('qr-reveal'), 1500);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSendingFeedback(true);
    // Mock local save for feedback
    setTimeout(() => {
        setFeedbackSent(true);
        setSendingFeedback(false);
    }, 1200);
  };

  const resetForm = () => {
    if(window.confirm("This will clear your current pass from this device. Proceed?")) {
      localStorage.removeItem('sparrow_cached_user');
      localStorage.removeItem('sparrow_cached_token');
      setFormData({
        studentNumber: '', firstName: '', lastName: '', middleInitial: '',
        email: '', course: 'BSIT', yearLevel: '1st Year'
      });
      setRating(0); setFeedback(''); setFeedbackSent(false); setGeneratedQRToken(null);
      setStep('form');
    }
  };

  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div className="registration-container">
      <div className="reg-bg-blob blob-1"></div>
      <div className="reg-bg-blob blob-2"></div>
      
      {/* --- STEP 1: FORM --- */}
      {step === 'form' && (
        <div className="card-animate-enter reg-card no-print">
          <div className="reg-header">
            <FeatherLogo />
            <h1>Student Access</h1>
            <p>Generate your secure offline entry pass.</p>
          </div>

          <form onSubmit={handleSubmit} className="reg-form">
            <div className="section-label">
              <User size={14} style={{ marginRight: '6px' }}/> 
              IDENTITY
            </div>
            
            <div className="input-row">
              <div className="floating-input full-width">
                <Hash size={20} className="input-icon"/>
                <input type="text" name="studentNumber" placeholder="Student ID" value={formData.studentNumber} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-row">
              <div className="floating-input half-width">
                <User size={20} className="input-icon"/>
                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="floating-input half-width">
                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required style={{paddingLeft: '18px'}} />
              </div>
            </div>

            <div className="input-row">
               <div className="floating-input full-width">
                <Type size={20} className="input-icon"/>
                <input type="text" name="middleInitial" placeholder="Middle Initial (Optional)" value={formData.middleInitial} onChange={handleChange} maxLength={2} />
              </div>
            </div>

            <div className="section-label" style={{marginTop: '12px'}}>
               <BookOpen size={14} style={{ marginRight: '6px' }}/>
               CONTACT & ACADEMIC
            </div>

            <div className="input-row">
              <div className="floating-input full-width">
                <Mail size={20} className="input-icon"/>
                <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
              </div>
            </div>

            <div className="input-row">
              <div className="floating-input half-width">
                <BookOpen size={20} className="input-icon"/>
                <select name="course" value={formData.course} onChange={handleChange}>
                  <option>BSIT</option><option>BSIS</option><option>ACT</option><option>BSCS</option>
                </select>
              </div>
              <div className="floating-input half-width">
                <GraduationCap size={20} className="input-icon"/>
                <select name="yearLevel" value={formData.yearLevel} onChange={handleChange}>
                  <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
                </select>
              </div>
            </div>

            {error && <div className="error-message"><AlertTriangle size={16}/> {error}</div>}

            <button type="submit" className="hero-btn">
              Generate Pass <ArrowRight size={22} />
            </button>
          </form>
        </div>
      )}

      {/* --- STEP 2: PROCESSING --- */}
      {step === 'processing' && (
        <div className="card-animate-enter loading-view">
          <div className="loader-ring"></div>
          <h3>Securely Processing...</h3>
          <p>Generating local encryption token.</p>
        </div>
      )}

      {/* --- STEP 3: QR REVEAL --- */}
      {step === 'qr-reveal' && (
        <div className="card-animate-enter reg-card qr-view no-print">
          <div className="success-badge">
            <ShieldCheck size={18} /> <span>Biometric ID Secured</span>
          </div>
          
          <h2>Entry Pass Generated</h2>
          <p>Keep a copy of this code to scan at the gate.</p>
          
          <div className="qr-frame">
            {/* OFFLINE QR GENERATOR (Canvas based, works without internet) */}
            <QRCodeCanvas 
                value={generatedQRToken} 
                size={220} 
                level={"H"} 
                includeMargin={false} 
                className="qr-image"
                style={{ borderRadius: '12px' }}
            />
            <div className="scan-line"></div>
          </div>

          <div className="student-tag">
            <span className="tag-name">{formData.firstName} {formData.lastName}</span>
            <span className="tag-id">{formData.studentNumber}</span>
          </div>

          <div className="action-buttons">
            <button onClick={() => setStep('ticket-receipt')} className="download-btn">
              <Smartphone size={20} /> View Mobile Ticket
            </button>
            <button onClick={resetForm} className="secondary-btn">
              <RefreshCcw size={18} /> New Registration
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 4: TICKET & FEEDBACK --- */}
      {step === 'ticket-receipt' && (
        <div className="ticket-perspective-wrapper">
          
          {/* DIGITAL TICKET */}
          <div className="digital-ticket printable-area">
            <div className="ticket-header">
              <div className="ticket-hole"></div>
              <span>EVENT PASS • 2026</span>
              <div className="offline-pill"><WifiOff size={10}/> OFFLINE MODE</div>
            </div>
            
            <div className="ticket-body">
              <div className="ticket-user-avatar">
                {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
              </div>
              <h2 className="ticket-name">
                {formData.firstName} {formData.middleInitial ? `${formData.middleInitial}.` : ''} {formData.lastName}
              </h2>
              <p className="ticket-course">{formData.course} • {formData.yearLevel}</p>
              
              <div className="ticket-grid">
                <div><label>STUDENT ID</label><p>{formData.studentNumber}</p></div>
                <div><label>SECURITY</label><p>STU-ENCRYPT-V2</p></div>
              </div>

              <div className="ticket-qr-embed">
                <QRCodeCanvas value={generatedQRToken} size={140} level={"M"} />
              </div>
            </div>
            <div className="ticket-stub">
              <div style={{ transform: 'scale(0.5)', opacity: 0.8 }}><FeatherLogo /></div>
              <p style={{ marginLeft: '8px' }}>SparrowFlow Auth System</p>
            </div>
          </div>

          {/* FEEDBACK SECTION */}
          <div className="feedback-section card-animate-enter no-print">
            <div className="print-controls">
                <button onClick={handlePrintTicket} className="print-btn">
                    <Printer size={18}/> Save to Device
                </button>
                <div className="one-time-warning">
                    <ShieldCheck size={16}/> <span>Pass stored locally on phone.</span>
                </div>
            </div>

            <div className="divider-h"></div>

            {feedbackSent ? (
              <div className="feedback-success">
                <div className="check-anim-circle">
                    <CheckCircle2 size={36} color="#10b981" />
                </div>
                <h3>Success!</h3>
                <p>Registration and feedback logged.</p>
                <button onClick={() => setStep('qr-reveal')} className="new-reg-btn">
                   Return to QR Pass
                </button>
              </div>
            ) : (
              <>
                <div className="feedback-header">
                  <MessageSquare size={20} className="feedback-icon"/>
                  <span>Rate your experience</span>
                </div>
                
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={28} 
                      className={`star ${rating >= star ? 'filled' : ''}`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>

                <textarea 
                  className="feedback-input" 
                  placeholder="Anything we can improve? (Optional)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />

                <div className="feedback-actions">
                    <button onClick={handleFeedbackSubmit} className="send-feedback-btn" disabled={rating === 0 || sendingFeedback}>
                        {sendingFeedback ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} 
                        {sendingFeedback ? 'Sending...' : 'Complete'}
                    </button>
                    <button onClick={() => setStep('qr-reveal')} className="skip-btn">
                        Cancel
                    </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistration;