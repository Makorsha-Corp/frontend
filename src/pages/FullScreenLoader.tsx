const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Main loader container */}
      <div className="relative">
        {/* Pulsing backdrop circle */}
        <div className="absolute inset-0 -m-8 bg-white/40 rounded-full animate-pulse" />
        
        {/* Bouncing dots */}
        <div className="flex space-x-3 relative z-10">
          <div 
            className="w-4 h-4 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full animate-bounce shadow-lg" 
            style={{ animationDelay: "0s", animationDuration: "1.2s" }} 
          />
          <div 
            className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-bounce shadow-lg" 
            style={{ animationDelay: "0.15s", animationDuration: "1.2s" }} 
          />
          <div 
            className="w-4 h-4 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full animate-bounce shadow-lg" 
            style={{ animationDelay: "0.3s", animationDuration: "1.2s" }} 
          />
        </div>
        
        {/* Optional loading text */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm font-medium tracking-wide animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;