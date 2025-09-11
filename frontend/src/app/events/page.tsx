// app/events/page.tsx
import { supabase } from 'src/lib/supabase';
import { Event } from 'src/lib/types';
import EventCard from 'src/components/EventCard';

async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data || [];
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">All Events</h1>
        <p className="text-gray-600">
          Discover and register for amazing events happening near you
        </p>
      </div>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500 mb-4">There are no events available at the moment.</p>
        </div>
      )}
    </div>
  );
}
