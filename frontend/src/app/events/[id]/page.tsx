// app/events/[id]/page.tsx
import { supabase } from 'src/lib/supabase';
import { Event } from 'src/lib/types';
import EventRegistrationForm from 'src/components/EventRegistrationForm';
import EventChatbot from 'src/components/EventChatbot';

async function getEvent(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }
  
  return data;
}

interface EventPageProps {
  params: {
    id: string;
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const event = await getEvent(params.id);
  
  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date TBD';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isEventUpcoming = event.event_date ? new Date(event.event_date) > new Date() : true;
  const isEventActive = event.status === 'active';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Event Header */}
      <div className="mb-8">
        {event.image_url && (
          <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden mb-6">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
          <div className="mb-4 md:mb-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {event.title}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : event.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {event.status}
              </span>
            </div>
            
            {event.subtitle && (
              <p className="text-lg text-gray-600 mb-4 italic">
                {event.subtitle}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(event.event_date)}
              </div>
              
              {event.location && (
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </div>
              )}

              {event.organisation_name && (
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2 0H3" />
                  </svg>
                  {event.organisation_name}
                </div>
              )}

              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
                {event.mode ? event.mode.charAt(0).toUpperCase() + event.mode.slice(1) : 'Online'}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {event.price > 0 ? `$${event.price}` : 'Free'}
            </div>
            <div className="text-sm text-gray-600">
              Max {event.max_attendees} attendees
            </div>
            {!isEventUpcoming && (
              <div className="text-sm text-orange-600 font-medium mt-1">
                Event has passed
              </div>
            )}
            {!isEventActive && (
              <div className="text-sm text-red-600 font-medium mt-1">
                Event {event.status}
              </div>
            )}
          </div>
        </div>

        {/* Event Type and Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {event.opportunity_type && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {event.opportunity_type.charAt(0).toUpperCase() + event.opportunity_type.slice(1)}
            </span>
          )}
          {event.opportunity_subtype && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
              {event.opportunity_subtype.charAt(0).toUpperCase() + event.opportunity_subtype.slice(1)}
            </span>
          )}
          {event.categories?.map((category, index) => (
            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              {category}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {event.description || 'No description available.'}
              </p>
            </div>

            {event.website_url && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <a 
                  href={event.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Visit Official Website
                </a>
              </div>
            )}
          </div>

          {/* Skills Section */}
          {event.skills && event.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Skills You'll Develop</h3>
              <div className="flex flex-wrap gap-2">
                {event.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Event Details Grid */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Capacity</div>
                  <div className="text-gray-600">{event.max_attendees} attendees</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Price</div>
                  <div className="text-gray-600">{event.price > 0 ? `$${event.price}` : 'Free'}</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Format</div>
                  <div className="text-gray-600 capitalize">{event.mode || 'Online'}</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Type</div>
                  <div className="text-gray-600 capitalize">{event.opportunity_type || 'Event'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="lg:col-span-1">
          <EventRegistrationForm event={event} />
        </div>
      </div>

      {/* Chatbot Integration */}
      <div className="mt-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            Ask our AI assistant anything about this event!
          </p>
          <EventChatbot event={event} embedded={true} />
        </div>
      </div>
    </div>
  );
}
