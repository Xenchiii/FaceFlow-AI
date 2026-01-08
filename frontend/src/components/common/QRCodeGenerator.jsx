import { useState } from 'react';

const QRCodeGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQRCode = () => {
    if (inputText.trim()) {
      // Using a free QR code API
      const encodedText = encodeURIComponent(inputText);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedText}`;
      setQrCodeUrl(qrUrl);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">QR Code Generator</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Text or URL
          </label>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text, URL, or data..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={generateQRCode}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Generate QR Code
        </button>

        {qrCodeUrl && (
          <div className="mt-6 text-center">
            <div className="bg-gray-50 p-6 rounded-lg inline-block">
              <img 
                src={qrCodeUrl} 
                alt="Generated QR Code" 
                className="mx-auto mb-4"
              />
              <button
                onClick={downloadQRCode}
                className="bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Download QR Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeGenerator;