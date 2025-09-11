// components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              EventHub
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/events" 
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Events
            </Link>
            <Link 
              href="/admin" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
