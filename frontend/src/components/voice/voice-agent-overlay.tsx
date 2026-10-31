"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMerchant } from "@/lib/merchant-context";
import { useLanguage } from "@/lib/language-context";
import { FormEvent } from "react";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, X, Radio } from "lucide-react";

type VoiceState = "idle" | "connecting" | "listening" | "processing" | "speaking" | "interrupted" | "reconnecting" | "error" | "ended";
type ChatLine = { id: string; role: "user" | "assistant"; text: string; evidence?: Array<{ source: string; period: string; valuesStatus: string }> };

const languageOptions = [
  { value: "en-IN", label: "English" }, { value: "hi-IN", label: "हिन्दी" },
  { value: "kn-IN", label: "ಕನ್ನಡ" }, { value: "auto", label: "Auto detect" },
];

function downsampleTo16k(input: Float32Array, fromRate: number): Int16Array {
  if (fromRate === 16000) return Int16Array.from(input, (sample) => Math.max(-1, Math.min(1, sample)) * 32767);
  const ratio = fromRate / 16000;
  const output = new Int16Array(Math.floor(input.length / ratio));
  for (let i = 0; i < output.length; i++) {
    const start = Math.floor(i * ratio); const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    const average = sum / Math.max(end - start, 1);
    output[i] = Math.max(-1, Math.min(1, average)) * 32767;
  }
  return output;
}

export function VoiceAgentOverlay() {
  const { activeMerchantId, activeMerchant } = useMerchant();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<VoiceState>("idle");
  const [preferredLanguage, setPreferredLanguage] = useState<string>(language);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [partial, setPartial] = useState("");
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [errorText, setErrorText] = useState("");
  const [textInput, setTextInput] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const playbackSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const playbackCursorRef = useRef(0);
  const endedRef = useRef(false);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const speakerOnRef = useRef(true);
  const mutedRef = useRef(false);
  const doneRef = useRef(false);
  const pendingEvidenceRef = useRef<ChatLine["evidence"]>(undefined);
  // Track the server turn id that is currently allowed to play. Audio chunks
  // tagged with any other id are stale (barge-in interrupted that turn) and
  // must be dropped so buffered chunks from a cancelled response never play.
  const activeTurnIdRef = useRef<number | null>(null);

  useEffect(() => { speakerOnRef.current = speakerOn; }, [speakerOn]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => () => { endedRef.current = true; void cleanup(); }, []);

  const stopPlayback = useCallback(() => {
    for (const source of playbackSourcesRef.current) { try { source.stop(); } catch {} }
    playbackSourcesRef.current.clear();
    playbackCursorRef.current = contextRef.current?.currentTime || 0;
  }, []);

  const cleanup = useCallback(async () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (processorRef.current) {
      try { processorRef.current.onaudioprocess = null; } catch {}
      processorRef.current.disconnect();
    }
    sourceRef.current?.disconnect(); silentGainRef.current?.disconnect();
    processorRef.current = null; sourceRef.current = null; silentGainRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null;
    stopPlayback();
    activeTurnIdRef.current = null;
    const socket = socketRef.current; socketRef.current = null;
    if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.onopen = null; socket.onmessage = null; socket.onclose = null; socket.onerror = null;
      try { socket.send(JSON.stringify({ type: "end" })); } catch {}
      socket.close(1000, "ended");
    }
    const context = contextRef.current; contextRef.current = null;
    if (context && context.state !== "closed") await context.close().catch(() => {});
  }, [stopPlayback]);

  const pushLine = useCallback((line: ChatLine) => setLines((current) => [...current, line]), []);

  const handleServerMessage = useCallback(async (event: MessageEvent, sessionSocket: WebSocket) => {
    let message: any;
    try { message = JSON.parse(String(event.data)); } catch { return; }
    if (sessionSocket !== socketRef.current && message.type !== "ready") return;
    if (message.type === "ready") { reconnectCountRef.current = 0; setState("listening"); setErrorText(""); }
    if (message.type === "speech_start") { activeTurnIdRef.current = null; stopPlayback(); setState("listening"); }
    if (message.type === "interrupted") { activeTurnIdRef.current = null; stopPlayback(); setState("interrupted"); }
    if (message.type === "transcript_partial") setPartial(message.text || "");
    if (message.type === "transcript_final") {
      const text = String(message.text || "").trim(); setPartial("");
      if (text) {
        pushLine({ id: `u-${Date.now()}-${Math.random()}`, role: "user", text });
        historyRef.current.push({ role: "user", content: text });
        if (historyRef.current.length > 12) historyRef.current = historyRef.current.slice(-12);
      }
      setState("processing");
    }
    if (message.type === "processing") { doneRef.current = false; activeTurnIdRef.current = typeof message.turnId === "number" ? message.turnId : activeTurnIdRef.current; setState("processing"); }
    if (message.type === "assistant_text") {
      pushLine({ id: `a-${message.turnId}-${Date.now()}`, role: "assistant", text: message.text, evidence: pendingEvidenceRef.current });
      pendingEvidenceRef.current = undefined;
      historyRef.current.push({ role: "assistant", content: message.text });
    }
    if (message.type === "assistant_delta") {
      setLines((current) => {
        const id = `a-${message.turnId}`;
        const index = current.findIndex((line) => line.id === id);
        if (index >= 0) return current.map((line) => line.id === id ? { ...line, text: line.text + message.text } : line);
        return [...current, { id, role: "assistant", text: message.text }];
      });
      const last = historyRef.current[historyRef.current.length - 1];
      if (last?.role === "assistant") last.content += message.text; else historyRef.current.push({ role: "assistant", content: message.text });
    }
    if (message.type === "tool_result") {
      pendingEvidenceRef.current = message.evidence || [];
    }
    if (message.type === "audio_chunk" && speakerOnRef.current && contextRef.current) {
      // Reject stale audio: if an interruption cleared the active turn, or the
      // chunk belongs to a different turn than the one currently allowed to
      // play, drop it so the previous response can never leak through.
      const chunkTurn = typeof message.turnId === "number" ? message.turnId : null;
      if (activeTurnIdRef.current === null) return;
      if (chunkTurn !== null && chunkTurn !== activeTurnIdRef.current) return;
      const raw = atob(message.audio);
      const pcm = new Int16Array(raw.length / 2);
      for (let i = 0; i < pcm.length; i++) pcm[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
      const context = contextRef.current;
      const buffer = context.createBuffer(1, pcm.length, message.sampleRate || 16000);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;
      const source = context.createBufferSource(); source.buffer = buffer; source.connect(context.destination);
      const startAt = Math.max(context.currentTime + 0.025, playbackCursorRef.current);
      playbackCursorRef.current = startAt + buffer.duration;
      playbackSourcesRef.current.add(source);
      source.onended = () => {
        playbackSourcesRef.current.delete(source);
        if (doneRef.current && playbackSourcesRef.current.size === 0 && socketRef.current) setState("listening");
      };
      source.start(startAt); setState("speaking");
    }
    if (message.type === "assistant_done") {
      doneRef.current = true;
      if (playbackSourcesRef.current.size === 0) setState("listening");
    }
    if (message.type === "language_changed") setPreferredLanguage(message.language);
    if (message.type === "error") { setState("error"); setErrorText(message.message || "Voice session error"); }
    if (message.type === "error" && /stt_(1003|4000)|provider_unavailable|session_expired/.test(message.code || "")) endedRef.current = true;
    if (message.type === "ended") { endedRef.current = true; await cleanup(); setState("ended"); }
  }, [cleanup, pushLine, stopPlayback]);

  const openSocket = useCallback((reconnecting: boolean) => {
    if (!activeMerchantId) return;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const wsBase = base.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    const url = new URL(`${wsBase}/api/voice/stream`);
    url.searchParams.set("merchantId", activeMerchantId);
    url.searchParams.set("language", preferredLanguage || language);
    const ws = new WebSocket(url);
    socketRef.current = ws;
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "resume", history: historyRef.current.slice(-8) }));
      if (reconnecting) setState("listening");
    };
    ws.onmessage = (event) => { void handleServerMessage(event, ws); };
    ws.onerror = () => { if (!endedRef.current) setErrorText("Connection issue. Checking whether the session can reconnect…"); };
    ws.onclose = (event) => {
      if (endedRef.current) return;
      if ([4401, 4403, 4408, 4429].includes(event.code) || reconnectCountRef.current >= 2) {
        setState("error"); setErrorText(event.code === 4401 ? "Your session expired. Sign in again." : "Voice connection ended. Start a new session or use text chat.");
        return;
      }
      reconnectCountRef.current += 1; setState("reconnecting");
      reconnectTimerRef.current = setTimeout(() => openSocket(true), reconnectCountRef.current * 700);
    };
  }, [activeMerchantId, handleServerMessage, language, preferredLanguage]);

  const start = useCallback(async () => {
    endedRef.current = true;
    await cleanup();
    endedRef.current = false; reconnectCountRef.current = 0; setLines([]); historyRef.current = []; setErrorText(""); setPartial(""); setState("connecting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone capture is not available in this browser.");
      const context = new AudioContext({ sampleRate: 16000 });
      contextRef.current = context;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream;
      openSocket(false);
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(2048, 1, 1);
      const silentGain = context.createGain(); silentGain.gain.value = 0;
      source.connect(processor); processor.connect(silentGain); silentGain.connect(context.destination);
      processor.onaudioprocess = (audioEvent) => {
        const socket = socketRef.current;
        if (mutedRef.current || !socket || socket.readyState !== WebSocket.OPEN) return;
        const pcm = downsampleTo16k(audioEvent.inputBuffer.getChannelData(0), context.sampleRate);
        if (pcm.byteLength) socket.send(pcm.buffer);
      };
      sourceRef.current = source; processorRef.current = processor; silentGainRef.current = silentGain;
    } catch (cause) {
      const message = cause instanceof DOMException && cause.name === "NotAllowedError"
        ? "Microphone permission was denied. Allow microphone access and try again."
        : cause instanceof Error ? cause.message : "Microphone could not be started.";
      setErrorText(message); setState("error"); await cleanup();
    }
  }, [cleanup, muted, openSocket]);

  const toggleSpeaker = () => {
    setSpeakerOn((value) => {
      if (value) stopPlayback();
      return !value;
    });
  };

  const sendText = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const text = textInput.trim(); const socket = socketRef.current;
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
    setTextInput(""); pushLine({ id: `u-${Date.now()}`, role: "user", text });
    historyRef.current.push({ role: "user", content: text });
    socket.send(JSON.stringify({ type: "text_turn", text })); setState("processing");
  };

  const end = useCallback(async () => { endedRef.current = true; await cleanup(); setState("ended"); }, [cleanup]);
  const startRef = useRef(start); useEffect(() => { startRef.current = start; }, [start]);
  const handleOpen = () => { setOpen(true); void startRef.current(); };
  const handleClose = async () => { await end(); setOpen(false); setState("idle"); };

  useEffect(() => {
    const onHotkey = (event: KeyboardEvent) => { if (event.key === "Escape" && open) void handleClose(); };
    window.addEventListener("keydown", onHotkey); return () => window.removeEventListener("keydown", onHotkey);
  }, [open]);

  return <>
    <button onClick={handleOpen} aria-label="Open Voice Assistant" className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-paytm-navy px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-sky-200">
      <Mic className="h-5 w-5" /><span className="hidden sm:inline">Voice Assistant</span>
    </button>
    {open && <div role="dialog" aria-modal="true" aria-label="Voice Assistant" className="fixed inset-0 z-50 flex items-center justify-center bg-paytm-navy/45 p-3 backdrop-blur-sm sm:p-6">
      <section className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full transition ${state === "speaking" ? "animate-pulse bg-emerald-100 text-success" : state === "listening" ? "animate-pulse bg-sky-100 text-paytm-blue" : "bg-slate-100 text-paytm-navy"}`}><Radio className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1"><h2 className="font-semibold text-paytm-navy">Voice Assistant</h2><p className="truncate text-xs text-slate-500">{activeMerchant?.name || "Merchant workspace"} · {stateLabel(state)}</p></div>
          <select aria-label="Voice language" value={preferredLanguage} onChange={(e) => { setPreferredLanguage(e.target.value); socketRef.current?.send(JSON.stringify({ type: "language", language: e.target.value })); }} className="rounded-lg border border-border bg-white px-2 py-2 text-xs text-paytm-navy">
            {languageOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button onClick={() => void handleClose()} aria-label="Close voice assistant" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-canvas p-4 sm:p-6">
          <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-sky-100 bg-white p-5 text-center">
            <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full ${state === "speaking" ? "bg-emerald-100" : "bg-sky-100"}`}><div className={`h-8 w-8 rounded-full ${state === "speaking" ? "animate-ping bg-success/70" : "animate-pulse bg-paytm-blue/70"}`} /></div>
            <p aria-live="polite" className="text-sm font-semibold text-paytm-navy">{stateLabel(state)}</p>
            <p className="mt-1 max-w-md text-xs text-slate-500">Speak naturally. Short pauses won’t end your turn immediately.</p>
          </div>
          <div className="space-y-3" aria-live="polite">
            {lines.map((line) => <div key={line.id} className={`max-w-[90%] rounded-xl border bg-white px-3 py-2.5 shadow-sm ${line.role === "user" ? "ml-auto border-sky-100" : "border-border"}`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-paytm-navy">{line.text}</p>
              {line.evidence?.map((item, index) => <span key={`${item.source}-${index}`} className="mr-1 mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600">Based on {item.source} · {item.period}{item.valuesStatus === "estimate" ? " · estimate" : ""}</span>)}
            </div>)}
            {partial && <div className="ml-4 text-sm italic text-slate-500">{partial}…</div>}
          </div>
          <form onSubmit={sendText} className="mt-auto flex gap-2">
            <input value={textInput} onChange={(event) => setTextInput(event.target.value)} disabled={!socketRef.current || state === "connecting" || state === "ended"} placeholder="Type instead of speaking…" className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200" />
            <button type="submit" disabled={!textInput.trim() || !socketRef.current || state === "connecting"} className="rounded-lg bg-paytm-blue px-4 py-2 text-sm font-semibold text-paytm-navy disabled:opacity-50">Send</button>
          </form>
          {errorText && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errorText}</div>}
        </div>
        <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-border bg-white px-4 py-4 sm:gap-4">
          <button onClick={() => setMuted((value) => !value)} disabled={state === "idle" || state === "ended"} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${muted ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-paytm-navy"}`}>
            {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{muted ? "Unmute" : "Mute mic"}
          </button>
          <button onClick={toggleSpeaker} disabled={state === "idle" || state === "ended"} className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-paytm-navy">
            {speakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{speakerOn ? "Speaker on" : "Speaker off"}
          </button>
          {(state === "idle" || state === "ended" || state === "error") ? <button onClick={() => void start()} className="flex items-center gap-2 rounded-full bg-paytm-navy px-5 py-2 text-sm font-semibold text-white"><Mic className="h-4 w-4" />{state === "error" ? "Try again" : "Start conversation"}</button> : <button onClick={() => void end()} className="flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700"><PhoneOff className="h-4 w-4" />End conversation</button>}
        </footer>
      </section>
    </div>}
  </>;
}

function stateLabel(state: VoiceState) {
  return ({ idle: "Ready", connecting: "Connecting…", listening: "Listening", processing: "Thinking…", speaking: "Speaking", interrupted: "Interrupted · listening", reconnecting: "Reconnecting…", error: "Connection needs attention", ended: "Conversation ended" } satisfies Record<VoiceState, string>)[state];
}
