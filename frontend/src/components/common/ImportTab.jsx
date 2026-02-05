import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, FileText, CheckCircle2, XCircle, Trash2, Folder, 
  ClipboardList, Grid3x3, Download, ArrowRight, Loader2, AlertTriangle, 
  ShieldCheck, FileSpreadsheet, Info, AlertCircle, Check
} from 'lucide-react';


// CONSTANTS & CONFIGURATION 
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain', 'text/x-csv'];
const REQUIRED_COLUMNS = ['studentnumber', 'firstname', 'lastname']; 
const BATCH_SIZE = 50; 

// REGEX PATTERNS 
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_REGEX = /^[a-zA-Z0-9-]+$/; 

export default function ImportTab({ onImportComplete, onGoToQRCodes }) {
  
  //  1. CORE STATE MANAGEMENT
  const [dragActive, setDragActive] = useState(false);
  const [fileData, setFileData] = useState(null); 
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [parseStats, setParseStats] = useState({ total: 0, valid: 0, invalid: 0 });
  
  const [viewState, setViewState] = useState('IDLE'); // IDLE | PARSING | PREVIEW | UPLOADING | SUCCESS | ERROR
  const [uploadProgress, setUploadProgress] = useState(0);
  const [apiResult, setApiResult] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const fileInputRef = useRef(null);

  //  2. ADVANCED CSV PARSING ENGINE (State Machine Implementation)
  
  const processCSV = (text) => {
    setViewState('PARSING');
    
    setTimeout(() => {
      try {
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let insideQuotes = false;
        
        const sanitizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        for (let i = 0; i < sanitizedText.length; i++) {
          const char = sanitizedText[i];
          const nextChar = sanitizedText[i + 1];

          if (char === '"') {
            if (insideQuotes && nextChar === '"') {
              currentCell += '"';
              i++; 
            } else {
              insideQuotes = !insideQuotes;
            }
          } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
          } else if (char === '\n' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
              rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
        }

        mapAndValidateData(rows);

      } catch (error) {
        console.error("Parser Critical Failure:", error);
        setViewState('ERROR');
        setApiResult({ error: "Failed to parse CSV file structure. Please check for syntax errors." });
      }
    }, 500);
  };

  const mapAndValidateData = (rows) => {
    if (rows.length < 2) {
      setViewState('ERROR');
      setApiResult({ error: "File is empty or missing headers." });
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    const mapIndex = {
      id: headers.findIndex(h => h.includes('student') || h.includes('id') || h === 'lrn'),
      first: headers.findIndex(h => h.includes('first') || h.includes('given')),
      last: headers.findIndex(h => h.includes('last') || h.includes('surname') || h.includes('family')),
      middle: headers.findIndex(h => h.includes('middle') || h === 'mi' || h === 'm.i.'),
      email: headers.findIndex(h => h.includes('email') || h.includes('mail')),
      course: headers.findIndex(h => h.includes('course') || h.includes('program') || h.includes('strand')),
      year: headers.findIndex(h => h.includes('year') || h.includes('level'))
    };

    const missing = [];
    if (mapIndex.id === -1) missing.push("Student ID");
    if (mapIndex.first === -1) missing.push("First Name");
    if (mapIndex.last === -1) missing.push("Last Name");

    if (missing.length > 0) {
      setViewState('ERROR');
      setApiResult({ error: `Missing required columns: ${missing.join(', ')}` });
      return;
    }

    const processed = [];
    const errors = [];
    let validCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue; 

      const rawId = row[mapIndex.id] || '';
      const rawFirst = row[mapIndex.first] || '';
      const rawLast = row[mapIndex.last] || '';
      const rawEmail = mapIndex.email > -1 ? row[mapIndex.email] : '';
      
      const rowErrors = [];

      if (!rawId) rowErrors.push("Missing ID");
      if (!rawFirst) rowErrors.push("Missing First Name");
      if (!rawLast) rowErrors.push("Missing Last Name");
      if (rawEmail && !EMAIL_REGEX.test(rawEmail)) rowErrors.push("Invalid Email");

      if (rowErrors.length > 0) {
        errors.push({ row: i + 1, errors: rowErrors });
      } else {
        let mi = mapIndex.middle > -1 ? (row[mapIndex.middle] || '') : '';
        if (mi.length > 1) mi = mi[0]; 
        mi = mi.toUpperCase();

        let yr = mapIndex.year > -1 ? (row[mapIndex.year] || '1st') : '1st';
        if (!yr.toLowerCase().includes('year')) yr = `${yr} Year`; 

        processed.push({
          studentNumber: rawId,
          firstName: capitalize(rawFirst),
          lastName: capitalize(rawLast),
          middleInitial: mi,
          email: rawEmail,
          course: mapIndex.course > -1 ? (row[mapIndex.course] || 'N/A').toUpperCase() : 'N/A',
          yearLevel: yr
        });
        validCount++;
      }
    }

    setParsedData(processed);
    setValidationErrors(errors);
    setParseStats({ total: rows.length - 1, valid: validCount, invalid: errors.length });
    setViewState('PREVIEW');
  };

  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  //  3. EVENT HANDLERS
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      alert("Invalid file type. Please upload a CSV file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert("File is too large (Max 5MB).");
      return;
    }

    setFileData({ name: file.name, size: (file.size / 1024).toFixed(2) + ' KB' });
    
    const reader = new FileReader();
    reader.onload = (e) => processCSV(e.target.result);
    reader.onerror = () => {
      setViewState('ERROR');
      setApiResult({ error: "Failed to read file from disk." });
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setFileData(null);
    setParsedData([]);
    setValidationErrors([]);
    setViewState('IDLE');
    setApiResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  //  4. API SUBMISSION ENGINE

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

    setViewState('UPLOADING');
    setUploadProgress(10); 

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // --- SIMULATION (REMOVE IN PRODUCTION) ---
      await new Promise(r => setTimeout(r, 2000));
      const result = { success: true, count: parsedData.length, errors: 0 };
      // ----------------------------------------

      clearInterval(interval);
      setUploadProgress(100);

      if (result.success) {
        setApiResult({
          success: true,
          count: result.count,
          message: `Successfully registered ${result.count} students.`
        });
        setViewState('SUCCESS');
        if (onImportComplete) onImportComplete();
      } else {
        throw new Error(result.error || "Server rejected import.");
      }

    } catch (error) {
      setUploadProgress(0);
      setViewState('ERROR');
      setApiResult({ error: error.message || "Network Error" });
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Student ID,First Name,Last Name,Middle Initial,Email,Course,Year Level\n2026-001,John,Doe,A,john@gmail.com,BSIT,1st Year";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "sparrowflow_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  //  5. UI SUB-COMPONENTS
  const RequirementsBox = () => (
    <div className="req-box">
      <div className="req-header">
        <ClipboardList size={18} />
        <span>CSV Requirements</span>
      </div>
      <div className="req-content">
        <p className="req-intro">Your CSV file must correspond to the database schema:</p>
        <div className="req-grid">
          <div className="req-item"><CheckCircle2 size={14} className="icon-req"/> <b>Student ID</b> (Unique)</div>
          <div className="req-item"><CheckCircle2 size={14} className="icon-req"/> <b>First Name</b></div>
          <div className="req-item"><CheckCircle2 size={14} className="icon-req"/> <b>Last Name</b></div>
          <div className="req-item optional"><div className="dot"/> Middle Initial</div>
          <div className="req-item optional"><div className="dot"/> Email Address</div>
          <div className="req-item optional"><div className="dot"/> Course / Program</div>
        </div>
        <div className="code-block">
          <code>Student ID, First Name, Last Name, Middle Initial, Email, Course, Year</code>
        </div>
        <button className="template-btn" onClick={downloadTemplate}>
          <Download size={14} /> Download CSV Template
        </button>
      </div>
    </div>
  );

  const PreviewTable = () => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    const currentData = parsedData.slice(startIdx, startIdx + rowsPerPage);
    const totalPages = Math.ceil(parsedData.length / rowsPerPage);

    return (
      <div className="preview-container">
        <div className="preview-header">
          <div className="ph-left">
            <Grid3x3 size={16} />
            <h3>Data Preview</h3>
            <span className="badge-count">{parsedData.length} Valid Records</span>
          </div>
          {validationErrors.length > 0 && (
            <div className="ph-right error-badge">
              <AlertTriangle size={14} /> {validationErrors.length} Rows Skipped
            </div>
          )}
        </div>
        
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={idx}>
                  <td className="font-mono">{row.studentNumber}</td>
                  <td><b>{row.lastName}</b>, {row.firstName} {row.middleInitial}.</td>
                  <td className="text-muted">{row.email || '-'}</td>
                  <td><span className="course-tag">{row.course}</span></td>
                  <td>{row.yearLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
            >Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)}
            >Next</button>
          </div>
        )}
      </div>
    );
  };

  //  6. MAIN RENDER
  return (
    <div className="import-wrapper-centered">
      <div className="import-bg-blob blob-1"></div>
      <div className="import-bg-blob blob-2"></div>

      <div className="import-card animate-enter">
        
        <div className="import-header">
          <div className="icon-wrapper">
            <Upload size={32} />
          </div>
          <h1 className="import-title">Import Students</h1>
          <p className="import-subtitle">Batch process student records and generate secure QR tokens.</p>
        </div>

        {viewState === 'IDLE' && (
          <div className="animate-fade-in">
            <RequirementsBox />
            
            <div 
              className={`dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden-input" />
              <div className="dropzone-inner">
                <div className="icon-circle gray"><Folder size={28} /></div>
                <div className="dropzone-text">
                  <span className="primary">Click to Upload CSV</span>
                  <span className="secondary">or drag and drop file here</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewState === 'PARSING' && (
          <div className="state-box">
            <Loader2 size={48} className="spin main-loader" />
            <h3>Parsing CSV...</h3>
            <p>Validating data integrity.</p>
          </div>
        )}

        {viewState === 'PREVIEW' && (
          <div className="animate-slide-up">
            <div className="file-summary-bar">
              <div className="fs-left">
                <FileSpreadsheet size={20} className="text-green" />
                <div>
                  <div className="filename">{fileData?.name}</div>
                  <div className="filesize">{fileData?.size}</div>
                </div>
              </div>
              <button className="icon-btn" onClick={handleClear} title="Remove File">
                <Trash2 size={18} />
              </button>
            </div>

            <PreviewTable />

            <div className="action-footer">
              <button className="btn-secondary" onClick={handleClear}>Cancel</button>
              <button className="btn-primary" onClick={handleUpload}>
                <Upload size={18} /> Import {parsedData.length} Students
              </button>
            </div>
          </div>
        )}

        {viewState === 'UPLOADING' && (
          <div className="state-box">
            <div className="progress-container">
              <div className="progress-bar" style={{width: `${uploadProgress}%`}}></div>
            </div>
            <h3>Uploading Data...</h3>
            <p>{uploadProgress}% Complete</p>
          </div>
        )}

        {viewState === 'SUCCESS' && apiResult && (
          <div className="result-view success animate-scale-in">
            <div className="result-icon success"><CheckCircle2 size={48} /></div>
            <h2>Import Complete!</h2>
            <p>{apiResult.message}</p>
            <div className="result-actions">
              <button className="btn-primary" onClick={onGoToQRCodes}>
                View QR Codes <ArrowRight size={18}/>
              </button>
              <button className="btn-secondary" onClick={handleClear}>Import More</button>
            </div>
          </div>
        )}

        {viewState === 'ERROR' && (
          <div className="result-view error animate-shake">
            <div className="result-icon error"><XCircle size={48} /></div>
            <h2>Import Failed</h2>
            <p>{apiResult?.error || "An unknown error occurred."}</p>
            <button className="btn-secondary" onClick={handleClear}>Try Again</button>
          </div>
        )}

      </div>

      {/* 
          7. EMBEDDED TITANIUM CSS (High-Fidelity Styles + Dark Mode)
      */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        /* LAYOUT */
        .import-wrapper-centered {
          width: 100%; min-height: 85vh; display: flex; flex-direction: column; align-items: center;
          justify-content: flex-start; padding: 40px 20px; position: relative; font-family: 'Outfit', sans-serif;
          color: #1e293b;
        }

        /* BLOBS */
        .import-bg-blob { position: absolute; border-radius: 50%; filter: blur(90px); z-index: 0; }
        .blob-1 { width: 500px; height: 500px; background: rgba(79, 70, 229, 0.08); top: -10%; left: -10%; animation: float 15s infinite ease-in-out; }
        .blob-2 { width: 400px; height: 400px; background: rgba(99, 102, 241, 0.08); bottom: -10%; right: -10%; animation: float 12s infinite reverse ease-in-out; }
        @keyframes float { 0% { transform: translate(0,0); } 50% { transform: translate(30px, 30px); } 100% { transform: translate(0,0); } }

        /* CARD */
        .import-card {
          background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(24px); width: 100%; max-width: 680px;
          padding: 48px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
          border: 1px solid #ffffff; z-index: 10; position: relative; margin: 0 auto; transition: height 0.3s;
        }

        /* HEADERS */
        .import-header { text-align: center; margin-bottom: 32px; }
        .icon-wrapper { 
          width: 64px; height: 64px; background: #EEF2FF; border-radius: 20px; margin: 0 auto 16px;
          display: flex; align-items: center; justify-content: center; color: #4F46E5;
        }
        .import-title { font-size: 28px; font-weight: 800; margin: 0 0 8px 0; color: #0F172A; letter-spacing: -0.5px; }
        .import-subtitle { font-size: 15px; color: #64748B; font-weight: 500; }

        /* REQUIREMENTS BOX */
        .req-box {
          background: #EFF6FF; border: 2px solid #DBEAFE; border-radius: 16px; padding: 24px; margin-bottom: 32px;
        }
        .req-header { display: flex; align-items: center; gap: 10px; color: #1E40AF; font-weight: 700; font-size: 14px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
        .req-content { padding-left: 4px; }
        .req-intro { font-size: 14px; color: #3B82F6; margin-bottom: 16px; }
        .req-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .req-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #2563EB; font-weight: 600; }
        .req-item.optional { color: #60A5FA; font-weight: 500; }
        .icon-req { color: #2563EB; }
        .dot { width: 5px; height: 5px; background: currentColor; border-radius: 50%; opacity: 0.7; }
        
        .code-block { background: white; padding: 12px; border-radius: 8px; border: 1px solid #BFDBFE; font-family: monospace; font-size: 12px; color: #1E3A8A; margin-bottom: 16px; overflow-x: auto; white-space: nowrap; }
        
        .template-btn {
          background: white; border: 1px solid #2563EB; color: #2563EB; padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s;
        }
        .template-btn:hover { background: #2563EB; color: white; transform: translateY(-1px); }

        /* DROPZONE */
        .dropzone {
          border: 2px dashed #CBD5E1; border-radius: 20px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; background: #F8FAFC;
        }
        .dropzone:hover, .dropzone.active { border-color: #4F46E5; background: #EEF2FF; }
        .dropzone-inner { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .icon-circle { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .icon-circle.gray { background: #E2E8F0; color: #64748B; }
        .dropzone-text { display: flex; flex-direction: column; gap: 4px; }
        .dropzone-text .primary { font-size: 16px; font-weight: 700; color: #1E293B; }
        .dropzone-text .secondary { font-size: 14px; color: #64748B; }
        .hidden-input { display: none; }

        /* PREVIEW TABLE */
        .file-summary-bar {
          display: flex; justify-content: space-between; align-items: center; background: #F0FDF4; border: 1px solid #BBF7D0; padding: 12px 16px; border-radius: 12px; margin-bottom: 24px;
        }
        .fs-left { display: flex; alignItems: center; gap: 12px; }
        .text-green { color: #16A34A; }
        .filename { font-weight: 700; font-size: 14px; color: #14532D; }
        .filesize { font-size: 12px; color: #15803D; }
        .icon-btn { background: none; border: none; color: #EF4444; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.2s; }
        .icon-btn:hover { background: #FEE2E2; }

        .preview-container { border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; margin-bottom: 24px; }
        .preview-header { background: #F8FAFC; padding: 12px 20px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; }
        .ph-left { display: flex; align-items: center; gap: 8px; color: #475569; font-size: 13px; font-weight: 700; text-transform: uppercase; }
        .badge-count { background: #E2E8F0; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
        .error-badge { color: #DC2626; background: #FEE2E2; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; }

        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .data-table th { text-align: left; padding: 12px 20px; background: white; color: #94A3B8; font-weight: 600; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #F1F5F9; }
        .data-table td { padding: 12px 20px; border-bottom: 1px solid #F1F5F9; color: #334155; }
        .data-table tr:last-child td { border-bottom: none; }
        .course-tag { background: #EFF6FF; color: #4F46E5; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; }
        .font-mono { font-family: monospace; color: #64748B; letter-spacing: 0.5px; }
        
        .pagination { display: flex; justify-content: space-between; padding: 12px 20px; background: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 13px; color: #64748B; }
        .pagination button { background: white; border: 1px solid #CBD5E1; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
        .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ACTIONS & STATES */
        .action-footer { display: flex; gap: 16px; justify-content: flex-end; }
        .btn-primary { 
          background: #4F46E5; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        .btn-primary:hover { background: #4338ca; transform: translateY(-2px); }
        .btn-secondary {
          background: white; border: 1px solid #CBD5E1; color: #475569; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s;
        }
        .btn-secondary:hover { background: #F1F5F9; border-color: #94A3B8; color: #1E293B; }

        .state-box { text-align: center; padding: 40px; }
        .progress-container { width: 100%; height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden; margin-bottom: 20px; }
        .progress-bar { height: 100%; background: #4F46E5; transition: width 0.3s ease; }
        .main-loader { color: #4F46E5; margin-bottom: 20px; }
        
        .result-view { text-align: center; padding: 40px 0; }
        .result-icon { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .result-icon.success { background: #DCFCE7; color: #16A34A; }
        .result-icon.error { background: #FEE2E2; color: #DC2626; }
        .result-view h2 { font-size: 24px; font-weight: 800; margin-bottom: 12px; }
        .result-view.success h2 { color: #166534; }
        .result-view.error h2 { color: #991B1B; }
        .result-actions { display: flex; justify-content: center; gap: 16px; margin-top: 32px; }

        /* ANIMATIONS */
        .animate-enter { animation: enter 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes enter { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* --- DARK MODE OVERRIDES --- */
        body.dark-mode .import-wrapper-centered { color: #e2e8f0; background: #0f172a; background-image: none; }
        body.dark-mode .import-card { background: #1e293b; border-color: #334155; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        body.dark-mode .import-title { color: #f8fafc; }
        body.dark-mode .import-subtitle { color: #94a3b8; }
        body.dark-mode .icon-wrapper { background: #312e81; color: #818cf8; }
        
        body.dark-mode .req-box { background: #172554; border-color: #1e40af; }
        body.dark-mode .req-header { color: #60a5fa; }
        body.dark-mode .req-intro { color: #93c5fd; }
        body.dark-mode .req-item { color: #bfdbfe; }
        body.dark-mode .icon-req { color: #60a5fa; }
        body.dark-mode .code-block { background: #0f172a; border-color: #1e3a8a; color: #cbd5e1; }
        body.dark-mode .template-btn { background: #1e293b; border-color: #3b82f6; color: #60a5fa; }
        body.dark-mode .template-btn:hover { background: #1d4ed8; color: white; }

        body.dark-mode .dropzone { background: #0f172a; border-color: #334155; }
        body.dark-mode .dropzone:hover { background: #1e293b; border-color: #6366f1; }
        body.dark-mode .icon-circle.gray { background: #1e293b; color: #94a3b8; }
        body.dark-mode .dropzone-text .primary { color: #f1f5f9; }
        body.dark-mode .dropzone-text .secondary { color: #94a3b8; }

        body.dark-mode .preview-container { border-color: #334155; }
        body.dark-mode .preview-header { background: #0f172a; border-color: #334155; }
        body.dark-mode .ph-left { color: #94a3b8; }
        body.dark-mode .badge-count { background: #1e293b; color: #cbd5e1; }
        body.dark-mode .data-table th { background: #1e293b; color: #94a3b8; border-color: #334155; }
        body.dark-mode .data-table td { border-color: #334155; color: #e2e8f0; }
        body.dark-mode .course-tag { background: #312e81; color: #a5b4fc; }
        body.dark-mode .pagination { background: #0f172a; border-color: #334155; color: #94a3b8; }
        body.dark-mode .pagination button { background: #1e293b; border-color: #475569; color: #cbd5e1; }

        body.dark-mode .btn-secondary { background: #1e293b; border-color: #475569; color: #cbd5e1; }
        body.dark-mode .btn-secondary:hover { background: #334155; color: white; }
        
        body.dark-mode .file-summary-bar { background: #064e3b; border-color: #059669; }
        body.dark-mode .filename { color: #a7f3d0; }
        body.dark-mode .filesize { color: #6ee7b7; }
        body.dark-mode .text-green { color: #34d399; }
      `}</style>
    </div>
  );
}