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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Amazing Events
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join exciting events, connect with like-minded people, and create unforgettable memories
        </p>
        <div className="space-x-4">
          <Link href="/events" className="btn-primary text-lg px-8 py-3">
            Browse Events
          </Link>
          <Link href="/admin" className="btn-secondary text-lg px-8 py-3">
            Host Event
          </Link>
        </div>
      </div>

      {/* Upcoming Events */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
          <Link href="/events" className="text-blue-600 hover:text-blue-700 font-medium">
            View all events →
          </Link>
        </div>
        
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No upcoming events found.</p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Easy Registration</h3>
          <p className="text-gray-600">Register for events with just a few clicks</p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
          <p className="text-gray-600">Get instant answers about events from our AI chatbot</p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Community</h3>
          <p className="text-gray-600">Connect with event organizers and attendees</p>
        </div>
      </section>
    </div>
  );
}
