"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { Send, Bot, User, Sparkles, Mic, MicOff, Volume2, Database } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  dataUsed?: string[];
  audioBase64?: string;
}

const suggestedQuestions = [
  "Why are my afternoon sales declining?",
  "Which products should I promote?",
  "How can I increase my average order value?",
  "Which customer segment should I target next?",
  "What time of day generates the most revenue?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { language, t } = useLanguage();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildHistory = () => messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

  const sendMessage = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await api<{ response: string; dataUsed?: string[] }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: msg, language, history: buildHistory() }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.response, dataUsed: res.dataUsed }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks.current = [];
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const audioBase64 = btoa(binary);

        setLoading(true);
        try {
          const res = await api<{
            transcript: string;
            response: string;
            audioBase64?: string;
            languageCode?: string;
            dataUsed?: string[];
          }>("/api/voice/ask", {
            method: "POST",
            body: JSON.stringify({ audioBase64, mimeType: "audio/webm", language }),
          });
          setMessages((prev) => [
            ...prev,
            { role: "user", content: res.transcript || "(voice message)" },
            { role: "assistant", content: res.response, dataUsed: res.dataUsed, audioBase64: res.audioBase64 },
          ]);
          if (res.audioBase64) {
            const audio = new Audio(`data:audio/wav;base64,${res.audioBase64}`);
            audio.play().catch(() => {});
          }
        } catch {
          setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process your voice message." }]);
        } finally {
          setLoading(false);
        }
      };
      mediaRecorder.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      alert("Could not access microphone. Please allow microphone access.");
    }
  }, [language]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  }, []);

  const speakMessage = async (text: string, idx: number) => {
    setPlayingIdx(idx);
    try {
      const res = await api<{ audioBase64: string }>("/api/voice/speak", {
        method: "POST",
        body: JSON.stringify({ text, language }),
      });
      const audio = new Audio(`data:audio/wav;base64,${res.audioBase64}`);
      audio.onended = () => setPlayingIdx(null);
      audio.play().catch(() => setPlayingIdx(null));
    } catch {
      setPlayingIdx(null);
    }
  };

  return (
    <div className="flex min-h-[420px] flex-col h-[calc(100dvh-13rem)] lg:h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">{t("assistantTitle")}</h1>
        <p className="text-sm text-slate-400 mt-1">Ask questions about your business — powered by your real data</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-full bg-blue-600/10 p-4 mb-4">
                <Sparkles className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">How can I help your business?</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-md">
                I analyse the selected merchant&apos;s transaction data, customer segments, and product performance. You can type or tap the mic to ask by voice.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="rounded-lg bg-blue-600/10 p-2 h-fit shrink-0">
                  <Bot className="h-4 w-4 text-blue-400" />
                </div>
              )}
              <div className="max-w-[75%]">
                <div
                  className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => speakMessage(msg.content, i)}
                      disabled={playingIdx !== null}
                      className="text-slate-500 hover:text-blue-400 transition-colors"
                      title="Listen"
                    >
                      <Volume2 className={`h-3.5 w-3.5 ${playingIdx === i ? "text-blue-400 animate-pulse" : ""}`} />
                    </button>
                  )}
                  {msg.dataUsed && msg.dataUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <Database className="h-3 w-3 text-slate-500" />
                      <span className="text-[10px] text-slate-500">Based on:</span>
                      {msg.dataUsed.map((d) => (
                        <Badge key={d} variant="default">{d}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="rounded-lg bg-slate-700 p-2 h-fit shrink-0">
                  <User className="h-4 w-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="rounded-lg bg-blue-600/10 p-2 h-fit">
                <Bot className="h-4 w-4 text-blue-400 animate-pulse" />
              </div>
              <div className="bg-slate-800 rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </CardContent>

        <div className="border-t border-slate-800 p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("askBusiness")}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              disabled={loading || recording}
            />
            <Button
              type="button"
              variant={recording ? "danger" : "secondary"}
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              title={recording ? "Stop recording" : "Record voice message"}
            >
              {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
              <Button type="submit" disabled={loading || !input.trim() || recording}>
              <Send className="h-4 w-4" />
                <span className="sr-only">{t("send")}</span>
            </Button>
          </form>
          {recording && (
            <p className="text-xs text-red-600 mt-2 animate-pulse">{t("recording")}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
