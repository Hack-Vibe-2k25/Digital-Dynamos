// components/EventCard.tsx
import Link from 'next/link';
import { Event } from 'src/lib/types';

interface EventCardProps {
  event: Event;
}

// Reusable Icons
const ClockIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Format date safely
const formatDate = (dateString?: string) => {
  if (!dateString) return { day: '-', month: '-', time: '-' };

  const date = new Date(dateString);
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  };
};

export default function EventCard({ event }: EventCardProps) {
  const { day, month, time } = formatDate(event.event_date);

  return (
    <div className="card group cursor-pointer">
      <Link href={`/events/${event.id}`} aria-label={`View details for ${event.title}`}>
        <div className="relative overflow-hidden rounded-lg mb-4">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.description || event.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-lg font-medium">
                {event.title?.charAt(0) || '?'}
              </span>
            </div>
          )}

          {/* Date Badge */}
          <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-md text-center">
            <div className="text-sm font-bold text-gray-900">{day}</div>
            <div className="text-xs text-gray-600 uppercase">{month}</div>
          </div>

          {/* Price Badge */}
          <div
            className={`absolute top-4 right-4 px-2 py-1 rounded-md text-sm font-medium text-white ${
              event.price > 0 ? 'bg-green-500' : 'bg-blue-500'
            }`}
          >
            {event.price > 0 ? `$${event.price}` : 'Free'}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Time */}
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <ClockIcon />
            {time}
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <LocationIcon />
              {event.location}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Max {event.max_attendees} attendees
            </span>
            <span className="text-blue-600 font-medium group-hover:underline">
              Learn more →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
