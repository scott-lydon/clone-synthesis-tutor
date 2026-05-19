/**
 * Audio via Tone.js. Functional only:
 *   - cha-ching on profitable serve
 *   - mog sting on cheapest-cost serve (a punchier cha-ching with a brass note)
 *   - sad trombone on wrong serve
 *   - thock on piece drop into tray (haptic feedback for the drag)
 *
 * No background music. No decorative jingles. Skinner rule: sound that is not feedback is noise.
 *
 * Tone.js requires the AudioContext to be started by a user gesture, so we lazily start on the
 * first call to any of these. Subsequent calls reuse the running context.
 */
import * as Tone from 'tone';

let started = false;
let cashSynth: Tone.PolySynth | null = null;
let pieceSynth: Tone.MembraneSynth | null = null;
let sadSynth: Tone.MonoSynth | null = null;
let mogSynth: Tone.PolySynth | null = null;

const ensureStarted = async (): Promise<void> => {
  if (started) return;
  // First call MUST be inside a user gesture handler. We just await Tone.start() — Safari will
  // throw NotAllowedError if the call chain didn't originate from a tap; we let it propagate
  // so the caller sees the real reason instead of silent muted audio.
  await Tone.start();
  cashSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.12, sustain: 0.0, release: 0.2 },
  }).toDestination();
  pieceSynth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
  }).toDestination();
  sadSynth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.0, release: 0.4 },
    filter: { Q: 2, type: 'lowpass', rolloff: -24 },
    filterEnvelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3, baseFrequency: 400, octaves: 2 },
  }).toDestination();
  mogSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.15, sustain: 0.05, release: 0.3 },
  }).toDestination();
  mogSynth.volume.value = -8;
  cashSynth.volume.value = -10;
  pieceSynth.volume.value = -16;
  sadSynth.volume.value = -10;
  started = true;
};

export const playPieceDrop = (): void => {
  void ensureStarted().then(() => pieceSynth?.triggerAttackRelease('C3', '8n'));
};

export const playChaCh = (): void => {
  void ensureStarted().then(() => {
    const now = Tone.now();
    cashSynth?.triggerAttackRelease('C5', '16n', now);
    cashSynth?.triggerAttackRelease('E5', '16n', now + 0.08);
    cashSynth?.triggerAttackRelease('G5', '8n', now + 0.16);
  });
};

export const playMogSting = (): void => {
  void ensureStarted().then(() => {
    const now = Tone.now();
    mogSynth?.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now);
    mogSynth?.triggerAttackRelease(['G5', 'B5', 'D6'], '4n', now + 0.18);
  });
};

export const playSadTrombone = (): void => {
  void ensureStarted().then(() => {
    const now = Tone.now();
    sadSynth?.triggerAttackRelease('G3', '4n', now);
    sadSynth?.triggerAttackRelease('F#3', '4n', now + 0.25);
    sadSynth?.triggerAttackRelease('F3', '4n', now + 0.5);
    sadSynth?.triggerAttackRelease('E3', '2n', now + 0.75);
  });
};
