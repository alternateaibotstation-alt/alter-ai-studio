import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceChatOptions {
  onTranscript: (text: string) => void;
  autoSpeak?: boolean;
  voiceId?: string;
  customVoiceUrl?: string;
}

// Extend Window for vendor-prefixed SpeechRecognition
interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export function useVoiceChat({ onTranscript, autoSpeak = true, voiceId = "browser-default", customVoiceUrl }: UseVoiceChatOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  const supportsSTT =
    typeof window !== "undefined" &&
    !!(
      (window as unknown as SpeechWindow).SpeechRecognition ||
      (window as unknown as SpeechWindow).webkitSpeechRecognition
    );

  const supportsTTS =
    typeof window !== "undefined" && !!window.speechSynthesis;

  const startListening = useCallback(() => {
    if (!supportsSTT) return;

    const SRConstructor =
      (window as unknown as SpeechWindow).SpeechRecognition ||
      (window as unknown as SpeechWindow).webkitSpeechRecognition;
    if (!SRConstructor) return;

    const recognition = new SRConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [supportsSTT, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || !autoSpeak) return;

      // Custom uploaded voice: play the audio sample
      if (voiceId === "custom-upload" && customVoiceUrl) {
        setIsSpeaking(true);
        const audio = new Audio(customVoiceUrl);
        customAudioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        audio.play().catch(() => setIsSpeaking(false));
        return;
      }

      if (!supportsTTS) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Apply selected voice
      if (voiceId !== "browser-default") {
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find(
          (v) => v.name === voiceId || v.name.includes(voiceId)
        );
        if (match) utterance.voice = match;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supportsTTS, ttsEnabled, autoSpeak, voiceId, customVoiceUrl]
  );

  const stopSpeaking = useCallback(() => {
    if (supportsTTS) {
      window.speechSynthesis.cancel();
    }
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current.currentTime = 0;
      customAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, [supportsTTS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (supportsTTS) window.speechSynthesis.cancel();
      if (customAudioRef.current) {
        customAudioRef.current.pause();
        customAudioRef.current = null;
      }
    };
  }, [supportsTTS]);

  return {
    isListening,
    isSpeaking,
    ttsEnabled,
    setTtsEnabled,
    supportsSTT,
    supportsTTS,
    toggleListening,
    speak,
    stopSpeaking,
  };
}
