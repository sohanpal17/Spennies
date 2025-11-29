import { useState, useEffect, useCallback } from 'react';

export default function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  // Browser compatibility check
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError("Browser doesn't support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one sentence
    recognition.interimResults = false; // Only final results
    // 'en-IN' works well for Indian English/Hinglish. 
    // You can also use 'hi-IN' for Hindi or 'mr-IN' for Marathi.
    recognition.lang = 'en-IN'; 

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    // The API stops automatically on silence, but we can force stop UI state
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening, error, setTranscript };
}