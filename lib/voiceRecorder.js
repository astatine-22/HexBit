/**
 * Client-side voice recording helper using browser native MediaRecorder.
 * Robust lifecycle: tracks always stop, chunks collect via timeslices, safety timeouts prevent hangs.
 */

export function isVoiceRecordingSupported() {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window.MediaRecorder !== "undefined"
  );
}

let activeRecorder = null;
let activeStream = null;
let chunks = [];
let isAcquiring = false;
let cancelPending = false;

function cleanup() {
  if (activeStream) {
    try {
      activeStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      // ignore
    }
  }
  activeRecorder = null;
  activeStream = null;
  chunks = [];
  isAcquiring = false;
}

export function cancelRecording() {
  cancelPending = true;
  try {
    if (activeRecorder && activeRecorder.state !== "inactive") {
      activeRecorder.stop();
    }
  } catch (e) {
    // ignore
  }
  cleanup();
}

export async function startRecording() {
  if (!isVoiceRecordingSupported()) {
    throw new Error("Microphone recording is not supported in this browser.");
  }

  cancelRecording();
  cancelPending = false;
  isAcquiring = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    isAcquiring = false;

    if (cancelPending) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error("Recording was cancelled.");
    }

    activeStream = stream;
    chunks = [];

    let mimeType = "";
    if (typeof window.MediaRecorder.isTypeSupported === "function") {
      if (window.MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (window.MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (window.MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }
    }

    const options = mimeType ? { mimeType } : undefined;
    const recorder = new window.MediaRecorder(stream, options);
    activeRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    // Slice audio every 200ms so data is always flushed
    recorder.start(200);
    return recorder;
  } catch (error) {
    isAcquiring = false;
    cleanup();
    throw new Error(
      error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError"
        ? "Microphone access denied. Please allow microphone permissions in your browser."
        : error?.message || "Could not access microphone."
    );
  }
}

export function stopRecording() {
  return new Promise((resolve, reject) => {
    if (isAcquiring) {
      cancelPending = true;
      cleanup();
      reject(new Error("Recording was still initializing. Please try again."));
      return;
    }

    const recorder = activeRecorder;
    const stream = activeStream;

    if (!recorder) {
      cleanup();
      reject(new Error("No active recording."));
      return;
    }

    // Safety timeout in case onstop or FileReader never resolves
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Recording timed out while processing."));
    }, 4500);

    recorder.onstop = () => {
      clearTimeout(timeout);
      try {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type });

        if (blob.size === 0) {
          cleanup();
          resolve({ audioBase64: "", mimeType: type });
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result || "";
          const base64 = String(result).split(",")[1] || "";
          cleanup();
          resolve({ audioBase64: base64, mimeType: blob.type || type });
        };
        reader.onerror = () => {
          cleanup();
          reject(new Error("Failed to process recorded audio."));
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    try {
      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        recorder.onstop();
      }
    } catch (error) {
      clearTimeout(timeout);
      cleanup();
      reject(new Error("Failed to stop recording."));
    }
  });
}
