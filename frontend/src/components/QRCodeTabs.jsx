import { useState } from 'react';

import './QRCodeTabs.css';

const QRCodeTabs = () => {
  const [inputText, setInputText] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = async () => {
    if (!inputText.trim()) {
      alert('Please enter text or URL');
      return;
    }

    setIsGenerating(true);

    try {
      // Using QR Server API to generate QR code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inputText)}`;
      setQrCodeData(qrUrl);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="qr-code-container">
      <div className="qr-code-card">
        <h2 className="qr-code-title">QR Code Generator</h2>
        
        <div className="qr-input-group">
          <label htmlFor="qr-input" className="qr-label">
            Enter Text or URL
          </label>
          <input
            id="qr-input"
            type="text"
            className="qr-input"
            placeholder="e.g., https://example.com or any text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && generateQRCode()}
          />
        </div>

        <button
          className="qr-generate-btn"
          onClick={generateQRCode}
          disabled={isGenerating || !inputText.trim()}
        >
          {isGenerating ? (
            <>
              <span className="spinner-small"></span>
              Generating...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Generate QR Code
            </>
          )}
        </button>
      </div>

      <QRCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        qrCodeData={qrCodeData}
        inputText={inputText}
      />
    </div>
  );
};

export default QRCodeTabs;