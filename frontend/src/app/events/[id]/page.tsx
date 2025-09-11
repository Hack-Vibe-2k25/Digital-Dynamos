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
      <div className="min-h-screen bg-[#080B18] starfield flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="text-center bg-gradient-to-br from-[#0F1426]/80 to-[#261A40]/60 backdrop-blur-xl rounded-3xl p-12 border border-[#8B5CF6]/20 glow-intense">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-2xl flex items-center justify-center glow-primary animate-pulse-subtle">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.736-6.26-1.99M16 6.414l-4 4-4-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Event Not Found</h1>
            <p className="text-gray-300">This event has vanished into the digital void</p>
          </div>
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
    <div className="min-h-screen bg-[#080B18] starfield">
      {/* Hero Section with Immersive Header */}
      <div className="relative overflow-hidden">
        {/* Background Image with Parallax Effect */}
        {event.image_url && (
          <div className="absolute inset-0 h-[70vh]">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080B18]/60 via-[#080B18]/80 to-[#080B18]" />
          </div>
        )}
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Main Event Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Badge & Status */}
              <div className="flex flex-wrap items-center gap-4 animate-fade-in-up">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    event.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                    {event.status === 'active' ? 'Live Event' : event.status}
                  </span>
                </div>
                {event.opportunity_type && (
                  <span className="px-4 py-2 bg-[#8B5CF6]/20 text-purple-300 text-xs font-bold uppercase tracking-wider rounded-full border border-[#8B5CF6]/30 backdrop-blur-sm">
                    {event.opportunity_type}
                  </span>
                )}
              </div>

              {/* Event Title */}
              <div className="space-y-4 animate-fade-in-up delay-300">
                <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight animate-pulse-subtle">
                  {event.title}
                </h1>
                {event.subtitle && (
                  <p className="text-xl lg:text-2xl text-purple-300 font-light leading-relaxed">
                    {event.subtitle}
                  </p>
                )}
              </div>

              {/* Event Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up delay-600">
                <div className="flex items-center gap-4 p-4 bg-[#0F1426]/40 backdrop-blur-xl rounded-2xl border border-[#233045]/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-xl flex items-center justify-center glow-primary">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Event Date</p>
                    <p className="text-white font-semibold">{formatDate(event.event_date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-[#0F1426]/40 backdrop-blur-xl rounded-2xl border border-[#233045]/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center glow-primary">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Location</p>
                    <p className="text-white font-semibold">{event.location || 'Virtual Space'}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-3 animate-fade-in-up delay-900">
                {event.opportunity_subtype && (
                  <span className="px-4 py-2 bg-purple-500/20 text-purple-300 text-sm font-medium rounded-full border border-purple-500/30 backdrop-blur-sm hover-glow">
                    {event.opportunity_subtype}
                  </span>
                )}
                {event.categories?.map((category, index) => (
                  <span key={index} className="px-4 py-2 bg-[#233045]/50 text-gray-300 text-sm rounded-full border border-[#233045] backdrop-blur-sm hover:bg-[#8B5CF6]/20 hover:text-purple-300 transition-all hover-glow">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing & Registration Card */}
            <div className="lg:col-span-1 animate-fade-in-up delay-1200">
              <div className="sticky top-8">
                <div className="bg-gradient-to-br from-[#0F1426]/80 to-[#261A40]/60 backdrop-blur-xl rounded-3xl p-8 border border-[#8B5CF6]/20 glow-intense">
                  {/* Price Display */}
                  <div className="text-center mb-8">
                    <div className="text-5xl font-black text-white mb-2 animate-pulse-subtle">
                      {event.price > 0 ? `$${event.price}` : 'FREE'}
                    </div>
                    <div className="text-gray-300 text-sm">
                      {event.max_attendees} spots available
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="text-center p-4 bg-[#233045]/30 rounded-xl border border-[#233045] backdrop-blur-sm">
                      <div className="text-2xl font-bold text-purple-300">{event.max_attendees}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Capacity</div>
                    </div>
                    <div className="text-center p-4 bg-[#233045]/30 rounded-xl border border-[#233045] backdrop-blur-sm">
                      <div className="text-2xl font-bold text-purple-300 capitalize">{event.mode || 'Virtual'}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Format</div>
                    </div>
                  </div>

                  {/* Registration Form */}
                  <EventRegistrationForm event={event} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
                  {/* AI Chatbot Section */}
        <section className="mt-20 p-24">
          <div className="bg-gradient-to-br from-[#0F1426]/80 to-[#261A40]/60 backdrop-blur-xl rounded-3xl p-10 border border-[#8B5CF6]/20 glow-intense">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-2xl flex items-center justify-center glow-primary animate-pulse-subtle">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">AI Event Assistant</h2>
                <p className="text-gray-300 text-lg">Get instant answers about this event from our intelligent guide</p>
              </div>
            </div>
            <EventChatbot event={event} embedded={true} />
          </div>
        </section>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Content Column */}
          <div className="lg:col-span-2 space-y-12">

            
            {/* About Section */}
            <section className="group">
              <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-10 border border-[#233045]/50 hover:border-[#8B5CF6]/30 transition-all hover-lift glow-primary">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-4">
                  <div className="w-2 h-8 bg-gradient-to-b from-[#8B5CF6] to-[#A78BFA] rounded-full animate-expand-width" />
                  About This Experience
                </h2>
                <div className="prose prose-lg prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                    {event.description || 'Enter a new dimension of learning and connection.'}
                  </p>
                </div>

                {event.website_url && (
                  <div className="mt-8 pt-8 border-t border-[#233045]/50">
                    <a 
                      href={event.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-[#8B5CF6]/25 transition-all hover-lift glow-intense group"
                    >
                      <span>Explore Official Portal</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Skills Section */}
            {event.skills && event.skills.length > 0 && (
              <section>
                <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-10 border border-[#233045]/50 hover:border-emerald-500/30 transition-all hover-lift glow-primary">
                  <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-4">
                    <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-400 rounded-full" />
                    Skills You'll Master
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {event.skills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 backdrop-blur-sm hover:bg-emerald-500/20 transition-all hover-glow group">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full group-hover:scale-125 transition-transform" />
                        <span className="text-emerald-300 font-medium text-sm">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Event Details Grid */}
            <section>
              <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-10 border border-[#233045]/50 hover:border-[#8B5CF6]/30 transition-all hover-lift glow-primary">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-4">
                  <div className="w-2 h-6 bg-gradient-to-b from-amber-500 to-orange-400 rounded-full" />
                  Event Specifications
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: "👥", label: "Capacity", value: `${event.max_attendees} attendees`, color: "from-[#8B5CF6] to-[#A78BFA]" },
                    { icon: "💰", label: "Investment", value: event.price > 0 ? `$${event.price}` : 'Complimentary', color: "from-emerald-500 to-teal-400" },
                    { icon: "🌐", label: "Format", value: event.mode ? event.mode.charAt(0).toUpperCase() + event.mode.slice(1) : 'Virtual Reality', color: "from-amber-500 to-orange-400" },
                    { icon: "🎯", label: "Category", value: event.opportunity_type ? event.opportunity_type.charAt(0).toUpperCase() + event.opportunity_type.slice(1) : 'Experience', color: "from-purple-500 to-pink-400" }
                  ].map((item, index) => (
                    <div key={index} className="group p-6 bg-[#233045]/20 rounded-2xl border border-[#233045] backdrop-blur-sm hover:bg-[#233045]/30 transition-all hover-glow">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-2xl glow-primary group-hover:scale-110 transition-transform`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                          <p className="text-white font-bold text-lg">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Organization Info */}
                {event.organisation_name && (
                  <div className="mt-8 pt-8 border-t border-[#233045]/50">
                    <div className="flex items-center gap-4 p-6 bg-[#233045]/20 rounded-2xl border border-[#233045] backdrop-blur-sm">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-400 rounded-xl flex items-center justify-center glow-primary">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2 0H3" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-medium">Hosted by</p>
                        <p className="text-white font-bold text-lg">{event.organisation_name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Event Status */}
            <div className="bg-gradient-to-br from-[#0F1426]/80 to-[#261A40]/60 backdrop-blur-xl rounded-3xl p-6 border border-[#8B5CF6]/20 glow-primary">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold ${
                  isEventUpcoming && isEventActive 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isEventUpcoming && isEventActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`} />
                  {isEventUpcoming && isEventActive ? 'Registration Open' : 'Event Unavailable'}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-8 border border-[#233045]/50 glow-primary">
              <h4 className="text-lg font-bold text-white mb-6">Quick Actions</h4>
              <div className="space-y-4">
                <button className="w-full flex items-center gap-3 p-4 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-purple-300 rounded-xl border border-[#8B5CF6]/20 transition-all hover-glow group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="font-semibold">Share Event</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/20 transition-all hover-glow group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Add to Calendar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      
      </div>
    </div>
  );
}