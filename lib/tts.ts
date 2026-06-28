let utteranceQueue: SpeechSynthesisUtterance[] = [];
let isSpeaking = false;

export function speakDevice(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  utterance.onend = () => {
    isSpeaking = false;
    utteranceQueue.shift();
    if (utteranceQueue.length > 0) {
      speakNext();
    }
    onEnd?.();
  };

  utterance.onerror = () => {
    isSpeaking = false;
    utteranceQueue.shift();
    onEnd?.();
  };

  utteranceQueue.push(utterance);
  if (!isSpeaking) {
    speakNext();
  }
}

function speakNext() {
  if (utteranceQueue.length === 0) {
    isSpeaking = false;
    return;
  }
  isSpeaking = true;
  window.speechSynthesis.speak(utteranceQueue[0]);
}

export function stopDeviceSpeech() {
  window.speechSynthesis.cancel();
  utteranceQueue = [];
  isSpeaking = false;
}

export function isDeviceSpeaking(): boolean {
  return isSpeaking || utteranceQueue.length > 0;
}
