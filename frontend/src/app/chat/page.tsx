"use client";
import { useState } from "react";

type RAGResponse = {
  error?: string;
  generated_text?: string;
  sentences?: string[];
  emotions?: string[];
};

export default function RAGTest() {
  const [eventDetails, setEventDetails] = useState("");
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<RAGResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload = { event_details: eventDetails, user_input: userInput };
    console.log("📤 Sending request payload:", payload);

    try {
      const res = await fetch("http://localhost:8000/rag-groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📥 Raw Response:", res);

      const data: RAGResponse = await res.json();
      console.log("✅ Parsed Response JSON:", data);

      setResult(data);
    } catch (err) {
      console.error("❌ API Request Error:", err);
      setResult({ error: "API request failed." });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>RAG + Emotion Detection (Groq + FastAPI)</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <textarea
          value={eventDetails}
          onChange={(e) => setEventDetails(e.target.value)}
          placeholder="Enter event details..."
          rows={4}
          cols={60}
          style={{ display: "block", marginBottom: "1rem", padding: "0.5rem" }}
        />
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter user query..."
          rows={3}
          cols={60}
          style={{ display: "block", marginBottom: "1rem", padding: "0.5rem" }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {loading ? "Processing..." : "Submit"}
        </button>
      </form>

      {result && (
        <div>
          {result.error ? (
            <p style={{ color: "red" }}>{result.error}</p>
          ) : (
            <>
              <h2>Generated Response:</h2>
              <p>{result.generated_text}</p>

              {result.sentences && result.emotions && (
                <>
                  <h3>Sentence-level Emotions:</h3>
                  <ul>
                    {result.sentences.map((sentence, idx) => (
                      <li key={idx}>
                        <strong>{sentence}</strong> →{" "}
                        <span style={{ color: "blue" }}>
                          {result.emotions?.[idx]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
