// app/page.tsx
import Link from 'next/link';
import { supabase } from 'src/lib/supabase';
import { Event } from 'src/lib/types';
import EventCard from 'src/components/EventCard';

async function getUpcomingEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(6);

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data || [];
}

export default async function HomePage() {
  const events = await getUpcomingEvents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-purple-950 relative overflow-hidden">
      {/* Starfield Background Animation */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-100"></div>
        <div className="absolute top-2/3 left-1/5 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse delay-200"></div>
        <div className="absolute top-1/5 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 right-1/5 w-1 h-1 bg-white rounded-full animate-pulse delay-700"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20 relative">
          {/* Background decoration with intense glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-[60px] animate-pulse"></div>
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[60px] animate-pulse delay-1000"></div>
            <div className="absolute top-60 left-1/2 w-80 h-80 bg-purple-600/15 rounded-full blur-[40px] animate-pulse delay-2000"></div>
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-sm border border-purple-500/30 text-purple-200 text-sm font-medium mb-8 shadow-lg shadow-purple-500/20 animate-bounce">
              <span className="text-purple-400 mr-2">✨</span>
              Welcome to Virtusphere
            </div>
            
            <div className="mb-8 relative">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-none relative z-10">
                {/* Main visible text with enhanced contrast */}
                <span className="bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(168,85,247,1)] filter brightness-150 contrast-125">
                  Virtusphere
                </span>
                {/* Text outline for better visibility */}
                <span className="absolute inset-0 bg-gradient-to-r from-purple-200 via-white to-purple-200 bg-clip-text text-transparent opacity-20 blur-[0.5px] scale-105">
                  Virtusphere
                </span>
                {/* Enhanced glow layer */}
                <span className="absolute inset-0 text-purple-300 opacity-10 blur-sm">
                  Virtusphere
                </span>
              </h1>
              {/* Multiple glow backdrop layers for maximum visibility */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-40 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent blur-3xl -z-10"></div>
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-32 bg-purple-500/20 blur-2xl rounded-full -z-10"></div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-6 leading-tight drop-shadow-lg">
              <span className="drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">Discover Amazing Events</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              Join exciting events, connect with like-minded people, and create 
              <span className="text-purple-400 font-medium drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]"> unforgettable memories</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                href="/events" 
                className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-purple-400/30"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center gap-2 drop-shadow-sm">
                  Browse Events
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
              
              <Link 
                href="/admin" 
                className="group inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-purple-200 bg-gray-900/40 backdrop-blur-sm border-2 border-purple-500/40 rounded-xl hover:border-purple-400/60 hover:bg-purple-900/20 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 shadow-lg shadow-gray-900/50 hover:shadow-purple-500/30"
              >
                <span className="flex items-center gap-2 drop-shadow-sm">
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Host Event
                </span>
              </Link>
            </div>
          </div>
        </div>


        {/* Features Section */}
        <section className="relative">
          {/* Background decoration with deep space gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/30 via-purple-900/20 to-blue-900/30 rounded-3xl backdrop-blur-sm border border-purple-500/20 shadow-2xl shadow-purple-500/10 -z-10"></div>
          
          <div className="pt-20 pb-16 px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-6 drop-shadow-lg">
                <span className="drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">Why Choose VirtuSphere?</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto drop-shadow-md">Discover the features that make event management effortless in the digital cosmos</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Feature 1 */}
              <div className="group text-center p-10 rounded-2xl bg-gradient-to-br from-gray-900/60 to-purple-900/40 backdrop-blur-sm border border-purple-500/30 shadow-2xl shadow-gray-900/50 hover:shadow-purple-500/30 hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-4 hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600/30 to-purple-800/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-400 shadow-lg shadow-purple-500/30 relative z-10">
                  <svg className="w-12 h-12 text-purple-300 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-md relative z-10">Easy Registration</h3>
                <p className="text-gray-300 leading-relaxed drop-shadow-sm relative z-10">Register for events with just a few clicks and get instant confirmation through our cosmic interface</p>
              </div>

              {/* Feature 2 */}
              <div className="group text-center p-10 rounded-2xl bg-gradient-to-br from-gray-900/60 to-blue-900/40 backdrop-blur-sm border border-blue-500/30 shadow-2xl shadow-gray-900/50 hover:shadow-blue-500/30 hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-4 hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600/30 to-blue-800/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-400 shadow-lg shadow-blue-500/30 relative z-10">
                  <svg className="w-12 h-12 text-blue-300 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-md relative z-10">AI Assistant</h3>
                <p className="text-gray-300 leading-relaxed drop-shadow-sm relative z-10">Get instant answers about events from our advanced AI chatbot powered by cosmic intelligence</p>
              </div>

              {/* Feature 3 */}
              <div className="group text-center p-10 rounded-2xl bg-gradient-to-br from-gray-900/60 to-indigo-900/40 backdrop-blur-sm border border-indigo-500/30 shadow-2xl shadow-gray-900/50 hover:shadow-indigo-500/30 hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-4 hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-600/30 to-indigo-800/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-400 shadow-lg shadow-indigo-500/30 relative z-10">
                  <svg className="w-12 h-12 text-indigo-300 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-md relative z-10">Community</h3>
                <p className="text-gray-300 leading-relaxed drop-shadow-sm relative z-10">Connect with event organizers and attendees in our vibrant cosmic community network</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}