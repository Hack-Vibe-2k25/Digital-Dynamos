"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "src/lib/supabase";
import { Event, RAGResponse } from "src/lib/types";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

interface EventChatbotProps {
  event: Event;
  onClose?: () => void;
  embedded?: boolean;
}

interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  emotions?: string[];
}

/* ---------------------------
   Talking-head AnimatedAvatar
   (viseme timeline + emotion overlay)
   --------------------------- */

type Emotion = string;

const VISIME_MAP: Record<string, string> = {
  a: "mouthOpen",
  e: "mouthSmile",
  i: "mouthSmile",
  o: "mouthFunnel",
  u: "mouthPucker",
  m: "mouthClosed",
  p: "mouthPucker",
  b: "mouthPucker",
  t: "mouthTense",
  d: "mouthTense",
  s: "mouthNarrow",
  default: "mouthOpen",
};

function pickVisemeForChunk(chunk: string) {
  const c = chunk.trim().charAt(0).toLowerCase();
  return VISIME_MAP[c] || VISIME_MAP.default;
}

function textToVisemeTimeline(text: string, utteranceRate = 1.0) {
  const baseMsPerChar = 80;
  const estDuration = Math.max(200, (text.length * baseMsPerChar) / utteranceRate);
  const chunks: string[] = [];
  const re = /[aeiouy]+|[^aeiouy\s]+/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) chunks.push(m[0]);
  if (chunks.length === 0) text.split(/\s+/).forEach((w) => chunks.push(w));
  const totalChars = chunks.reduce((s, c) => s + c.length, 0) || 1;
  let t = 0;
  const timeline = chunks.map((chunk) => {
    const dur = Math.max(40, Math.round((chunk.length / totalChars) * estDuration));
    const viseme = pickVisemeForChunk(chunk);
    const entry = { start: t, duration: dur, viseme, chunk };
    t += dur;
    return entry;
  });
  return { timeline, duration: t };
}

function AnimatedAvatar({
  avatarUrl,
  currentMessage,
  emotions = [],
  scale = 1.2,
}: {
  avatarUrl: string;
  currentMessage?: string;
  emotions?: string[];
  scale?: number;
}) {
  const gltf = useLoader(GLTFLoader, avatarUrl);
  const rootRef = useRef<THREE.Group | null>(null);
  const morphMeshesRef = useRef<THREE.Mesh[]>([]);
  const morphDictsRef = useRef<Record<string, number>[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingTimersRef = useRef<number[]>([]);
  const blinkTimerRef = useRef<number | null>(null);

  const EMOTION_BASE: Record<string, Record<string, number>> = {
    joy: { mouthSmile: 0.6, cheekPuff: 0.2 },
    sadness: { mouthFrown: 0.5 },
    anger: { browDownLeft: 0.6, browDownRight: 0.6 },
    surprise: { jawOpen: 0.4 },
    neutral: {},
  };

  // Warm up voices on mount (some browsers populate voices async)
  useEffect(() => {
    const v = window.speechSynthesis.getVoices();
    if (v.length === 0) {
      // try again after a short delay
      const t = window.setTimeout(() => window.speechSynthesis.getVoices(), 200);
      return () => window.clearTimeout(t);
    }
    return;
  }, []);

  // collect morph meshes once after model loads
  useEffect(() => {
    morphMeshesRef.current = [];
    morphDictsRef.current = [];
    gltf.scene.traverse((child) => {
      if (
        (child as THREE.Mesh).isMesh &&
        (child as THREE.Mesh).morphTargetDictionary &&
        (child as THREE.Mesh).morphTargetInfluences
      ) {
        morphMeshesRef.current.push(child as THREE.Mesh);
        morphDictsRef.current.push((child as THREE.Mesh).morphTargetDictionary as Record<string, number>);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf.scene]);

  const setMorph = (name: string, value: number) => {
    morphMeshesRef.current.forEach((mesh, idx) => {
      const dict = morphDictsRef.current[idx];
      const i = dict ? dict[name] : undefined;
      if (i !== undefined && mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[i] = value;
      }
    });
  };

  const applyEmotionOverlay = (emotion: string) => {
    const overlay = EMOTION_BASE[emotion] || {};
    Object.entries(overlay).forEach(([shape, val]) => {
      morphMeshesRef.current.forEach((mesh, idx) => {
        const dict = morphDictsRef.current[idx];
        const i = dict ? dict[shape] : undefined;
        if (i !== undefined && mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[i] = Math.max(mesh.morphTargetInfluences[i] || 0, val);
        }
      });
    });
  };

  const doBlink = () => {
    const left = "eyeBlinkLeft";
    const right = "eyeBlinkRight";
    setMorph(left, 1.0);
    setMorph(right, 1.0);
    window.setTimeout(() => {
      setMorph(left, 0.0);
      setMorph(right, 0.0);
    }, 120);
  };

  // blinking loop
  useEffect(() => {
    const loop = () => {
      const delay = 3000 + Math.random() * 4000; // 3-7s
      blinkTimerRef.current = window.setTimeout(() => {
        doBlink();
        loop();
      }, delay);
    };
    loop();
    return () => {
      if (blinkTimerRef.current) window.clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // speak with viseme timeline
  const speakText = (text: string, emotion = "neutral") => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    speakingTimersRef.current.forEach((t) => window.clearTimeout(t));
    speakingTimersRef.current = [];

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = (voices.find((v) => v.name.includes("Neural")) as SpeechSynthesisVoice) || voices[0] || null;

    switch (emotion) {
      case "joy":
        utterance.rate = 1.05;
        utterance.pitch = 1.2;
        break;
      case "sadness":
        utterance.rate = 0.85;
        utterance.pitch = 0.8;
        break;
      case "anger":
        utterance.rate = 1.15;
        utterance.pitch = 0.9;
        break;
      case "surprise":
        utterance.rate = 1.2;
        utterance.pitch = 1.25;
        break;
      default:
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
    }

    const { timeline, duration } = textToVisemeTimeline(text, utterance.rate);

    utterance.onstart = () => {
      setIsSpeaking(true);
      // reset mouth shapes
      [
        "mouthOpen",
        "jawOpen",
        "mouthFunnel",
        "mouthPucker",
        "mouthSmile",
        "mouthFrown",
        "mouthClosed",
        "mouthNarrow",
        "mouthTense",
      ].forEach((s) => setMorph(s, 0));
      applyEmotionOverlay(emotion);

      timeline.forEach((entry) => {
        const tStart = window.setTimeout(() => {
          [
            "mouthOpen",
            "jawOpen",
            "mouthFunnel",
            "mouthPucker",
            "mouthSmile",
            "mouthFrown",
            "mouthClosed",
            "mouthNarrow",
            "mouthTense",
          ].forEach((s) => setMorph(s, 0));

          const viseme = entry.viseme || "mouthOpen";
          const intensity = 0.5 + Math.random() * 0.45;
          setMorph(viseme, intensity);
          applyEmotionOverlay(emotion);

          if (viseme === "mouthOpen" || viseme === "mouthFunnel") {
            setMorph("jawOpen", Math.min(0.6, intensity * 0.9));
          }
        }, entry.start);
        speakingTimersRef.current.push(tStart);

        const tEnd = window.setTimeout(() => {
          [
            "mouthOpen",
            "jawOpen",
            "mouthFunnel",
            "mouthPucker",
            "mouthSmile",
            "mouthFrown",
            "mouthClosed",
            "mouthNarrow",
            "mouthTense",
          ].forEach((s) => {
            const baseVal = (EMOTION_BASE[emotion] && EMOTION_BASE[emotion][s]) || 0;
            setMorph(s, baseVal);
          });
        }, entry.start + entry.duration);
        speakingTimersRef.current.push(tEnd);
      });

      const finishTimer = window.setTimeout(() => {
        setIsSpeaking(false);
        [
          "mouthOpen",
          "jawOpen",
          "mouthFunnel",
          "mouthPucker",
          "mouthSmile",
          "mouthFrown",
          "mouthClosed",
          "mouthNarrow",
          "mouthTense",
        ].forEach((s) => {
          const baseVal = (EMOTION_BASE[emotion] && EMOTION_BASE[emotion][s]) || 0;
          setMorph(s, baseVal);
        });
      }, duration + 120);
      speakingTimersRef.current.push(finishTimer);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      speakingTimersRef.current.forEach((t) => window.clearTimeout(t));
      speakingTimersRef.current = [];
    };

    window.speechSynthesis.speak(utterance);
  };

  // trigger speak when message changes
  useEffect(() => {
    if (!currentMessage) return;
    const emotion = (emotions && emotions[0]) || "neutral";
    const t = window.setTimeout(() => speakText(currentMessage, emotion), 60);
    speakingTimersRef.current.push(t);
    return () => {
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMessage, emotions]);

  // breathing / idle / speaking micro movement
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!rootRef.current) return;
    rootRef.current.scale.y = 1 + Math.sin(t * 1.5) * 0.01 * (scale || 1);
    if (!isSpeaking) {
      rootRef.current.rotation.y = Math.sin(t * 0.25) * 0.015;
      rootRef.current.rotation.x = Math.sin(t * 0.13) * 0.008;
    } else {
      rootRef.current.rotation.y = Math.sin(t * 0.45) * 0.02;
    }
  });

  useEffect(() => {
    return () => {
      speakingTimersRef.current.forEach((t) => window.clearTimeout(t));
      if (blinkTimerRef.current) window.clearTimeout(blinkTimerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <group ref={rootRef}>
      <primitive object={gltf.scene} scale={[scale, scale, scale]} />
    </group>
  );
}

/* ---------------------------
   EventChatbot (main)
   --------------------------- */

export default function EventChatbot({ event, onClose, embedded = false }: EventChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(embedded);
  const [avatarUrl, setAvatarUrl] = useState(
    "https://models.readyplayer.me/64e3055495439dfcf3f0b665.glb"
  );
  const [currentSpeech, setCurrentSpeech] = useState<{ text: string; emotions: string[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    if (isOpen) {
      const welcomeMessage: ChatMessage = {
        id: "1",
        type: "bot",
        content: `🌟 Greetings, explorer! I'm your AI companion for "${event.title}". How may I illuminate your path through this experience?`,
        timestamp: new Date(),
        emotions: ["joy"],
      };
      setMessages([welcomeMessage]);
      setCurrentSpeech({ text: welcomeMessage.content, emotions: welcomeMessage.emotions || [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatEventDetails = () => {
    const eventDate = event.event_date ? new Date(event.event_date).toLocaleString() : "TBA";
    const categories = event.categories?.join(", ") || "General";

    return `Event: ${event.title}
Description: ${event.description || "N/A"}
Date: ${eventDate}
Location: ${event.location || "TBA"}
Price: ${event.price > 0 ? `$${event.price}` : "Free"}
Max Attendees: ${event.max_attendees}
Category: ${categories}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const payload = { event_details: formatEventDetails(), user_input: userInput };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: RAGResponse = await res.json();

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: data.error || data.generated_text || "My neural pathways are recalibrating. Please try again.",
        timestamp: new Date(),
        emotions: data.emotions || ["neutral"],
      };

      setMessages((prev) => [...prev, botMessage]);
      setCurrentSpeech({ text: botMessage.content, emotions: botMessage.emotions || [] });

      await supabase.from("event_chats").insert([
        {
          event_id: event.id,
          session_id: sessionId.current,
          user_message: userInput,
          bot_response: botMessage.content,
          emotions: data.emotions ? { emotions: data.emotions } : null,
        },
      ]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "🔧 My quantum processors are experiencing interference. Attempting reconnection...",
        timestamp: new Date(),
        emotions: ["sadness"],
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentSpeech({ text: errorMessage.content, emotions: errorMessage.emotions || [] });
    }

    setUserInput("");
    setLoading(false);
  };

  const toggleChat = () => setIsOpen(!isOpen);

  const ChatBubble = ({ message }: { message: ChatMessage }) => (
    <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg hover-lift
        ${message.type === "user" 
          ? "bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white rounded-br-md glow-primary" 
          : "bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl border border-[#233045]/50 text-white rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed font-medium">{message.content}</p>
        {message.emotions && message.emotions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {message.emotions.map((emotion, idx) => (
              <span
                key={idx}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  message.type === "user" 
                    ? "bg-white/20 text-purple-100 border border-white/20" 
                    : "bg-[#8B5CF6]/20 text-purple-300 border border-[#8B5CF6]/30"
                }`}
              >
                ✨ {emotion}
              </span>
            ))}
          </div>
        )}
        <p className={`text-xs mt-3 opacity-75 ${message.type === "user" ? "text-purple-100" : "text-gray-400"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );

  const LoadingBubble = () => (
    <div className="flex justify-start mb-4">
      <div className="bg-gradient-to-br from-[#0F1426]/60 to-[#261A40]/40 backdrop-blur-xl border border-[#233045]/50 px-6 py-4 rounded-2xl rounded-bl-md shadow-sm glow-primary">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-[#8B5CF6] rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-[#A78BFA] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
          </div>
          <span className="text-sm text-white font-medium">Neural networks processing...</span>
        </div>
      </div>
    </div>
  );

  // Chat UI with full-viewport height for proper avatar visibility
  const ChatUI = () => (
    <div className="flex h-screen bg-[#080B18] starfield">
      {/* 3D Avatar Panel */}
      <div className="w-1/3 h-full bg-gradient-to-b from-[#0F1426]/80 to-[#261A40]/60 backdrop-blur-xl border-r border-[#233045]/50 relative">
        {/* Avatar Status Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-[#8B5CF6]/20 to-[#A78BFA]/10 backdrop-blur-xl border-b border-[#233045]/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <div>
              <h4 className="text-white font-bold text-sm">AI Avatar Active</h4>
              <p className="text-gray-300 text-xs">Neural interface synchronized</p>
            </div>
          </div>
        </div>

        <div className="h-full pt-16">
          <Canvas className="h-full" camera={{ position: [0, 1.6, 4], fov: 45 }}>
            <ambientLight intensity={0.6} color="#A78BFA" />
            <directionalLight position={[0, 5, 5]} intensity={1.2} color="#8B5CF6" />
            <pointLight position={[2, 2, 2]} intensity={0.8} color="#FFFFFF" />
            <pointLight position={[-2, 1, 2]} intensity={0.4} color="#A78BFA" />
            <AnimatedAvatar avatarUrl={avatarUrl} currentMessage={currentSpeech?.text} emotions={currentSpeech?.emotions} scale={1.2} />
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              target={[0, 1.2, 0]}
              minDistance={2}
              maxDistance={6}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
            />
            <Environment preset="city" />
          </Canvas>
        </div>

        {/* Avatar Controls */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-r from-[#0F1426]/80 to-[#261A40]/60 backdrop-blur-xl rounded-2xl p-4 border border-[#233045]/50">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300">Voice: Neural</span>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-300">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-[#0F1426]/80 to-[#261A40]/60 backdrop-blur-xl border-b border-[#233045]/50 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-2xl flex items-center justify-center glow-primary">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Neural Interface</h3>
              <p className="text-gray-300 font-medium">{event.title}</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-1 scrollbar-thin scrollbar-thumb-[#8B5CF6] scrollbar-track-[#233045]/30">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {loading && <LoadingBubble />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-6 bg-gradient-to-r from-[#0F1426]/80 to-[#261A40]/60 backdrop-blur-xl border-t border-[#233045]/50">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Channel your thoughts into the neural network..."
                autoFocus
                className="w-full px-6 py-4 bg-[#233045]/30 border border-[#233045] rounded-2xl text-white placeholder-gray-400 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all backdrop-blur-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setUserInput("")}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all duration-200 ${
                  userInput.trim() ? "opacity-100 hover:scale-110" : "opacity-0 pointer-events-none"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <button
              type="submit"
              disabled={loading || !userInput.trim()}
              className="px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white rounded-2xl hover:shadow-2xl hover:shadow-[#8B5CF6]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover-lift glow-intense font-bold"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="bg-[#080B18] starfield rounded-2xl shadow-2xl border border-[#233045]/50 h-full overflow-hidden glow-primary">
        <ChatUI />
      </div>
    );
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white p-4 rounded-2xl shadow-2xl hover:shadow-[#8B5CF6]/25 transition-all duration-300 hover-lift glow-intense z-50 group"
        >
          <svg className="w-7 h-7 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse border-2 border-white" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-6">
          <div className="bg-gradient-to-br from-[#0F1426]/90 to-[#261A40]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#8B5CF6]/20 w-full max-w-7xl h-[85vh] flex flex-col overflow-hidden glow-intense">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white p-8 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black">VirtuSphere AI Assistant</h3>
                  <p className="text-lg opacity-90 font-medium">{event.title}</p>
                </div>
              </div>
              <button
                onClick={() => (onClose ? onClose() : setIsOpen(false))}
                className="text-white hover:text-gray-200 hover:bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ChatUI />
          </div>
        </div>
      )}
    </>
  );
}