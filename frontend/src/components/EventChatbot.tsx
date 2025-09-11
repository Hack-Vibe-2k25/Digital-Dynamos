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
    // For debugging morph target names uncomment:
    // morphMeshesRef.current.forEach((m) => console.log("Morphs for", m.name, Object.keys((m as any).morphTargetDictionary || {})));
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
        content: `👋 Hello! I'm here to help you with questions about "${event.title}". What would you like to know?`,
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
        content: data.error || data.generated_text || "Sorry, I couldn't process your request.",
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
        content: "😔 Sorry, I'm having trouble connecting right now. Please try again in a moment.",
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
    <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md
        ${message.type === "user" ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md" : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"}`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        {message.emotions && message.emotions.length > 0 && (
          <div className="flex gap-1 mt-2">
            {message.emotions.map((emotion, idx) => (
              <span
                key={idx}
                className={`text-xs px-2 py-1 rounded-full ${message.type === "user" ? "bg-blue-500 text-blue-100" : "bg-gray-100 text-gray-600"}`}
              >
                {emotion}
              </span>
            ))}
          </div>
        )}
        <p className={`text-xs mt-2 ${message.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );

  const LoadingBubble = () => (
    <div className="flex justify-start mb-3">
      <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
          </div>
          <span className="text-sm text-gray-600 font-medium">AI is thinking...</span>
        </div>
      </div>
    </div>
  );

  // Chat UI with full-viewport height for proper avatar visibility
  const ChatUI = () => (
    <div className="flex h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 3D Avatar Panel */}
      <div className="w-1/3 h-full bg-gradient-to-b from-blue-50 to-blue-100 border-r border-gray-200">
        <div className="h-full">
          <Canvas className="h-full" camera={{ position: [0,3, 4], fov: 45 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[0, 5, 5]} intensity={1.0} />
            <pointLight position={[2, 2, 2]} intensity={0.5} />
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
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {loading && <LoadingBubble />}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex items-center p-4 border-t border-gray-200 bg-white">
          <div className="flex-1 relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask me anything about this event..."
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setUserInput("")}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-opacity duration-200 ${
                userInput.trim() ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !userInput.trim()}
            className="ml-3 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
        <ChatUI />
      </div>
    );
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:shadow-xl transform hover:scale-105 z-50 group"
        >
          <svg className="w-6 h-6 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">AI Event Assistant</h3>
                  <p className="text-sm opacity-90 font-medium">{event.title}</p>
                </div>
              </div>
              <button
                onClick={() => (onClose ? onClose() : setIsOpen(false))}
                className="text-white hover:text-gray-200 hover:bg-white hover:bg-opacity-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
