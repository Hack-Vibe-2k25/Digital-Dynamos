// components/AdminDashboard.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from 'src/lib/supabase';
import { Event, EventRegistration } from 'src/lib/types';

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'registrations' | 'analytics'>('events');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Enhanced event form state with new schema fields
  const [eventForm, setEventForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    opportunity_type: '',
    opportunity_subtype: '',
    organisation_name: '',
    website_url: '',
    mode: 'online' as 'online' | 'offline' | 'hybrid',
    categories: [] as string[],
    skills: [] as string[],
    event_date: '',
    location: '',
    max_attendees: 50,
    image_url: '',
    price: 0,
    status: 'active' as 'active' | 'cancelled' | 'completed'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEvents(), fetchRegistrations()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setEvents(data || []);
  };

  const fetchRegistrations = async () => {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        events:event_id (title, event_date)
      `)
      .order('registration_date', { ascending: false });
    
    if (error) throw error;
    setRegistrations(data || []);
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      subtitle: '',
      description: '',
      opportunity_type: '',
      opportunity_subtype: '',
      organisation_name: '',
      website_url: '',
      mode: 'online',
      categories: [],
      skills: [],
      event_date: '',
      location: '',
      max_attendees: 50,
      image_url: '',
      price: 0,
      status: 'active'
    });
    setEditingEvent(null);
  };

  const handleCreateOrUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingEvent) {
        // Update existing event
        const { data, error } = await supabase
          .from('events')
          .update({
            ...eventForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEvent.id)
          .select();
        
        if (error) throw error;
        
        setEvents(events.map(event => 
          event.id === editingEvent.id ? data[0] : event
        ));
        alert('Event updated successfully!');
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('events')
          .insert([eventForm])
          .select();
        
        if (error) throw error;
        
        setEvents([data[0], ...events]);
        alert('Event created successfully!');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEventForm({
      title: event.title,
      subtitle: event.subtitle || '',
      description: event.description || '',
      opportunity_type: event.opportunity_type || '',
      opportunity_subtype: event.opportunity_subtype || '',
      organisation_name: event.organisation_name || '',
      website_url: event.website_url || '',
      mode: event.mode || 'online',
      categories: event.categories || [],
      skills: event.skills || [],
      event_date: event.event_date ? event.event_date.slice(0, 16) : '',
      location: event.location || '',
      max_attendees: event.max_attendees,
      image_url: event.image_url || '',
      price: event.price,
      status: event.status
    });
    setEditingEvent(event);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also delete all registrations.')) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
      
      setEvents(events.filter(event => event.id !== eventId));
      setRegistrations(registrations.filter(reg => reg.event_id !== eventId));
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event');
    }
  };

  const getEventRegistrations = (eventId: string) => {
    return registrations.filter(reg => reg.event_id === eventId);
  };

  const handleArrayInput = (value: string, field: 'categories' | 'skills') => {
    const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    setEventForm({...eventForm, [field]: items});
  };

  const getAnalytics = () => {
    const totalEvents = events.length;
    const totalRegistrations = registrations.length;
    const upcomingEvents = events.filter(event => 
      event.event_date && new Date(event.event_date) > new Date() && event.status === 'active'
    ).length;
    const activeRegistrations = registrations.filter(reg => 
      reg.status === 'registered'
    ).length;

    // Event type analytics
    const eventsByType = events.reduce((acc, event) => {
      const type = event.opportunity_type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Mode distribution
    const eventsByMode = events.reduce((acc, event) => {
      const mode = event.mode || 'online';
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents,
      totalRegistrations,
      upcomingEvents,
      activeRegistrations,
      eventsByType,
      eventsByMode
    };
  };

  const analytics = getAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Event Management Dashboard</h1>
        
        {/* Enhanced Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.totalRegistrations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.upcomingEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Registrations</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.activeRegistrations}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-200 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'events'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Events Management
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'registrations'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Registrations
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Create/Edit Event Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                {editingEvent && (
                  <button
                    onClick={resetForm}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleCreateOrUpdateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={eventForm.subtitle}
                    onChange={(e) => setEventForm({...eventForm, subtitle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Short tagline for your event"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your event (supports markdown)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opportunity Type
                    </label>
                    <select
                      value={eventForm.opportunity_type}
                      onChange={(e) => setEventForm({...eventForm, opportunity_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="contest">Contest</option>
                      <option value="workshop">Workshop</option>
                      <option value="conference">Conference</option>
                      <option value="seminar">Seminar</option>
                      <option value="networking">Networking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtype
                    </label>
                    <select
                      value={eventForm.opportunity_subtype}
                      onChange={(e) => setEventForm({...eventForm, opportunity_subtype: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Subtype</option>
                      <option value="coding">Coding</option>
                      <option value="design">Design</option>
                      <option value="business">Business</option>
                      <option value="ai-ml">AI/ML</option>
                      <option value="blockchain">Blockchain</option>
                      <option value="iot">IoT</option>
                      <option value="web-dev">Web Development</option>
                      <option value="mobile-dev">Mobile Development</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={eventForm.organisation_name}
                    onChange={(e) => setEventForm({...eventForm, organisation_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={eventForm.website_url}
                    onChange={(e) => setEventForm({...eventForm, website_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mode *
                    </label>
                    <select
                      value={eventForm.mode}
                      onChange={(e) => setEventForm({...eventForm, mode: e.target.value as 'online' | 'offline' | 'hybrid'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={eventForm.status}
                      onChange={(e) => setEventForm({...eventForm, status: e.target.value as 'active' | 'cancelled' | 'completed'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={eventForm.price}
                      onChange={(e) => setEventForm({...eventForm, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categories (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={eventForm.categories.join(', ')}
                    onChange={(e) => handleArrayInput(e.target.value, 'categories')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Technology, Innovation, Startup"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills Assessed (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={eventForm.skills.join(', ')}
                    onChange={(e) => handleArrayInput(e.target.value, 'skills')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="React, Node.js, Python, Design Thinking"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({...eventForm, event_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Attendees *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={eventForm.max_attendees}
                      onChange={(e) => setEventForm({...eventForm, max_attendees: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Virtual/Physical address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={eventForm.image_url}
                    onChange={(e) => setEventForm({...eventForm, image_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading 
                    ? 'Saving...' 
                    : editingEvent 
                    ? 'Update Event' 
                    : 'Create Event'
                  }
                </button>
              </form>
            </div>

            {/* Enhanced Events List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Existing Events</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {events.map((event) => {
                  const eventRegistrations = getEventRegistrations(event.id);
                  const isUpcoming = event.event_date ? new Date(event.event_date) > new Date() : false;
                  
                  return (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          {event.subtitle && (
                            <p className="text-sm text-gray-600 italic">{event.subtitle}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-3">
                        <div>
                          {event.event_date && <p>📅 {new Date(event.event_date).toLocaleDateString()}</p>}
                          <p>📍 {event.location || 'TBD'}</p>
                          {event.organisation_name && <p>🏢 {event.organisation_name}</p>}
                        </div>
                        <div>
                          <p>👥 {eventRegistrations.length}/{event.max_attendees}</p>
                          <p>💰 {event.price > 0 ? `$${event.price}` : 'Free'}</p>
                          <p>🌐 {event.mode}</p>
                        </div>
                      </div>

                      {/* Enhanced tags display */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {event.opportunity_type && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {event.opportunity_type}
                          </span>
                        )}
                        {event.categories && event.categories.map((category, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {category}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isUpcoming 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isUpcoming ? 'Upcoming' : 'Past'}
                        </span>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : event.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {events.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No events created yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Event Registrations</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Event</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">
                        {registration.events?.title || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div>{registration.user_name}</div>
                          {registration.team_name && (
                            <div className="text-xs text-gray-500">Team: {registration.team_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{registration.user_email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          registration.participation_type === 'team' 
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {registration.participation_type || 'individual'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{registration.phone || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {new Date(registration.registration_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          registration.status === 'registered' 
                            ? 'bg-green-100 text-green-800'
                            : registration.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {registration.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {registrations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No registrations found.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Events by Type</h3>
              <div className="space-y-3">
                {Object.entries(analytics.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{type}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Events by Mode</h3>
              <div className="space-y-3">
                {Object.entries(analytics.eventsByMode).map(([mode, count]) => (
                  <div key={mode} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{mode}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
