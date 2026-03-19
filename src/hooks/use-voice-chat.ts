import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceChatOptions {
  onTranscript: (text: string) => void;
  autoSpeak?: boolean;
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

export function useVoiceChat({ onTranscript, autoSpeak = true }: UseVoiceChatOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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
      if (!supportsTTS || !ttsEnabled || !autoSpeak) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supportsTTS, ttsEnabled, autoSpeak]
  );

  const stopSpeaking = useCallback(() => {
    if (supportsTTS) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [supportsTTS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (supportsTTS) window.speechSynthesis.cancel();
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
