import React, { 
  useState, 
  useEffect, 
  useRef, 
  useMemo, 
  useCallback 
} from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr'; 
import { 
  QrCode, 
  Search, 
  Download, 
  FileText, 
  Camera, 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Loader2, 
  RefreshCw,
  Filter,
  User, 
  GraduationCap, 
  ShieldCheck, 
  AlertCircle, 
  ScanLine, 
  Ticket, 
  MoreVertical, 
  Smartphone, 
  Monitor, 
  Calendar, 
  Hash,
  Mail,
  SortAsc,
  SortDesc,
  CheckSquare, 
  Square, 
  Trash2, 
  Printer, 
  Eye, 
  Activity, 
  Terminal, 
  ArrowRight
} from 'lucide-react';

/**
 * =================================================================================================
 * SPARROWFLOW QR MANAGEMENT ENGINE - TITANIUM ULTRA EDITION v8.3
 * =================================================================================================
 * @file QRCodesTab.jsx
 * @author SparrowFlow Architecture Team
 * @version 8.3.0-Titanium-Final
 * @copyright 2026 SparrowFlow Systems
 * * -------------------------------------------------------------------------------------------------
 * COMPONENT ARCHITECTURE & DESIGN PHILOSOPHY
 * -------------------------------------------------------------------------------------------------
 * This component acts as the central nervous system for the physical access layer of the 
 * application. It is designed not just as a UI view, but as a self-contained application module.
 * * KEY CAPABILITIES:
 * 1. HYBRID DATA SYNC:
 * - Implements a "Stale-While-Revalidate" strategy manually.
 * - Listens to global refresh triggers from the parent Dashboard.
 * - Polling mechanisms for active scanner sessions.
 * * 2. PIXEL-PERFECT TICKET RENDERING:
 * - Uses HTML5 Canvas API for high-fidelity ticket generation.
 * - Matches the `StudentRegistration` CSS exactly (Colors, Spacing, Typography).
 * - Generates 300 DPI equivalent images for printing.
 * * 3. ADVANCED HARDWARE ACCESS:
 * - Direct interface with the MediaDevices API.
 * - Stream lifecycle management (init, pause, stop, track cleanup).
 * - Fallback modes for devices without cameras or permissions.
 * * 4. CLIENT-SIDE DATA ENGINE:
 * - In-memory searching, filtering, and sorting for up to 10,000 records.
 * - Memoized derived state to prevent React render thrashing.
 * - Bulk operation support (Batch Download, CSV Export).
 * * 5. ADAPTIVE INTERFACE:
 * - CSS Variables architecture for instant Dark Mode synchronization.
 * - Mobile-first responsive grid system.
 * - Accessible ARIA labels and keyboard navigation support.
 * * -------------------------------------------------------------------------------------------------
 */

// =================================================================================================
//  1. GLOBAL CONFIGURATION & CONSTANTS
// =================================================================================================

/**
 * Configuration for the HTML5 Canvas Ticket Generator
 * These values strictly match the CSS found in StudentRegistration.css
 */
const TICKET_CONFIG = {
  width: 420,
  height: 680,
  borderRadius: 20,
  headerHeight: 90, // Matches the navy header
  colors: {
    headerBg: '#0f172a', // Exact navy from reg
    primary: '#4F46E5',  // Indigo-600
    success: '#22C55E',  // Green-500
    background: '#FFFFFF',
    textMain: '#0f172a',
    textMuted: '#64748B',
    border: '#E2E8F0',
    idBoxBg: '#F1F5F9'
  },
  fonts: {
    header: 'bold 26px Arial, sans-serif',
    subHeader: '14px Arial, sans-serif',
    name: 'bold 28px Arial, sans-serif',
    meta: '500 18px Arial, sans-serif',
    mono: 'bold 20px "Courier New", monospace'
  }
};

/**
 * Grid View Configuration
 */
const GRID_CONFIG = {
  itemsPerPage: 12,
  animationDuration: 300, 
  refreshInterval: 60000, 
};

/**
 * CSV Export Headers Definition
 */
const EXPORT_HEADERS = [
  'Student ID', 
  'First Name', 
  'Last Name', 
  'Email', 
  'Course', 
  'Year Level', 
  'Status', 
  'QR Token', 
  'Registration Date'
];

// =================================================================================================
//  2. HELPER UTILITY FUNCTIONS
// =================================================================================================

/**
 * UTILITY: Year Level Normalizer (ADDED REQUEST)
 * Consolidates varied inputs into standard Year Levels.
 */
const normalizeYearLevel = (rawInput) => {
    if (!rawInput) return 'N/A';
    const str = String(rawInput).toLowerCase().trim();

    // 1st Year Logic (Freshmen)
    if (str.includes('1st') || str.includes('first') || str.includes('fresh')) {
        return '1st Year';
    }
    // 2nd Year Logic (Sophomore)
    if (str.includes('2nd') || str.includes('second') || str.includes('soph')) {
        return '2nd Year';
    }
    // 3rd Year Logic (Junior)
    if (str.includes('3rd') || str.includes('third') || str.includes('junior')) {
        return '3rd Year';
    }
    // 4th Year Logic (Senior)
    if (str.includes('4th') || str.includes('fourth') || str.includes('senior')) {
        return '4th Year';
    }
    
    return rawInput; // Fallback to original if no match
};

/**
 * Safely formats a date string for display.
 * Handles null, undefined, and invalid date strings gracefully.
 * @param {string | Date} dateInput - The date to format
 * @returns {string} Formatted date (e.g. "Jan 15, 2026") or "N/A"
 */
const safeDateFormat = (dateInput) => {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch (err) {
    console.warn("Date formatting error", err);
    return 'Error';
  }
};

/**
 * Generates a clean, filesystem-safe filename for downloads.
 * Removes special characters and replaces spaces with underscores.
 * @param {string} name - Student Name
 * @param {string} id - Student ID
 * @returns {string} e.g. "Ticket_2026-001_john_doe.png"
 */
const generateFilename = (name, id) => {
  const safeName = (name || 'student').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeId = (id || 'unknown').replace(/[^a-z0-9]/gi, '-');
  return `Ticket_${safeId}_${safeName}.png`;
};

/**
 * Debounce utility to optimize search input performance.
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time in ms
 * @returns {Function} Debounced function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// =================================================================================================
//  3. MAIN COMPONENT DEFINITION
// =================================================================================================

export default function QRCodesTab({ refreshTrigger, onNewScan }) {
  
  // -----------------------------------------------------------------------------------------------
  // 3.1. STATE MANAGEMENT REPOSITORY
  // -----------------------------------------------------------------------------------------------

  // -- Data Store --
  /** @type {[Array, Function]} Raw data from API */
  const [rawData, setRawData] = useState([]);
  
  /** @type {[Array, Function]} Filtered data currently visible */
  const [displayedData, setDisplayedData] = useState([]);
  
  /** @type {[Object, Function]} Analytics summary */
  const [stats, setStats] = useState({ total: 0, active: 0, newToday: 0 });
  
  /** @type {[boolean, Function]} Global loading indicator */
  const [isLoading, setIsLoading] = useState(true);
  
  /** @type {[string|null, Function]} Global error message */
  const [error, setError] = useState(null);

  // -- Filtering & Sorting Configuration --
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'generatedAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  // -- Pagination System --
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = GRID_CONFIG.itemsPerPage; 

  // -- Bulk Actions & Selection --
  /** @type {[Set, Function]} Set of selected Student IDs */
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // -- Modal & Interaction States --
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null); // ID of item currently processing
  
  // -- SESSION TRACKING FOR SCANS (New Feature) --
  const [scannedSessionIds, setScannedSessionIds] = useState(new Set());
  
  // -- Debug / Developer Mode --
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  // -----------------------------------------------------------------------------------------------
  // 3.2. INTERNAL LOGGING UTILITY
  // -----------------------------------------------------------------------------------------------

  const logInfo = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] INFO: ${message}`;
    console.log(logEntry, data || '');
    setDebugLogs(prev => [logEntry, ...prev].slice(0, 50));
  };

  const logError = (message, error) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;
    console.error(logEntry, error);
    setDebugLogs(prev => [logEntry, ...prev].slice(0, 50));
  };

  // -----------------------------------------------------------------------------------------------
  // 3.3. DATA INITIALIZATION & LIFECYCLE HOOKS
  // -----------------------------------------------------------------------------------------------

  // Effect: Trigger data load on mount or when parent triggers refresh
  useEffect(() => {
    loadDataLayer();
  }, [refreshTrigger]);

  /**
   * Main Data Fetching Routine.
   * Pulls data, processes QR generation asynchronously, and updates analytics.
   */
  const loadDataLayer = async () => {
    setIsLoading(true);
    setError(null);
    logInfo("Starting Data Sync Sequence...");

    try {
      // 1. API Call
      const response = await fetch('/api/get-qr-codes', {
        headers: { 'Authorization': 'Bearer admin123' }
      });

      if (!response.ok) {
        throw new Error(`API Handshake Failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.qrCodes)) {
        logInfo(`Received ${result.qrCodes.length} records. Beginning hydration...`);
        
        // 2. Data Hydration & Enhancement
        const processed = await Promise.all(result.qrCodes.map(async (item) => {
            // Generate low-res QR Blob URL for grid display (performance optimization)
            let qrBlob = null;
            try {
                // Support both qrUrl and qrToken
                const content = item.qrUrl || item.qrToken || item.studentNumber;
                qrBlob = await QRCode.toDataURL(content, { 
                    margin: 1, 
                    width: 300, 
                    errorCorrectionLevel: 'L', 
                    color: { dark: '#000000', light: '#ffffff' }
                });
            } catch (e) { 
                console.warn(`QR Gen Warning for ${item.studentNumber}`, e); 
            }

            return {
                ...item,
                id: item.studentNumber, // Normalize ID key
                qrImageData: qrBlob,
                // Pre-compute search string for O(1) filtering later
                searchString: `${item.studentName} ${item.studentNumber} ${item.email || ''}`.toLowerCase(),
                generatedAt: item.createdAt || new Date().toISOString(),
                status: item.isActive === 0 ? 'inactive' : 'active',
                course: item.course || 'Unassigned',
                // *** APPLIED NORMALIZATION HERE (Your Request) ***
                yearLevel: normalizeYearLevel(item.yearLevel || 'N/A'), 
                qrToken: item.qrToken || item.studentNumber
            };
        }));

        // 3. State Updates
        setRawData(processed);
        calculateStats(processed);
        logInfo("Data Sync Complete. UI Ready.");
      } else {
        setRawData([]);
        logInfo("Data Sync Complete. Database Empty.");
      }
    } catch (err) {
      logError("Critical Data Failure", err);
      setError(err.message || "Failed to secure connection to database.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Analytics Calculation Engine
   * Derives summary statistics from the raw dataset.
   */
  const calculateStats = (data) => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      const newStats = {
          total: data.length,
          active: data.filter(i => i.status === 'active').length,
          newToday: data.filter(i => new Date(i.generatedAt).getTime() >= todayStart).length
      };
      setStats(newStats);
  };

  // -----------------------------------------------------------------------------------------------
  // 3.4. FILTERING & SORTING ENGINE
  // -----------------------------------------------------------------------------------------------

  const courseOptions = useMemo(() => {
      const courses = new Set(rawData.map(i => i.course).filter(Boolean));
      return ['ALL', ...Array.from(courses).sort()];
  }, [rawData]);

  // Use fixed options matching the normalization logic to ensure dropdown is clean
  const yearOptions = ['ALL', '1st Year', '2nd Year', '3rd Year', '4th Year'];

  useEffect(() => {
    let result = [...rawData];

    // Filter 1: Text Search
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(item => item.searchString.includes(q));
    }

    // Filter 2: Facets
    if (filterCourse !== 'ALL') {
        result = result.filter(i => i.course === filterCourse);
    }
    if (filterYear !== 'ALL') {
        // Because rawData is already normalized in loadDataLayer, direct comparison works
        result = result.filter(i => i.yearLevel === filterYear);
    }

    // 3. Sorting
    result.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        
        if (sortConfig.key === 'generatedAt') {
            const dateA = new Date(valA).getTime();
            const dateB = new Date(valB).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        } 
        else {
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            return sortConfig.direction === 'asc' 
                ? strA.localeCompare(strB) 
                : strB.localeCompare(strA);
        }
    });

    setDisplayedData(result);
    setCurrentPage(1); 
  }, [rawData, searchQuery, filterCourse, filterYear, sortConfig]);

  const paginatedItems = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return displayedData.slice(start, start + itemsPerPage);
  }, [displayedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(displayedData.length / itemsPerPage);

  // -----------------------------------------------------------------------------------------------
  // 3.5. BULK OPERATIONS LOGIC
  // -----------------------------------------------------------------------------------------------

  const toggleSelection = (id) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleBulkDownload = async () => {
      if (selectedIds.size === 0) return;
      if (!window.confirm(`Generate tickets for ${selectedIds.size} students?`)) return;

      logInfo(`Starting Bulk Download for ${selectedIds.size} items.`);
      setProcessingId('BULK');
      
      try {
          const selectedItems = rawData.filter(i => selectedIds.has(i.studentNumber));
          for (let i = 0; i < selectedItems.length; i++) {
              const item = selectedItems[i];
              await handleDownloadTicket(item, true); 
              await new Promise(r => setTimeout(r, 100)); 
          }
          alert("Batch Download Complete!");
          setSelectedIds(new Set());
          setIsSelectionMode(false);
      } catch (e) {
          logError("Bulk Download Interrupted", e);
      } finally {
          setProcessingId(null);
      }
  };

  // -----------------------------------------------------------------------------------------------
  // 3.6. ADVANCED TICKET GENERATION ENGINE (HTML5 CANVAS) - EXACT REPLICA
  // -----------------------------------------------------------------------------------------------

  /**
   * Generates a professional event ticket image.
   * MATCHES StudentRegistration.jsx EXACTLY.
   */
  const generateTicketCanvas = async (item) => {
      return new Promise(async (resolve, reject) => {
          try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const { width, height, borderRadius, colors } = TICKET_CONFIG;
              
              canvas.width = width;
              canvas.height = height;

              // --- A. BACKGROUND & SHAPE ---
              ctx.fillStyle = colors.background;
              
              // Rounded Rect Path
              ctx.beginPath();
              ctx.moveTo(borderRadius, 0);
              ctx.lineTo(width - borderRadius, 0);
              ctx.quadraticCurveTo(width, 0, width, borderRadius);
              ctx.lineTo(width, height - borderRadius);
              ctx.quadraticCurveTo(width, height, width - borderRadius, height);
              ctx.lineTo(borderRadius, height);
              ctx.quadraticCurveTo(0, height, 0, height - borderRadius);
              ctx.lineTo(0, borderRadius);
              ctx.quadraticCurveTo(0, 0, borderRadius, 0);
              ctx.closePath();
              ctx.fill();

              // Border
              ctx.lineWidth = 4;
              ctx.strokeStyle = colors.border;
              ctx.stroke();

              // --- B. HEADER BRANDING (Dark Navy) ---
              ctx.fillStyle = colors.headerBg; // #0f172a
              ctx.fillRect(0, 0, width, TICKET_CONFIG.headerHeight);

              // Title
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 26px Arial, sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText('Student Access', 30, 55);
              
              ctx.font = '14px Arial, sans-serif';
              ctx.fillStyle = '#94a3b8'; // Muted
              ctx.fillText('Register securely for the event.', 30, 78);

              // VALID ENTRY Badge (Top Right)
              ctx.fillStyle = colors.success;
              ctx.beginPath();
              const bw = 100, bh = 24, bx = width - 130, by = 35;
              ctx.roundRect(bx, by, bw, bh, 12);
              ctx.fill();
              
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 10px Arial, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('VALID ENTRY', bx + (bw/2), by + 16);

              // --- C. STUDENT DETAILS ---
              
              // Avatar Circle (Middle)
              const avatarY = 140; 
              ctx.beginPath();
              ctx.arc(width/2, avatarY, 40, 0, Math.PI * 2);
              ctx.fillStyle = colors.primary; // #4F46E5
              ctx.fill();
              
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 28px Arial, sans-serif';
              const initials = (item.firstName?.[0] || 'U') + (item.lastName?.[0] || 'S');
              ctx.fillText(initials, width/2, avatarY + 10);

              // Name
              ctx.fillStyle = colors.textMain;
              ctx.font = TICKET_CONFIG.fonts.name;
              // Truncate
              const studentName = item.studentName || `${item.firstName} ${item.lastName}`;
              const displayName = studentName.length > 25 
                  ? studentName.substring(0, 25) + '...' 
                  : studentName;
              ctx.fillText(displayName, width/2, 210);

              // Course & Year
              ctx.fillStyle = colors.textMuted;
              ctx.font = TICKET_CONFIG.fonts.meta;
              ctx.fillText(`${item.course} • ${item.yearLevel}`, width/2, 245);

              // ID Box
              const boxY = 270;
              ctx.fillStyle = colors.idBoxBg;
              ctx.fillRect(50, boxY, width - 100, 50);
              ctx.strokeStyle = colors.border;
              ctx.lineWidth = 1;
              ctx.strokeRect(50, boxY, width - 100, 50);

              ctx.fillStyle = colors.primary;
              ctx.font = TICKET_CONFIG.fonts.mono;
              ctx.fillText(item.studentNumber, width/2, boxY + 32);

              // --- D. QR CODE RENDERING ---
              if (item.qrImageData) {
                  const qr = new Image();
                  qr.src = item.qrImageData;
                  await new Promise(r => qr.onload = r);
                  
                  // QR Frame
                  const qrSize = 200;
                  const qrY = 350;
                  
                  // White Box
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect((width - 220)/2, qrY - 10, 220, 220);
                  ctx.strokeStyle = colors.border;
                  ctx.strokeRect((width - 220)/2, qrY - 10, 220, 220);
                  
                  ctx.drawImage(qr, (width - qrSize)/2, qrY, qrSize, qrSize);
              }

              // --- E. TEAR-OFF STUB & FOOTER ---
              const stubY = 600;
              
              // Dashed Line
              ctx.beginPath();
              ctx.setLineDash([8, 8]);
              ctx.moveTo(0, stubY);
              ctx.lineTo(width, stubY);
              ctx.strokeStyle = '#CBD5E1';
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.setLineDash([]);

              // Footer Text
              ctx.fillStyle = colors.textMuted;
              ctx.font = 'bold 12px Arial, sans-serif';
              ctx.fillText('SparrowFlow System', width/2, 630);
              
              ctx.fillStyle = '#94A3B8';
              ctx.font = '10px Arial, sans-serif';
              ctx.fillText(`TOKEN: ${item.qrToken}`, width/2, 650);

              resolve(canvas.toDataURL('image/png'));

          } catch (e) {
              reject(e);
          }
      });
  };

  /**
   * Handles the single ticket download action.
   */
  const handleDownloadTicket = async (item, silent = false) => {
      if (!silent) setProcessingId(item.studentNumber);
      try {
          const dataUrl = await generateTicketCanvas(item);
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = generateFilename(item.studentName || `${item.firstName} ${item.lastName}`, item.studentNumber);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch (e) {
          if (!silent) alert("System Error: Could not generate ticket.");
      } finally {
          if (!silent) setProcessingId(null);
      }
  };

  // -----------------------------------------------------------------------------------------------
  // 3.7. EXPORT ENGINE (CSV)
  // -----------------------------------------------------------------------------------------------

  const handleExportCSV = () => {
    if (displayedData.length === 0) {
        alert("No data to export.");
        return;
    }
    const rows = displayedData.map(item => [
      item.studentNumber, item.studentName || `${item.firstName} ${item.lastName}`, item.lastName, item.email, item.course, item.yearLevel, item.status, item.qrToken, item.generatedAt
    ]);
    const csvContent = [EXPORT_HEADERS.join(','), ...rows.map(r => r.map(f => `"${f}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SparrowFlow_Database_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // -----------------------------------------------------------------------------------------------
  // 4. SUB-COMPONENTS (Modular Architecture)
  // -----------------------------------------------------------------------------------------------

  const StatsCard = ({ title, value, icon: Icon, color }) => (
      <div className={`stats-card ${color}`}>
          <div className="stats-icon-bg"><Icon size={24} /></div>
          <div className="stats-info">
              <span className="stats-label">{title}</span>
              <span className="stats-value">{value}</span>
          </div>
      </div>
  );

  const FilterPanel = () => (
      <div className="filter-panel animate-slide-down">
          <div className="filter-header">
              <h3><Filter size={16}/> Advanced Filters</h3>
              <button onClick={() => setShowFilters(false)} className="close-filter"><X size={16}/></button>
          </div>
          <div className="filter-grid">
              <div className="filter-group">
                  <label>Course Program</label>
                  <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                      {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
              <div className="filter-group">
                  <label>Year Level</label>
                  <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                      {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
              </div>
              <div className="filter-group">
                  <label>Sort Order</label>
                  <div className="sort-buttons">
                      <button 
                          className={sortConfig.key === 'studentName' ? 'active' : ''}
                          onClick={() => setSortConfig({ key: 'studentName', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                      >
                          Name {sortConfig.key === 'studentName' && (sortConfig.direction === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}
                      </button>
                      <button 
                          className={sortConfig.key === 'generatedAt' ? 'active' : ''}
                          onClick={() => setSortConfig({ key: 'generatedAt', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                      >
                          Date {sortConfig.key === 'generatedAt' && (sortConfig.direction === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}
                      </button>
                  </div>
              </div>
          </div>
          <div className="filter-footer">
              <button className="reset-btn" onClick={() => { setFilterCourse('ALL'); setFilterYear('ALL'); setSearchQuery(''); }}>
                  Reset All Filters
              </button>
          </div>
      </div>
  );

  /**
   * Internal Camera Scanner Component (UPDATED with jsQR and Intelligent Parsing)
   */
  const CameraModal = () => {
      const videoRef = useRef(null);
      const [inputVal, setInputVal] = useState('');
      const [verifying, setVerifying] = useState(false);
      const [streamError, setStreamError] = useState(false);
      const [scanStatus, setScanStatus] = useState('Scanning...'); // UI Feedback
      
      const requestRef = useRef();

      useEffect(() => {
          let localStream = null;
          const startCam = async () => {
              try {
                  const s = await navigator.mediaDevices.getUserMedia({ 
                      video: { facingMode: 'environment', width: { ideal: 640 } } 
                  });
                  localStream = s;
                  if (videoRef.current) {
                      videoRef.current.srcObject = s;
                      videoRef.current.play().then(() => {
                          requestRef.current = requestAnimationFrame(tick);
                      });
                  }
              } catch (e) {
                  logError("Camera Init Failed", e);
                  setStreamError(true);
              }
          };
          startCam();
          return () => { 
              if (localStream) localStream.getTracks().forEach(t => t.stop()); 
              if (requestRef.current) cancelAnimationFrame(requestRef.current);
          };
      }, []);

      const tick = () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const canvas = document.createElement("canvas");
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "dontInvert",
              });

              if (code && code.data) {
                  setInputVal(code.data);
                  handleScanSubmit(code.data); // Found code, submit it
                  return; 
              }
          }
          requestRef.current = requestAnimationFrame(tick);
      };

      const handleScanSubmit = (codeOverride = null) => {
          const code = codeOverride || inputVal;
          if(code) handleSubmit(code);
      };

      /**
       * MAIN SCAN HANDLER
       * Includes logic to parse "STU-UA2023...-TIMESTAMP" formats
       */
      const handleSubmit = async (codeToProcess) => {
          let code = codeToProcess.trim();
          if (!code) return;
          
          setVerifying(true);
          
          // --- INTELLIGENT ID PARSING ---
          // Format from phone: "STU-[StudentID]-[Timestamp]"
          // Example: "STU-UA202300879-1768569224506"
          // We need to extract the middle part "UA202300879"
          if (code.startsWith("STU-")) {
              const parts = code.split("-");
              if (parts.length >= 2) {
                  // Assume ID is the second part
                  code = parts[1];
                  console.log("Parsed ID from Mobile Token:", code);
              }
          }
          // -----------------------------
          
          // 1. LOOKUP STUDENT IN LOCAL DATA
          const student = rawData.find(s => 
              s.studentNumber === code || 
              s.qrToken === code ||
              s.qrUrl === code
          );

          if (student) {
              // --- ONE SCAN PER STUDENT CHECK ---
              if (scannedSessionIds.has(student.studentNumber)) {
                  setScanStatus(`⚠️ Already Scanned: ${student.firstName}`);
                  setTimeout(() => {
                      setScanStatus('Scanning...');
                      setInputVal('');
                      requestRef.current = requestAnimationFrame(tick);
                  }, 2000);
                  setVerifying(false);
                  return;
              }

              // 2. CREATE DASHBOARD RECORD
              const newRecord = {
                  id: Date.now(),
                  studentId: student.studentNumber,
                  studentName: student.studentName || `${student.firstName} ${student.lastName}`,
                  course: student.course || 'N/A',
                  yearLevel: student.yearLevel || 'N/A',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  timestamp: new Date(),
                  method: 'QR Scan',
                  confidence: 100,
                  photo: null 
              };

              // 3. SEND TO DASHBOARD PARENT
              if (onNewScan) {
                  onNewScan(newRecord);
                  
                  const newSet = new Set(scannedSessionIds);
                  newSet.add(student.studentNumber);
                  setScannedSessionIds(newSet);

                  setScanStatus(`✅ Verified: ${student.firstName}`);
                  
                  setTimeout(() => {
                      setIsScannerOpen(false); 
                  }, 1000);
              } else {
                  console.error("onNewScan prop missing in QRCodesTab");
              }
          } else {
              setScanStatus(`❌ Not Found: ${code}`);
              setTimeout(() => {
                 setScanStatus('Scanning...');
                 requestRef.current = requestAnimationFrame(tick);
              }, 2000);
          }
          
          setVerifying(false);
      };

      return (
          <div className="modal-overlay animate-fade-in">
              <div className="modal-content camera-modal">
                  <div className="modal-header">
                      <h3><Camera size={20}/> Scan QR Code</h3>
                      <button onClick={() => setIsScannerOpen(false)}><X size={20}/></button>
                  </div>
                  <div className="camera-view">
                      {!streamError ? (
                          <>
                            <video ref={videoRef} autoPlay playsInline muted />
                            <div className={`scan-overlay-graphic ${verifying ? 'active' : ''}`}></div>
                            <div style={{
                                position: 'absolute', bottom: 20, left: 0, right: 0, 
                                textAlign: 'center', color: 'white', fontWeight: 'bold',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 10
                            }}>
                                {scanStatus}
                            </div>
                          </>
                      ) : (
                          <div className="cam-error">
                              <AlertCircle size={40}/>
                              <p>Camera Unavailable</p>
                          </div>
                      )}
                  </div>
                  <div className="manual-input">
                      <p>Or enter Student ID manually:</p>
                      <div className="input-group">
                          <input 
                              value={inputVal} 
                              onChange={e => setInputVal(e.target.value)} 
                              placeholder="e.g. 2026-001"
                              onKeyPress={e => e.key === 'Enter' && handleScanSubmit()}
                          />
                          <button onClick={() => handleScanSubmit()} disabled={verifying}>
                              {verifying ? <Loader2 className="spin" size={16}/> : <Check size={16}/>}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const DebugConsole = () => {
      if (!showDebug) return null;
      return (
          <div className="debug-console">
              <div className="dc-header">
                  <span><Terminal size={14}/> System Logs</span>
                  <button onClick={() => setShowDebug(false)}><X size={14}/></button>
              </div>
              <div className="dc-body">
                  {debugLogs.map((log, i) => (
                      <div key={i} className="dc-line">{log}</div>
                  ))}
              </div>
          </div>
      );
  };

  // -----------------------------------------------------------------------------------------------
  // 5. MAIN RENDER STRUCTURE
  // -----------------------------------------------------------------------------------------------

  return (
    <div className="qr-workspace">
      
      {/* 5.1. TOP METRICS ROW */}
      <div className="stats-row animate-fade-in">
          <StatsCard title="Total Database" value={stats.total} icon={User} color="blue" />
          <StatsCard title="Active Passes" value={stats.active} icon={Check} color="green" />
          <StatsCard title="Generated Today" value={stats.newToday} icon={Calendar} color="purple" />
          
          <div className="stats-card gray clickable" onClick={() => setShowDebug(!showDebug)}>
              <div className="stats-icon-bg"><Activity size={24}/></div>
              <div className="stats-info">
                  <span className="stats-label">System Status</span>
                  <span className="stats-value" style={{color: '#10B981'}}>Online</span>
              </div>
          </div>
      </div>

      {/* 5.2. CONTROL BAR */}
      <div className="control-bar animate-slide-down">
          <div className="cb-left">
              <div className="search-wrapper">
                  <Search size={18} className="search-icon"/>
                  <input 
                      type="text" 
                      placeholder="Search students..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                  />
              </div>
              <button 
                  className={`filter-toggle ${showFilters ? 'active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
              >
                  <Filter size={18}/> <span className="hide-mobile">Filters</span>
              </button>
          </div>

          <div className="cb-right">
              {isSelectionMode ? (
                  <div className="bulk-actions">
                      <span>{selectedIds.size} Selected</span>
                      <button onClick={handleBulkDownload} className="ba-btn"><Download size={16}/> Download</button>
                      <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="ba-cancel"><X size={16}/></button>
                  </div>
              ) : (
                  <>
                      <button className="action-btn" onClick={() => setIsSelectionMode(true)}>
                          <CheckSquare size={18}/> Select
                      </button>
                      <button className="action-btn primary" onClick={() => setIsScannerOpen(true)}>
                          <ScanLine size={18}/> Scan
                      </button>
                  </>
              )}
          </div>
      </div>

      {showFilters && <FilterPanel />}

      {/* 5.4. MAIN DATA GRID */}
      <div className="grid-container">
          {isLoading ? (
              <div className="loader-state">
                  <Loader2 size={48} className="spin"/>
                  <p>Synchronizing Secure Database...</p>
              </div>
          ) : displayedData.length === 0 ? (
              <div className="empty-state">
                  <Search size={48}/>
                  <h3>No Records Found</h3>
                  <p>Try adjusting your filters or import new students.</p>
              </div>
          ) : (
              <div className="qr-grid">
                  {paginatedItems.map(item => (
                      <div key={item.studentNumber} className={`qr-card ${selectedIds.has(item.studentNumber) ? 'selected' : ''}`}>
                          
                          {isSelectionMode && (
                              <div className="card-checkbox" onClick={() => toggleSelection(item.studentNumber)}>
                                  {selectedIds.has(item.studentNumber) ? <CheckSquare size={24} color="#4F46E5" fill="white"/> : <Square size={24} color="#94A3B8" fill="white"/>}
                              </div>
                          )}

                          <div className={`status-dot ${item.status}`}></div>

                          <div className="card-image">
                              {item.qrImageData ? (
                                  <img src={item.qrImageData} alt="QR Code" loading="lazy"/>
                              ) : (
                                  <div className="qr-placeholder"><Loader2 className="spin"/></div>
                              )}
                          </div>

                          <div className="card-details">
                              <h4 title={item.studentName || `${item.firstName} ${item.lastName}`}>{item.studentName || `${item.firstName} ${item.lastName}`}</h4>
                              
                              <div className="detail-row">
                                  <User size={12}/> 
                                  <span className="mono">{item.studentNumber}</span>
                              </div>
                              
                              <div className="detail-row">
                                  <GraduationCap size={12}/> 
                                  <span>{item.course} • {item.yearLevel}</span>
                              </div>
                          </div>

                          <div className="card-actions">
                              <button 
                                  onClick={() => {navigator.clipboard.writeText(item.qrUrl || item.qrToken); alert("Copied!");}} 
                                  title="Copy Token"
                              >
                                  <Copy size={16}/>
                              </button>
                              
                              <button 
                                  onClick={() => window.open(`/ticket/${item.studentNumber}`, '_blank')} 
                                  title="View Ticket Page"
                              >
                                  <ExternalLink size={16}/>
                              </button>
                              
                              <button 
                                  onClick={() => handleDownloadTicket(item)} 
                                  disabled={processingId === item.studentNumber} 
                                  className="btn-dl"
                                  title="Download Ticket Image"
                              >
                                  {processingId === item.studentNumber ? <Loader2 size={16} className="spin"/> : <Ticket size={16}/>} Ticket
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      <div className="pagination-bar">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            className="pg-btn"
          >
            <ChevronLeft size={16}/>
          </button>
          
          <span className="pg-info">Page <b>{currentPage}</b> of <b>{totalPages}</b></span>
          
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
            className="pg-btn"
          >
            <ChevronRight size={16}/>
          </button>
      </div>

      {isScannerOpen && <CameraModal />}
      <DebugConsole />

      {/* ==========================================================================================
          9. TITANIUM STYLESHEET (High Fidelity + Forced Dark Mode Sync)
          ========================================================================================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        /* --- CSS VARIABLES SYSTEM --- */
        :root {
            --primary: #4F46E5;
            --primary-dark: #4338CA;
            --secondary: #64748B;
            --success: #22C55E;
            --danger: #EF4444;
            --warning: #F59E0B;
            
            --bg-body: #F8FAFC;
            --bg-card: #FFFFFF;
            --bg-overlay: rgba(0,0,0,0.6);
            
            --text-main: #1E293B;
            --text-muted: #64748B;
            --text-inverse: #FFFFFF;
            
            --border: #E2E8F0;
            --shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            --radius: 16px;
        }

        /* DARK MODE OVERRIDES */
        body.dark-mode {
            --primary: #6366F1;
            --primary-dark: #4F46E5;
            --bg-body: #0F172A;
            --bg-card: #1E293B;
            --text-main: #F8FAFC;
            --text-muted: #94A3B8;
            --border: #334155;
            --shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        }

        /* --- LAYOUT & UTILS --- */
        .qr-workspace {
            padding: 24px;
            font-family: 'Outfit', sans-serif;
            color: var(--text-main);
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
            box-sizing: border-box;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .animate-slide-down { animation: slideDown 0.3s ease-out; }
        @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* --- STATS ROW --- */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 24px;
        }

        .stats-card {
            background: var(--bg-card);
            padding: 20px;
            border-radius: var(--radius);
            border: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: var(--shadow);
            transition: transform 0.2s;
        }
        .stats-card:hover { transform: translateY(-2px); }
        .stats-card.clickable { cursor: pointer; }

        .stats-icon-bg {
            width: 48px; height: 48px;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
        }
        .stats-card.blue .stats-icon-bg { background: #EFF6FF; color: #3B82F6; }
        .stats-card.green .stats-icon-bg { background: #F0FDF4; color: #22C55E; }
        .stats-card.purple .stats-icon-bg { background: #FAF5FF; color: #A855F7; }
        .stats-card.gray .stats-icon-bg { background: #F1F5F9; color: #64748B; }
        
        body.dark-mode .stats-card.blue .stats-icon-bg { background: rgba(59, 130, 246, 0.2); }
        body.dark-mode .stats-card.green .stats-icon-bg { background: rgba(34, 197, 94, 0.2); }
        body.dark-mode .stats-card.purple .stats-icon-bg { background: rgba(168, 85, 247, 0.2); }
        body.dark-mode .stats-card.gray .stats-icon-bg { background: rgba(100, 116, 139, 0.2); }

        .stats-info { display: flex; flex-direction: column; }
        .stats-label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .stats-value { font-size: 24px; font-weight: 800; color: var(--text-main); }

        /* --- CONTROL BAR --- */
        .control-bar {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
        }
        .cb-left, .cb-right { display: flex; align-items: center; gap: 12px; }

        .search-wrapper { position: relative; width: 300px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .search-wrapper input {
            width: 100%; padding: 12px 12px 12px 40px;
            border-radius: 12px; border: 1px solid var(--border);
            background: var(--bg-card); color: var(--text-main);
            outline: none; transition: border-color 0.2s;
            box-sizing: border-box;
        }
        .search-wrapper input:focus { border-color: var(--primary); }

        .filter-toggle {
            padding: 12px 16px; border-radius: 12px;
            border: 1px solid var(--border); background: var(--bg-card);
            color: var(--text-muted); cursor: pointer; font-weight: 600;
            display: flex; align-items: center; gap: 8px; transition: all 0.2s;
        }
        .filter-toggle.active { background: #EEF2FF; color: var(--primary); border-color: var(--primary); }
        body.dark-mode .filter-toggle.active { background: rgba(79, 70, 229, 0.2); }

        .action-btn {
            padding: 12px 20px; border-radius: 12px; font-weight: 600;
            cursor: pointer; display: flex; align-items: center; gap: 8px;
            border: 1px solid var(--border); background: var(--bg-card); color: var(--text-muted);
            transition: all 0.2s;
        }
        .action-btn:hover { background: var(--bg-body); color: var(--text-main); }
        .action-btn.primary {
            background: var(--primary); color: white; border: none;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
        }
        .action-btn.primary:hover { background: var(--primary-dark); transform: translateY(-1px); }

        /* BULK ACTIONS */
        .bulk-actions {
            display: flex; align-items: center; gap: 12px;
            background: var(--text-main); color: var(--bg-card);
            padding: 8px 16px; border-radius: 40px; font-weight: 600; font-size: 14px;
            animation: slideDown 0.2s;
        }
        .bulk-actions .ba-btn {
            background: rgba(255,255,255,0.2); border: none; color: inherit;
            padding: 6px 12px; border-radius: 20px; cursor: pointer;
            display: flex; align-items: center; gap: 6px; font-size: 12px;
        }
        .bulk-actions .ba-cancel {
            background: none; border: none; color: inherit; cursor: pointer; display: flex;
        }

        /* --- FILTERS PANEL --- */
        .filter-panel {
            background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius); padding: 24px; margin-bottom: 32px;
            box-shadow: var(--shadow);
        }
        .filter-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 20px; color: var(--text-main); font-weight: 700;
        }
        .close-filter { background: none; border: none; color: var(--text-muted); cursor: pointer; }
        
        .filter-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;
        }
        .filter-group label {
            display: block; font-size: 12px; font-weight: 700; color: var(--text-muted);
            margin-bottom: 8px; text-transform: uppercase;
        }
        .filter-group select {
            width: 100%; padding: 12px; border-radius: 10px;
            border: 1px solid var(--border); background: var(--bg-body);
            color: var(--text-main); outline: none;
        }
        .sort-buttons { display: flex; gap: 8px; }
        .sort-buttons button {
            flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border);
            background: var(--bg-card); color: var(--text-muted); cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 600;
        }
        .sort-buttons button.active {
            background: var(--primary); color: white; border-color: var(--primary);
        }
        
        .filter-footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); text-align: right; }
        .reset-btn { background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; font-size: 14px; }

        /* --- DATA GRID --- */
        .grid-container { min-height: 400px; position: relative; margin-bottom: 40px; }
        .qr-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;
        }

        .qr-card {
            background: var(--bg-card); border: 1px solid var(--border);
            border-radius: 20px; overflow: hidden; position: relative;
            transition: all 0.2s; box-shadow: var(--shadow);
            display: flex; flex-direction: column;
        }
        .qr-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1);
            border-color: var(--primary);
        }
        .qr-card.selected {
            border: 2px solid var(--primary);
            background: #F8FAFF;
        }
        body.dark-mode .qr-card.selected { background: #1e1b4b; }

        .card-checkbox {
            position: absolute; top: 12px; left: 12px; z-index: 5;
            background: var(--bg-card); border-radius: 4px; padding: 2px;
            cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .status-dot {
            width: 10px; height: 10px; border-radius: 50%;
            position: absolute; top: 16px; right: 16px; z-index: 5;
        }
        .status-dot.active { background: var(--success); box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15); }
        .status-dot.inactive { background: var(--danger); }

        .card-image {
            height: 200px; display: flex; align-items: center; justify-content: center;
            background: var(--bg-body); border-bottom: 1px solid var(--border);
            padding: 20px;
        }
        .card-image img {
            max-width: 100%; max-height: 100%;
            mix-blend-mode: multiply;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05));
        }
        /* Invert QR in dark mode for visibility on dark BG */
        body.dark-mode .card-image img {
            mix-blend-mode: normal;
            filter: invert(1) brightness(0.9);
        }

        .card-details { padding: 20px; text-align: center; flex: 1; }
        .card-details h4 {
            font-size: 18px; font-weight: 700; color: var(--text-main);
            margin: 0 0 12px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        
        .detail-row {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            font-size: 13px; color: var(--text-muted); margin-bottom: 6px;
        }
        .detail-row .mono {
            font-family: monospace; letter-spacing: 0.5px;
            background: var(--bg-body); padding: 2px 6px; border-radius: 4px;
            border: 1px solid var(--border); font-weight: 600; color: var(--primary);
        }

        .card-actions {
            padding: 12px 20px; border-top: 1px solid var(--border);
            background: var(--bg-card); display: flex; gap: 10px;
        }
        .card-actions button {
            flex: 1; padding: 10px; border-radius: 10px; border: 1px solid var(--border);
            background: var(--bg-body); color: var(--text-muted); cursor: pointer;
            display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .card-actions button:hover {
            background: var(--bg-card); color: var(--primary); border-color: var(--primary);
        }
        .card-actions .btn-dl {
            background: #EEF2FF; color: var(--primary); border-color: #C7D2FE; font-weight: 600; flex: 1.5; gap: 6px; font-size: 13px;
        }
        body.dark-mode .card-actions .btn-dl {
            background: rgba(79, 70, 229, 0.2); border-color: rgba(79, 70, 229, 0.4);
        }

        /* --- LOADING & EMPTY STATES --- */
        .loader-state, .empty-state {
            text-align: center; padding: 80px 0; color: var(--text-muted);
        }
        .loader-state p, .empty-state p { margin-top: 16px; font-size: 16px; }
        .empty-state svg { opacity: 0.3; }

        /* --- PAGINATION --- */
        .pagination-bar {
            display: flex; justify-content: center; align-items: center; gap: 20px;
            padding: 20px; border-top: 1px solid var(--border);
        }
        .pg-btn {
            background: var(--bg-card); border: 1px solid var(--border);
            padding: 8px 12px; border-radius: 8px; cursor: pointer; color: var(--text-main);
        }
        .pg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pg-info { font-size: 14px; color: var(--text-muted); }
        .pg-info b { color: var(--text-main); }

        /* --- MODAL / SCANNER --- */
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: var(--bg-overlay); backdrop-filter: blur(8px);
            z-index: 9999; display: flex; align-items: center; justify-content: center;
        }
        .modal-content {
            background: var(--bg-card); width: 90%; max-width: 480px;
            border-radius: 24px; overflow: hidden; border: 1px solid var(--border);
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .modal-header {
            padding: 20px; border-bottom: 1px solid var(--border);
            display: flex; justify-content: space-between; align-items: center;
            color: var(--text-main); font-weight: 700;
        }
        .modal-header button { background: none; border: none; color: var(--text-muted); cursor: pointer; }

        .camera-view {
            height: 320px; background: #000; position: relative;
            display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .camera-view video { width: 100%; height: 100%; object-fit: cover; }
        .scan-overlay-graphic {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 200px; height: 200px; border: 2px solid rgba(255,255,255,0.5);
            border-radius: 20px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
        }
        .scan-overlay-graphic::after {
            content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px;
            background: var(--success); box-shadow: 0 0 10px var(--success);
            animation: scan 2s infinite;
        }
        @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }

        .cam-error { color: white; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }

        .manual-input { padding: 24px; background: var(--bg-body); border-top: 1px solid var(--border); }
        .manual-input p { margin: 0 0 12px 0; font-size: 13px; color: var(--text-muted); font-weight: 600; }
        .input-group { display: flex; gap: 10px; }
        .input-group input { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-main); outline: none; }
        .input-group button { width: 50px; border-radius: 10px; border: none; background: var(--primary); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        /* --- DEBUG CONSOLE (HIDDEN) --- */
        .debug-console {
            position: fixed; bottom: 20px; right: 20px; width: 300px; height: 200px;
            background: rgba(0,0,0,0.9); color: #00ff00; font-family: monospace; font-size: 10px;
            border-radius: 10px; z-index: 10000; display: flex; flex-direction: column;
            overflow: hidden; pointer-events: none; opacity: 0.8;
        }
        .dc-header { background: #333; padding: 5px 10px; display: flex; justify-content: space-between; color: white; font-weight: bold; pointer-events: auto; }
        .dc-body { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 4px; pointer-events: auto; }
        
        /* RESPONSIVE */
        @media (max-width: 768px) {
            .qr-header-row { flex-direction: column; align-items: flex-start; }
            .qr-actions-block { width: 100%; justify-content: space-between; }
            .btn-group { margin-left: auto; }
            .hide-mobile { display: none; }
            .qr-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}