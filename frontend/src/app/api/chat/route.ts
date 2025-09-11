// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { event_details, user_input } = await request.json();

    console.log('📤 Forwarding to FastAPI:', { event_details, user_input });

    // Forward to your FastAPI backend
    const response = await fetch('http://localhost:8000/rag-groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_details,
        user_input,
      }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 FastAPI Response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        generated_text: "I'm sorry, I'm currently unable to process your request. Please try again later." 
      },
      { status: 500 }
    );
  }
}
