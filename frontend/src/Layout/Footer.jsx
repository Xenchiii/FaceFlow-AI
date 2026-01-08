
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">FaceFlow AI</h3>
            <p className="text-gray-400 text-sm">
              Advanced facial recognition and analytics powered by artificial intelligence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Connect With Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition text-2xl">
                🐦
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition text-2xl">
                📘
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition text-2xl">
                💼
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} FaceFlow AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;