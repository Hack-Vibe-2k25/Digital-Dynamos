// components/EventRegistrationForm.tsx
"use client";
import { useState } from 'react';
import { supabase } from 'src/lib/supabase';
import { Event } from 'src/lib/types';

interface EventRegistrationFormProps {
  event: Event;
}

export default function EventRegistrationForm({ event }: EventRegistrationFormProps) {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if already registered
      const { data: existing } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_email', formData.user_email)
        .single();

      if (existing) {
        setError('You have already registered for this event.');
        setLoading(false);
        return;
      }

      // Check capacity
      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', event.id)
        .eq('status', 'registered');

      if (registrations && registrations.length >= event.max_attendees) {
        setError('This event is fully booked.');
        setLoading(false);
        return;
      }

      // Register user
      const { error: insertError } = await supabase
        .from('event_registrations')
        .insert([{
          event_id: event.id,
          ...formData
        }]);

      if (insertError) throw insertError;

      setRegistered(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="card bg-green-50 border-green-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Registration Successful!
          </h3>
          <p className="text-green-700">
            You have successfully registered for {event.title}. 
            Check your email for confirmation details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card sticky top-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Register for Event</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.user_name}
            onChange={(e) => setFormData({...formData, user_name: e.target.value})}
            className="input-field"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.user_email}
            onChange={(e) => setFormData({...formData, user_email: e.target.value})}
            className="input-field"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="input-field"
            placeholder="Enter your phone number"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : `Register ${event.price > 0 ? `($${event.price})` : '(Free)'}`}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Available Spots</span>
          <span className="font-medium">
            {/* This would need real-time data from the server */}
            {event.max_attendees} max
          </span>
        </div>
      </div>
    </div>
  );
}
