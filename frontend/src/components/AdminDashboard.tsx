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

// New Avatar Creator Component
interface AvatarCreatorProps {
  onAvatarSelected?: (avatarUrl: string) => void;
  currentAvatarUrl?: string;
  className?: string;
}

function VirtuSphereAvatarCreator({ 
  onAvatarSelected, 
  currentAvatarUrl = '',
  className = ''
}: AvatarCreatorProps) {
  const [isAvatarCreatorOpen, setIsAvatarCreatorOpen] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(currentAvatarUrl);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // FIXED: Your ReadyPlayer.me subdomain configuration
  const subdomain = 'https://personal-0pchm8.readyplayer.me/avatar'; // Replace with your actual ReadyPlayer.me subdomain
  const iframeSrc = `https://${subdomain}.readyplayer.me/avatar?frameApi`;
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const json = JSON.parse(event.data);
        
        if (json?.source !== 'readyplayerme') {
          return;
        }

        // Subscribe to all events once frame is ready
        if (json.eventName === 'v1.frame.ready') {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                target: 'readyplayerme',
                type: 'subscribe',
                eventName: 'v1.**'
              }),
              '*'
            );
          }
        }

        // Handle avatar export
        if (json.eventName === 'v1.avatar.exported') {
          const avatarUrl = json.data.url;
          console.log('Avatar URL received:', avatarUrl);
          
          setSelectedAvatarUrl(avatarUrl);
          setIsAvatarCreatorOpen(false);
          setIsLoading(false);
          
          // Callback to parent component
          onAvatarSelected?.(avatarUrl);
        }

        // Handle user events
        if (json.eventName === 'v1.user.set') {
          console.log(`User with id ${json.data.id} set:`, json);
        }
        
      } catch (error) {
        // Ignore non-JSON messages
        return;
      }
    };

    // FIXED: Only add message listener to window
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onAvatarSelected]);

  const openAvatarCreator = () => {
    setIsAvatarCreatorOpen(true);
    setIsLoading(true);
  };

  const closeAvatarCreator = () => {
    setIsAvatarCreatorOpen(false);
    setIsLoading(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Current Avatar Display */}
      {selectedAvatarUrl && !isAvatarCreatorOpen && (
        <div className="mb-4">
          <div className="bg-gradient-to-br from-[#233045]/20 to-[#261A40]/10 rounded-2xl p-6 border border-[#233045] text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-2xl flex items-center justify-center mx-auto mb-4 glow-primary">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-white font-bold mb-2">AI Avatar Ready</p>
            <p className="text-gray-300 text-sm mb-4">3D avatar configured for neural interactions</p>
            <div className="flex gap-2 justify-center">
              <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-xs rounded-full font-bold glow-primary">
                ✓ Active
              </span>
              <button
                onClick={openAvatarCreator}
                className="px-4 py-1 bg-[#8B5CF6]/20 text-purple-300 text-xs rounded-full border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/30 hover:text-white transition-all font-medium"
              >
                Modify Avatar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Creator Button */}
      {!selectedAvatarUrl && !isAvatarCreatorOpen && (
        <button
          onClick={openAvatarCreator}
          className="w-full border-2 border-dashed border-[#233045] bg-gradient-to-br from-[#233045]/20 to-[#261A40]/10 hover:border-[#8B5CF6]/50 hover:bg-gradient-to-br hover:from-[#8B5CF6]/10 hover:to-[#A78BFA]/5 rounded-2xl p-8 transition-all cursor-pointer group hover-lift"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-2xl flex items-center justify-center mx-auto mb-4 glow-primary group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg mb-2">
              <span className="bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] bg-clip-text text-transparent">Create AI Avatar</span>
            </p>
            <p className="text-gray-300 text-sm">
              Launch Ready Player Me avatar creator for neural interface
            </p>
          </div>
        </button>
      )}

      {/* Avatar Creator Modal */}
      {isAvatarCreatorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[60] p-6">
          <div className="bg-gradient-to-br from-[#0F1426]/90 to-[#261A40]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#8B5CF6]/20 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden glow-intense">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white p-6 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black">VirtuSphere Avatar Creator</h3>
                  <p className="text-sm opacity-90 font-medium">Design your neural interface representation</p>
                </div>
              </div>
              <button
                onClick={closeAvatarCreator}
                className="text-white hover:text-gray-200 hover:bg-white/10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] rounded-full animate-spin mx-auto mb-4">
                    <div className="w-12 h-12 bg-[#080B18] rounded-full m-2"></div>
                  </div>
                  <p className="text-white font-bold text-lg">Initializing Avatar Creator...</p>
                  <p className="text-gray-300 text-sm">Neural interface synchronizing</p>
                </div>
              </div>
            )}

            {/* Avatar Creator iFrame */}
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              className="flex-1 w-full border-0 bg-white"
              allow="camera *; microphone *; clipboard-write"
              onLoad={() => setIsLoading(false)}
            />
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

  // Enhanced event form state with new schema fields including avatar_url
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
    avatar_url: '', // New field for avatar
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
      avatar_url: '', // Reset avatar URL
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
      avatar_url: event.avatar_url || '', // Include avatar URL
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

                {/* Avatar Creator Section */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    AI Avatar Interface
                  </label>
                  <VirtuSphereAvatarCreator
                    currentAvatarUrl={eventForm.avatar_url}
                    onAvatarSelected={(url) => setEventForm({...eventForm, avatar_url: url})}
                    className="mb-2"
                  />
                  {eventForm.avatar_url && (
                    <p className="text-xs text-gray-400 mt-2 p-3 bg-[#233045]/20 rounded-xl border border-[#233045]">
                      <span className="text-purple-300 font-medium">Avatar Portal:</span> {eventForm.avatar_url.substring(0, 80)}...
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Active Experiences</h2>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#233045]/50 to-[#261A40]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-lg">No experiences created yet</p>
                    <p className="text-gray-500 text-sm">Create your first virtual experience to get started</p>
                  </div>
                ) : (
                  events.map((event) => {
                    const eventRegs = getEventRegistrations(event.id);
                    const isUpcoming = event.event_date && new Date(event.event_date) > new Date();
                    
                    return (
                      <div key={event.id} className="bg-gradient-to-br from-[#233045]/30 to-[#261A40]/20 rounded-2xl p-6 border border-[#233045] hover:border-[#8B5CF6]/30 transition-all group hover-lift">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                                {event.title}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                event.status === 'active' 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white glow-primary'
                                  : event.status === 'completed'
                                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                              }`}>
                                {event.status === 'active' ? '✓ Active' : 
                                 event.status === 'completed' ? '📋 Completed' : '⚠ Suspended'}
                              </span>
                              {isUpcoming && (
                                <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-full text-xs font-bold glow-primary animate-pulse">
                                  🚀 Upcoming
                                </span>
                              )}
                            </div>
                            {event.subtitle && (
                              <p className="text-gray-300 text-sm mb-2">{event.subtitle}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.mode || 'Virtual'}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                                {eventRegs.length}/{event.max_attendees} registered
                              </span>
                              {event.price > 0 && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                  ${event.price}
                                </span>
                              )}
                            </div>
                            {event.event_date && (
                              <p className="text-purple-300 text-sm font-medium">
                                📅 {new Date(event.event_date).toLocaleDateString()} at {new Date(event.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="px-3 py-2 bg-[#8B5CF6]/20 text-purple-300 rounded-xl border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/30 hover:text-white transition-all text-xs font-medium"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="px-3 py-2 bg-red-500/20 text-red-300 rounded-xl border border-red-500/30 hover:bg-red-500/30 hover:text-white transition-all text-xs font-medium"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>

                        {/* Tags and Skills */}
                        <div className="space-y-3">
                          {(event.categories && event.categories.length > 0) && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Experience Tags:</p>
                              <div className="flex flex-wrap gap-1">
                                {event.categories.map((category, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-[#8B5CF6]/20 text-purple-300 text-xs rounded-lg border border-[#8B5CF6]/20">
                                    {category}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {(event.skills && event.skills.length > 0) && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Skills Enhancement:</p>
                              <div className="flex flex-wrap gap-1">
                                {event.skills.map((skill, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-lg border border-emerald-500/20">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Registration Progress Bar */}
                        {eventRegs.length > 0 && (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Registration Progress</span>
                              <span>{Math.round((eventRegs.length / event.max_attendees) * 100)}% filled</span>
                            </div>
                            <div className="w-full bg-[#233045] rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all glow-primary"
                                style={{ width: `${(eventRegs.length / event.max_attendees) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-8 border border-[#233045]/50 glow-primary">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Neural Interface Registrations</h2>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {registrations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#233045]/50 to-[#261A40]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg">No registrations yet</p>
                  <p className="text-gray-500 text-sm">Participants will appear here once they join experiences</p>
                </div>
              ) : (
                registrations.map((registration) => (
                  <div key={registration.id} className="bg-gradient-to-br from-[#233045]/30 to-[#261A40]/20 rounded-2xl p-6 border border-[#233045] hover:border-[#8B5CF6]/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{registration.user_name}</h3>
                        <p className="text-purple-300 text-sm font-medium">
                          {registration.events?.title || 'Experience not found'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        registration.status === 'registered' 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white glow-primary'
                          : registration.status === 'attended'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      }`}>
                        {registration.status === 'registered' ? '✓ Registered' : 
                         registration.status === 'attended' ? '🎯 Attended' : '❌ Cancelled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        {registration.user_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8h0m-3-3h6m-3 0h0m-3 0h0" />
                        </svg>
                        {new Date(registration.registration_date).toLocaleDateString()}
                      </span>
                      {registration.events?.event_date && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8h0m-3-3h6m-3 0h0m-3 0h0" />
                          </svg>
                          Event: {new Date(registration.events.event_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Event Types Distribution */}
              <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-8 border border-[#233045]/50 glow-primary">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Experience Types</h3>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(analytics.eventsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">{type}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-[#233045] rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] h-2 rounded-full transition-all glow-primary"
                            style={{ width: `${(count / analytics.totalEvents) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-bold text-sm w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reality Mode Distribution */}
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
                  {Object.entries(analytics.eventsByMode).map(([mode, count]) => {
                    const modeLabels = {
                      online: 'Virtual Reality',
                      offline: 'Physical Space', 
                      hybrid: 'Hybrid Dimension'
                    };
                    return (
                      <div key={mode} className="flex items-center justify-between">
                        <span className="text-gray-300">{modeLabels[mode as keyof typeof modeLabels] || mode}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-[#233045] rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all glow-primary"
                              style={{ width: `${(count / analytics.totalEvents) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-white font-bold text-sm w-8 text-right">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl rounded-3xl p-8 border border-[#233045]/50 glow-primary">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Recent Neural Activity</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#233045]/30 to-[#261A40]/20 rounded-2xl p-6 border border-[#233045]">
                  <div className="text-center">
                    <div className="text-3xl font-black text-white mb-2">{events.filter(e => e.status === 'active').length}</div>
                    <p className="text-gray-300 font-medium">Active Portals</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#233045]/30 to-[#261A40]/20 rounded-2xl p-6 border border-[#233045]">
                  <div className="text-center">
                    <div className="text-3xl font-black text-white mb-2">{registrations.filter(r => r.status === 'registered').length}</div>
                    <p className="text-gray-300 font-medium">Pending Connections</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#233045]/30 to-[#261A40]/20 rounded-2xl p-6 border border-[#233045]">
                  <div className="text-center">
                    <div className="text-3xl font-black text-white mb-2">
                      {events.reduce((total, event) => total + getEventRegistrations(event.id).length, 0)}
                    </div>
                    <p className="text-gray-300 font-medium">Total Neural Links</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}