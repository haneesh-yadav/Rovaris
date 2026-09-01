// Web Audio API Synthesizer for Morse Code Transmission with Distorted Martian Static

class MorseAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.timeoutIds = [];
    this.noiseNode = null;
    this.noiseGain = null;

    // Sequence playback state for pause/resume
    this.currentMorseString = '';
    this.sequenceEvents = [];
    this.currentEventIndex = 0;
    this.onProgressCallback = null;
    this.onEndedCallback = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  createNoiseBuffer() {
    if (!this.audioCtx) return null;
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08; // subtle radio static
    }
    return buffer;
  }

  playBeep(startTime, duration, freq = 650) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Smooth envelope attack and release to prevent audio clicking
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.008);
    gain.gain.setValueAtTime(0.3, startTime + duration - 0.008);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  startNoise() {
    if (this.noiseNode) return;
    const noiseBuffer = this.createNoiseBuffer();
    if (noiseBuffer && this.audioCtx) {
      const noiseSource = this.audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 3;

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);

      noiseSource.start();
      this.noiseNode = noiseSource;
      this.noiseGain = noiseGain;
    }
  }

  stopNoise() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }
  }

  buildSequence(morseString) {
    const dotDuration = 0.12; // 120ms standard slow dot
    const dashDuration = dotDuration * 3; // 360ms dash
    const intraCharPause = dotDuration; // space between symbols of same char
    const letterPause = dotDuration * 3; // space between letters
    const wordPause = dotDuration * 7; // space between words

    const events = [];
    const words = morseString.split(' / ');

    words.forEach((word, wIdx) => {
      const letters = word.split(' ');

      letters.forEach((letter, lIdx) => {
        const symbols = letter.split('');

        symbols.forEach((symbol) => {
          const duration = symbol === '-' ? dashDuration : dotDuration;
          events.push({
            type: 'beep',
            symbol,
            duration,
            pauseAfter: intraCharPause,
            wordIndex: wIdx,
            letterIndex: lIdx
          });
        });

        if (events.length > 0) {
          events[events.length - 1].pauseAfter = letterPause;
        }
      });

      if (events.length > 0) {
        events[events.length - 1].pauseAfter = wordPause;
      }
    });

    return events;
  }

  playFromIndex(startIndex) {
    this.initContext();
    this.startNoise();
    this.isPlaying = true;
    this.isPaused = false;
    this.currentEventIndex = startIndex;

    let delay = 300; // ms

    for (let i = startIndex; i < this.sequenceEvents.length; i++) {
      const event = this.sequenceEvents[i];
      const eventIndex = i;

      const timeoutId = setTimeout(() => {
        if (!this.isPlaying || this.isPaused) return;

        this.currentEventIndex = eventIndex;
        if (this.audioCtx) {
          this.playBeep(this.audioCtx.currentTime, event.duration, 650);
        }

        if (this.onProgressCallback) {
          this.onProgressCallback({
            wordIndex: event.wordIndex,
            letterIndex: event.letterIndex,
            symbol: event.symbol
          });
        }
      }, delay);

      this.timeoutIds.push(timeoutId);
      delay += (event.duration + event.pauseAfter) * 1000;
    }

    // Schedule final end
    const endTimeout = setTimeout(() => {
      if (this.isPlaying && !this.isPaused) {
        this.stop();
        if (this.onEndedCallback) this.onEndedCallback();
      }
    }, delay);
    this.timeoutIds.push(endTimeout);
  }

  playMorse(morseString, onProgress, onEnded) {
    this.stop();
    this.currentMorseString = morseString;
    this.sequenceEvents = this.buildSequence(morseString);
    this.currentEventIndex = 0;
    this.onProgressCallback = onProgress;
    this.onEndedCallback = onEnded;

    this.playFromIndex(0);
  }

  pauseMorse() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    this.isPlaying = false;
    this.timeoutIds.forEach(clearTimeout);
    this.timeoutIds = [];
    this.stopNoise();
  }

  resumeMorse(onProgress, onEnded) {
    if (!this.isPaused) return;
    if (onProgress) this.onProgressCallback = onProgress;
    if (onEnded) this.onEndedCallback = onEnded;

    const resumeIdx = Math.min(this.sequenceEvents.length - 1, this.currentEventIndex);
    this.playFromIndex(resumeIdx);
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.timeoutIds.forEach(clearTimeout);
    this.timeoutIds = [];
    this.stopNoise();
    this.currentEventIndex = 0;
  }
}

export const audioEngine = new MorseAudioEngine();
