"use client";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import { supabase } from 'src/lib/supabase';
import { Event, EventRegistration } from 'src/lib/types';
import { nanoid } from 'nanoid';
import Image from 'next/image';

// Enhanced ImageUpload Component for VirtuSphere theme
interface ImageUploadProps {
  onImageUploaded?: (url: string) => void;
  currentImageUrl?: string;
  bucketName?: string;
  className?: string;
}

function VirtuSphereImageUpload({ 
  onImageUploaded, 
  currentImageUrl = '',
  bucketName = 'virtuesphere',
  className = ''
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      
      // Auto-upload on selection for seamless UX
      handleUpload(file);
    } else {
      alert('Please select a valid image file (PNG, JPG, GIF, WebP)');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Enhanced drag and drop handlers with visual feedback
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Generate unique filename with timestamp and nanoid
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `experience-visuals/${Date.now()}-${nanoid()}.${fileExt}`;

      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }

      // Callback to parent component
      onImageUploaded?.(publicUrl);
      setSelectedFile(null);

      // Success feedback
      setTimeout(() => setUploadProgress(0), 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('Error uploading file:', errorMessage);
      alert(`Upload failed: ${errorMessage}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Current Image Display */}
      {currentImageUrl && !previewUrl && (
        <div className="mb-4">
          <div className="relative w-full h-40 bg-gradient-to-br from-[#233045]/20 to-[#261A40]/10 rounded-2xl overflow-hidden border border-[#233045]">
            <Image
              src={currentImageUrl}
              alt="Current experience visual"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-2xl"
            />
            <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-3 py-1 rounded-full text-xs font-bold glow-primary">
              ✓ Current Visual
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Drag & Drop Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer group
          ${dragActive 
            ? 'border-[#8B5CF6] bg-gradient-to-br from-[#8B5CF6]/20 to-[#A78BFA]/10 glow-primary scale-105' 
            : isUploading
            ? 'border-amber-400 bg-gradient-to-br from-amber-500/20 to-orange-400/10'
            : 'border-[#233045] bg-gradient-to-br from-[#233045]/20 to-[#261A40]/10 hover:border-[#8B5CF6]/50 hover:bg-gradient-to-br hover:from-[#8B5CF6]/10 hover:to-[#A78BFA]/5'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="text-center">
          {isUploading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] rounded-full animate-spin">
                    <div className="w-12 h-12 bg-[#080B18] rounded-full m-2"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{Math.round(uploadProgress)}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold">Uploading Visual Portal...</p>
                <div className="w-full bg-[#233045] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] h-2 rounded-full transition-all glow-primary"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-2xl flex items-center justify-center mx-auto glow-primary group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold text-lg">
                  <span className="bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] bg-clip-text text-transparent">Upload Visual Portal</span>
                </p>
                <p className="text-gray-300 text-sm">
                  Drag & drop your experience visual or click to browse
                </p>
                <p className="text-gray-400 text-xs">
                  Supports PNG, JPG, GIF, WebP up to 10MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {previewUrl && (
        <div className="mt-6">
          <div className="relative w-full h-40 bg-gradient-to-br from-[#233045]/20 to-[#261A40]/10 rounded-2xl overflow-hidden border border-[#8B5CF6]/30 glow-primary">
            <Image
              src={previewUrl}
              alt="Experience visual preview"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-2xl"
            />
            <div className="absolute top-3 right-3 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              🚀 Processing...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
        alert('Experience updated successfully!');
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('events')
          .insert([eventForm])
          .select();
        
        if (error) throw error;
        
        setEvents([data[0], ...events]);
        alert('Experience launched successfully!');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error processing experience');
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
    if (!confirm('Are you sure you want to delete this experience? This will also delete all registrations.')) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
      
      setEvents(events.filter(event => event.id !== eventId));
      setRegistrations(registrations.filter(reg => reg.event_id !== eventId));
      alert('Experience deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting experience');
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
      <div className="min-h-screen bg-[#080B18] starfield flex items-center justify-center">
        <div className="bg-gradient-to-br from-[#0F1426]/80 to-[#261A40]/60 backdrop-blur-xl rounded-3xl p-12 border border-[#8B5CF6]/20 glow-intense">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] rounded-full animate-spin">
              <div className="w-6 h-6 bg-[#080B18] rounded-full m-1"></div>
            </div>
            <span className="text-xl font-semibold text-white">Initializing VirtuSphere Control Center...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B18] starfield">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#8B5CF6]/5 rounded-full blur-3xl animate-pulse-subtle" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-[#A78BFA]/3 rounded-full blur-3xl animate-pulse-subtle delay-1000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
          {/* Dashboard Title */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-2xl flex items-center justify-center glow-primary">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">VirtuSphere Control Center</h1>
                <p className="text-gray-300 text-lg">Orchestrate the future of virtual experiences</p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { 
                icon: "📊", 
                label: "Total Events", 
                value: analytics.totalEvents, 
                color: "from-[#8B5CF6] to-[#A78BFA]",
                bgColor: "from-[#8B5CF6]/20 to-[#A78BFA]/10"
              },
              { 
                icon: "👥", 
                label: "Total Registrations", 
                value: analytics.totalRegistrations, 
                color: "from-emerald-500 to-teal-400",
                bgColor: "from-emerald-500/20 to-teal-400/10"
              },
              { 
                icon: "🚀", 
                label: "Upcoming Events", 
                value: analytics.upcomingEvents, 
                color: "from-amber-500 to-orange-400",
                bgColor: "from-amber-500/20 to-orange-400/10"
              },
              { 
                icon: "✨", 
                label: "Active Registrations", 
                value: analytics.activeRegistrations, 
                color: "from-purple-500 to-pink-400",
                bgColor: "from-purple-500/20 to-pink-400/10"
              }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className={`bg-gradient-to-br ${stat.bgColor} backdrop-blur-xl rounded-2xl p-6 border border-[#233045]/50 hover:border-[#8B5CF6]/30 transition-all hover-lift glow-primary`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-2xl glow-primary group-hover:scale-110 transition-transform`}>
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                  </div>
                  <p className="text-gray-300 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="bg-gradient-to-r from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-2xl p-2 mb-8 border border-[#233045]/50">
            <div className="flex space-x-2">
              {[
                { key: 'events', label: 'Events Control', icon: '🎯' },
                { key: 'registrations', label: 'Registrations', icon: '📋' },
                { key: 'analytics', label: 'Analytics', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-3 flex-1 py-4 px-6 rounded-xl font-bold text-sm transition-all ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white shadow-lg glow-primary'
                      : 'text-gray-300 hover:text-white hover:bg-[#233045]/30'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create/Edit Event Form */}
            <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-8 border border-[#233045]/50 glow-primary">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {editingEvent ? 'Modify Experience' : 'Create Experience'}
                  </h2>
                </div>
                {editingEvent && (
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-[#233045]/50 text-gray-300 rounded-xl border border-[#233045] hover:border-[#8B5CF6]/30 hover:text-white transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleCreateOrUpdateEvent} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Experience Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    placeholder="Enter immersive experience title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={eventForm.subtitle}
                    onChange={(e) => setEventForm({...eventForm, subtitle: e.target.value})}
                    className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    placeholder="Short compelling tagline"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Experience Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    placeholder="Describe the transformative journey participants will embark on..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Experience Type
                    </label>
                    <select
                      value={eventForm.opportunity_type}
                      onChange={(e) => setEventForm({...eventForm, opportunity_type: e.target.value})}
                      className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    >
                      <option value="">Select Type</option>
                      <option value="hackathon">Digital Hackathon</option>
                      <option value="contest">AI Contest</option>
                      <option value="workshop">Virtual Workshop</option>
                      <option value="conference">Immersive Conference</option>
                      <option value="seminar">Neural Seminar</option>
                      <option value="networking">Quantum Networking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Specialization
                    </label>
                    <select
                      value={eventForm.opportunity_subtype}
                      onChange={(e) => setEventForm({...eventForm, opportunity_subtype: e.target.value})}
                      className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    >
                      <option value="">Select Focus</option>
                      <option value="coding">Neural Coding</option>
                      <option value="design">Quantum Design</option>
                      <option value="business">Digital Business</option>
                      <option value="ai-ml">AI/ML Mastery</option>
                      <option value="blockchain">Blockchain Reality</option>
                      <option value="iot">IoT Integration</option>
                      <option value="web-dev">Web Evolution</option>
                      <option value="mobile-dev">Mobile Innovation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Host Organization
                  </label>
                  <input
                    type="text"
                    value={eventForm.organisation_name}
                    onChange={(e) => setEventForm({...eventForm, organisation_name: e.target.value})}
                    className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Portal URL
                  </label>
                  <input
                    type="url"
                    value={eventForm.website_url}
                    onChange={(e) => setEventForm({...eventForm, website_url: e.target.value})}
                    className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    placeholder="https://experience-portal.com"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Reality Mode *
                    </label>
                    <select
                      value={eventForm.mode}
                      onChange={(e) => setEventForm({...eventForm, mode: e.target.value as 'online' | 'offline' | 'hybrid'})}
                      className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    >
                      <option value="online">Virtual Reality</option>
                      <option value="offline">Physical Space</option>
                      <option value="hybrid">Hybrid Dimension</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={eventForm.status}
                      onChange={(e) => setEventForm({...eventForm, status: e.target.value as 'active' | 'cancelled' | 'completed'})}
                      className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    >
                      <option value="active">Active Portal</option>
                      <option value="cancelled">Suspended</option>
                      <option value="completed">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Access Cost ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={eventForm.price}
                      onChange={(e) => setEventForm({...eventForm, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Experience Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={eventForm.categories.join(', ')}
                    onChange={(e) => handleArrayInput(e.target.value, 'categories')}
                    className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    placeholder="AI, Innovation, Future Tech, Neural Networks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Skills Enhancement (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={eventForm.skills.join(', ')}
                    onChange={(e) => handleArrayInput(e.target.value, 'skills')}
                    className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    placeholder="React, Neural Processing, Quantum Computing, Design Thinking"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Experience Timeline
                    </label>
                    <input
                      type="datetime-local"
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({...eventForm, event_date: e.target.value})}
                      className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Capacity Limit *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={eventForm.max_attendees}
                      onChange={(e) => setEventForm({...eventForm, max_attendees: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Reality Coordinates
                  </label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    className="w-full px-4 py-3 bg-[#233045]/30 border border-[#233045] rounded-xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                    placeholder="Virtual Space / Physical Address / Hybrid Coordinates"
                  />
                </div>
                
                {/* Enhanced Image Upload Section */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Experience Visual Portal
                  </label>
                  <VirtuSphereImageUpload
                    currentImageUrl={eventForm.image_url}
                    onImageUploaded={(url) => setEventForm({...eventForm, image_url: url})}
                    bucketName="virtuesphere"
                    className="mb-2"
                  />
                  {eventForm.image_url && (
                    <p className="text-xs text-gray-400 mt-2 p-3 bg-[#233045]/20 rounded-xl border border-[#233045]">
                      <span className="text-purple-300 font-medium">Current Portal:</span> {eventForm.image_url.substring(0, 80)}...
                    </p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-[#8B5CF6]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover-lift glow-intense"
                >
                  {loading 
                    ? 'Processing...' 
                    : editingEvent 
                    ? 'Update Experience' 
                    : 'Launch Experience'
                  }
                </button>
              </form>
            </div>

            {/* Events List */}
            <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-8 border border-[#233045]/50 glow-primary">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2m0 0V7a2 2 0 012-2h14a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Active Experiences</h2>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {events.map((event) => {
                  const eventRegistrations = getEventRegistrations(event.id);
                  const isUpcoming = event.event_date ? new Date(event.event_date) > new Date() : false;
                  
                  return (
                    <div key={event.id} className="bg-[#233045]/20 backdrop-blur-sm rounded-2xl p-6 border border-[#233045] hover:border-[#8B5CF6]/30 transition-all hover-lift">
                      {/* Enhanced Event Image Display */}
                      {event.image_url && (
                        <div className="relative w-full h-40 mb-4 bg-gradient-to-br from-[#233045]/20 to-[#261A40]/10 rounded-2xl overflow-hidden border border-[#233045]">
                          <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="rounded-2xl"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="font-bold text-lg text-white mb-1 drop-shadow-lg">{event.title}</h3>
                            {event.subtitle && (
                              <p className="text-sm text-purple-200 italic drop-shadow-md">{event.subtitle}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-4">
                        {!event.image_url && (
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-white mb-1">{event.title}</h3>
                            {event.subtitle && (
                              <p className="text-sm text-purple-300 italic mb-2">{event.subtitle}</p>
                            )}
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="px-4 py-2 bg-[#8B5CF6]/20 text-purple-300 rounded-xl border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/30 hover:text-white transition-all text-sm font-medium"
                          >
                            Modify
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl border border-red-500/30 hover:bg-red-500/30 hover:text-white transition-all text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {event.description || 'No description provided.'}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-4">
                        <div className="space-y-1">
                          {event.event_date && (
                            <p className="flex items-center gap-2">
                              <span>⏰</span> {new Date(event.event_date).toLocaleDateString()}
                            </p>
                          )}
                          <p className="flex items-center gap-2">
                            <span>📍</span> {event.location || 'Virtual Space'}
                          </p>
                          {event.organisation_name && (
                            <p className="flex items-center gap-2">
                              <span>🏢</span> {event.organisation_name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="flex items-center gap-2">
                            <span>👥</span> {eventRegistrations.length}/{event.max_attendees}
                          </p>
                          <p className="flex items-center gap-2">
                            <span>💎</span> {event.price > 0 ? `$${event.price}` : 'Free Access'}
                          </p>
                          <p className="flex items-center gap-2">
                            <span>🌐</span> {event.mode}
                          </p>
                        </div>
                      </div>

                      {/* Enhanced tags display */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {event.opportunity_type && (
                          <span className="px-3 py-1 bg-[#8B5CF6]/20 text-purple-300 text-xs rounded-full border border-[#8B5CF6]/30">
                            {event.opportunity_type}
                          </span>
                        )}
                        {event.categories && event.categories.slice(0, 3).map((category, index) => (
                          <span key={index} className="px-3 py-1 bg-[#233045]/50 text-gray-300 text-xs rounded-full border border-[#233045]">
                            {category}
                          </span>
                        ))}
                        {event.categories && event.categories.length > 3 && (
                          <span className="px-3 py-1 bg-[#233045]/50 text-gray-400 text-xs rounded-full border border-[#233045]">
                            +{event.categories.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isUpcoming 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {isUpcoming ? 'Future Launch' : 'Historical'}
                        </span>
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.status === 'active'
                            ? 'bg-[#8B5CF6]/20 text-purple-300 border border-[#8B5CF6]/30'
                            : event.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {events.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-[#233045]/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-lg">No experiences created yet.</p>
                    <p className="text-gray-500 text-sm">Launch your first virtual experience to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-8 border border-[#233045]/50 glow-primary">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Experience Registrations</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#233045]">
                    <th className="text-left py-4 px-4 font-bold text-gray-300 text-sm">Experience</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-300 text-sm">Participant</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-300 text-sm">Neural ID</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-300 text-sm">Mode</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-300 text-sm">Contact</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-300 text-sm">Join Date</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-300 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="border-b border-[#233045]/30 hover:bg-[#233045]/20 transition-colors">
                      <td className="py-4 px-4 font-medium text-white">
                        {registration.events?.title || 'Unknown Experience'}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-white font-medium">{registration.user_name}</div>
                          {registration.team_name && (
                            <div className="text-xs text-purple-300">Collective: {registration.team_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300 text-sm">{registration.user_email}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          registration.participation_type === 'team' 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {registration.participation_type === 'team' ? 'Collective' : 'Individual'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300 text-sm">{registration.phone || 'Neural Only'}</td>
                      <td className="py-4 px-4 text-gray-300 text-sm">
                        {new Date(registration.registration_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          registration.status === 'registered' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : registration.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-[#8B5CF6]/20 text-purple-300 border border-[#8B5CF6]/30'
                        }`}>
                          {registration.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {registrations.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-[#233045]/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg">No registrations detected.</p>
                  <p className="text-gray-500 text-sm">Participants will appear here as they join experiences.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-8 border border-[#233045]/50 glow-primary">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Experience Categories</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(analytics.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center p-4 bg-[#233045]/20 rounded-xl border border-[#233045]">
                    <span className="text-gray-300 capitalize font-medium">{type}</span>
                    <span className="font-bold text-white text-lg">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-8 border border-[#233045]/50 glow-primary">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Reality Modes</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(analytics.eventsByMode).map(([mode, count]) => (
                  <div key={mode} className="flex justify-between items-center p-4 bg-[#233045]/20 rounded-xl border border-[#233045]">
                    <span className="text-gray-300 capitalize font-medium">
                      {mode === 'online' ? 'Virtual Reality' : mode === 'offline' ? 'Physical Space' : 'Hybrid Dimension'}
                    </span>
                    <span className="font-bold text-white text-lg">{count}</span>
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