// components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-950/95 backdrop-blur-lg shadow-2xl shadow-purple-500/10 border-b border-purple-500/20 relative overflow-hidden">
      {/* Cosmic background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 via-purple-900/30 to-gray-900/50 opacity-60"></div>
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-0 right-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      {/* Floating stars */}
      <div className="absolute top-2 left-10 w-1 h-1 bg-white rounded-full animate-pulse opacity-70"></div>
      <div className="absolute top-4 right-20 w-0.5 h-0.5 bg-purple-400 rounded-full animate-pulse delay-500 opacity-60"></div>
      <div className="absolute bottom-2 left-1/3 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-1000 opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="group relative text-2xl font-bold transition-all duration-300 hover:scale-110 transform"
            >
              <span className="bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] group-hover:drop-shadow-[0_0_25px_rgba(168,85,247,1)] transition-all duration-300 relative z-10">
                Virtusphere
              </span>
              {/* Enhanced text stroke for visibility */}
              <span className="absolute inset-0 bg-gradient-to-r from-purple-200 via-white to-purple-200 bg-clip-text text-transparent opacity-30 blur-[0.5px]">
                Virtusphere
              </span>
              {/* Cosmic glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              href="/events" 
              className="group relative text-gray-300 hover:text-purple-300 font-medium transition-all duration-300 transform hover:scale-105 px-3 py-2 rounded-lg hover:bg-purple-900/20 backdrop-blur-sm"
            >
              <span className="drop-shadow-sm group-hover:drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-300">
                Events
              </span>
              {/* Underline effect */}
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 bg-purple-500/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg -z-10"></div>
            </Link>
            
            <Link 
              href="/admin" 
              className="group relative bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border border-purple-400/30 overflow-hidden"
            >
              {/* Button background effects */}
              <span className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              
              {/* Button text with glow */}
              <span className="relative drop-shadow-sm group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-300">
                Admin
              </span>
              
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/50 via-purple-500/50 to-purple-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
    </nav>
  );
}