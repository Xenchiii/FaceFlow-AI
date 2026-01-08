
const Header = ({ children }) => {
  return (
    <div>
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🎭</div>
              <h1 className="text-2xl font-bold">FaceFlow AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
};

export default Header;