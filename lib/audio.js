/**
 * Audio playback helpers for "Vinyl Liner Notes".
 * Uses real MP3 streaming via /api/tts for universal cross-platform playback
 * (Brave, Chrome, Safari, Firefox, Linux, macOS, Windows, Mobile),
 * with graceful fallback to SpeechSynthesis when offline.
 */

let activeAudio = null;
let activeUtterance = null;

export function isAudioSupported() {
  if (typeof window === "undefined") return false;
  return (
    typeof window.Audio === "function" ||
    ("speechSynthesis" in window &&
      typeof window.SpeechSynthesisUtterance === "function")
  );
}

export function stopLinerNotes() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = "";
    } catch {
      // ignore
    }
    activeAudio = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  activeUtterance = null;
}

export function playLinerNotes(text, { onStart, onEnd, onError } = {}) {
  if (typeof window === "undefined") return false;
  stopLinerNotes();

  const cleanText = String(text || "").trim();
  if (!cleanText) {
    onError?.(new Error("No text provided for audio playback."));
    return false;
  }

  // Primary: Stream real MP3 audio via /api/tts (works 100% in Brave/Linux/Chrome/Safari)
  if (typeof window.Audio === "function") {
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(audioUrl);
      activeAudio = audio;

      audio.onplay = () => {
        onStart?.();
      };

      audio.onended = () => {
        if (activeAudio === audio) activeAudio = null;
        onEnd?.();
      };

      audio.onerror = () => {
        if (activeAudio === audio) activeAudio = null;
        // Fallback to speech synthesis if network fetch fails
        trySpeechSynthesis(cleanText, { onStart, onEnd, onError });
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser policy blocks autoplay or Audio element, fallback
          trySpeechSynthesis(cleanText, { onStart, onEnd, onError });
        });
      }
      return true;
    } catch {
      return trySpeechSynthesis(cleanText, { onStart, onEnd, onError });
    }
  }

  return trySpeechSynthesis(cleanText, { onStart, onEnd, onError });
}

function trySpeechSynthesis(text, { onStart, onEnd, onError } = {}) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof window.SpeechSynthesisUtterance !== "function"
  ) {
    onError?.(new Error("Audio playback is not supported on this device."));
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    activeUtterance = utterance;
    utterance.lang = "en-US";
    utterance.pitch = 0.95;
    utterance.rate = 0.95;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      onEnd?.();
    };
    utterance.onerror = (event) => {
      if (activeUtterance === utterance) activeUtterance = null;
      if (event?.error === "canceled" || event?.error === "interrupted") {
        onEnd?.();
        return;
      }
      onError?.(new Error(event?.error ? String(event.error) : "Speech synthesis error"));
    };

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    onError?.(err);
    return false;
  }
}
