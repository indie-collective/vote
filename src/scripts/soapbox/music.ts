// Soundtrack for the 3D soapbox race, synthesised with the Web Audio API: an original chiptune
// loop (C–G–Am–F at 150 BPM) that builds as the race nears the finish, wooden-wheel rumble,
// a fanfare and crowd cheer at the finish, and drum rolls with stings for the podium.
// Nothing is downloaded and there is no recorded music to license.

const BPM = 150;
const SIXTEENTH = 60 / BPM / 4;
const LOOKAHEAD = 0.15;

// One bar per chord: [bass root, chord tones] as MIDI note numbers.
const PROGRESSION: [number, number[]][] = [
  [36, [60, 64, 67]], // C
  [43, [59, 62, 67]], // G
  [45, [60, 64, 69]], // Am
  [41, [60, 65, 69]], // F
];
// Arpeggio: index into [...chord tones, root an octave up], per sixteenth.
const ARPEGGIO = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 3, 2, 1, 2];
// A short hook over the loop once the race heats up (MIDI note or null for a rest), per sixteenth over 2 bars.
const HOOK = [
  79, null, 76, null, 79, null, 81, 79, null, null, 76, null, 74, null, 76, null,
  74, null, 71, null, 74, null, 76, 74, null, null, 71, null, 67, null, null, null,
];

const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12);

export class Soundtrack {
  private ctx?: AudioContext;
  private master?: GainNode;
  private noise?: AudioBuffer;
  private rumble?: { source: AudioBufferSourceNode; gain: GainNode };
  private timer?: ReturnType<typeof setInterval>;
  private step = 0;
  private nextNoteAt = 0;
  private intensity = 0;
  muted = false;

  /** Creates the audio graph; must be called from a user gesture (key press or click). */
  async start() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.master.connect(compressor);
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    await this.ctx.resume();
  }

  get running() {
    return this.ctx?.state === "running";
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  /** 0 = calm, 1 = final straight: adds hats, the hook and a brighter lead. */
  setIntensity(value: number) {
    this.intensity = Math.max(0, Math.min(1, value));
  }

  /** How fast the carts roll (0–1), for the wheel rumble. */
  setSpeed(value: number) {
    if (!this.ctx || !this.rumble) return;
    this.rumble.gain.gain.setTargetAtTime(0.02 + value * 0.08, this.ctx.currentTime, 0.1);
  }

  startLoop() {
    if (!this.ctx || this.timer) return;
    this.step = 0;
    this.nextNoteAt = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 25);
    this.startRumble();
  }

  stopLoop() {
    clearInterval(this.timer);
    this.timer = undefined;
    if (this.ctx && this.rumble) {
      this.rumble.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
      this.rumble.source.stop(this.ctx.currentTime + 2);
      this.rumble = undefined;
    }
  }

  /** Finish line: brass fanfare, cymbal and a crowd cheer. */
  finish() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.05;
    [72, 76, 79].forEach((note, i) => this.brass(note, t + i * 0.13, 0.12));
    for (const note of [72, 76, 79, 84]) this.brass(note, t + 0.4, 1.4, note === 84 ? 0.16 : 0.09);
    this.cymbal(t + 0.4, 2.2);
    this.kick(t + 0.4);
    this.cheer(t + 0.3, 4);
  }

  /** Drum roll building up to a podium reveal; returns when (in ms from now) the sting lands. */
  drumroll(seconds = 1.6): number {
    if (!this.ctx) return seconds * 1000;
    const t = this.ctx.currentTime + 0.05;
    for (let time = 0; time < seconds; ) {
      const progress = time / seconds;
      this.snare(t + time, 0.15 + progress * 0.35);
      time += 1 / (10 + progress * 16);
    }
    return (seconds + 0.05) * 1000;
  }

  /** Reveal sting for a podium step: bigger for 1st place. */
  sting(rank: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.02;
    this.kick(t);
    this.cymbal(t, rank === 1 ? 2.5 : 1.4);
    const chord = rank === 1 ? [60, 64, 67, 72, 76] : rank === 2 ? [59, 62, 67, 71] : [57, 60, 64, 69];
    for (const note of chord) this.brass(note, t, rank === 1 ? 2 : 0.9, rank === 1 ? 0.1 : 0.08);
    if (rank === 1) {
      [79, 84, 88].forEach((note, i) => this.brass(note, t + 0.5 + i * 0.15, 0.6, 0.1));
      this.cheer(t + 0.2, 5);
    } else {
      this.cheer(t + 0.1, 2);
    }
  }

  // --- Sequencer -------------------------------------------------------------------------

  private schedule() {
    if (!this.ctx) return;
    while (this.nextNoteAt < this.ctx.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextNoteAt);
      this.nextNoteAt += SIXTEENTH;
      this.step++;
    }
  }

  private playStep(step: number, t: number) {
    const inBar = step % 16;
    const [root, chord] = PROGRESSION[Math.floor(step / 16) % PROGRESSION.length];
    const hot = this.intensity > 0.6;

    // Drums: four-on-the-floor kick once things heat up, backbeat snare, hats.
    if (inBar % 8 === 0 || (hot && inBar % 4 === 0)) this.kick(t);
    if (inBar % 8 === 4) this.snare(t, 0.35);
    if (inBar % 2 === 0 || (this.intensity > 0.3 && inBar % 2 === 1)) this.hat(t, inBar % 4 === 2 ? 0.09 : 0.05);

    // Bass: root and octave on eighths.
    if (inBar % 2 === 0) this.tone(midiToHz(root + (inBar % 4 === 2 ? 12 : 0)), t, SIXTEENTH * 1.8, "square", 0.08, 900);

    // Lead arpeggio, an octave higher in the final straight.
    const tones = [...chord, chord[0] + 12];
    const note = tones[ARPEGGIO[inBar]] + (hot ? 12 : 0);
    this.tone(midiToHz(note), t, SIXTEENTH * 0.9, "triangle", 0.07 + this.intensity * 0.03);

    // Hook on top once the race is under way.
    const hook = HOOK[step % HOOK.length];
    if (this.intensity > 0.15 && hook !== null) this.tone(midiToHz(hook), t, SIXTEENTH * 1.6, "square", 0.045, 3000);
  }

  // --- Instruments -----------------------------------------------------------------------

  private tone(freq: number, t: number, duration: number, type: OscillatorType, volume: number, cutoff?: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    let node: AudioNode = osc;
    if (cutoff) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cutoff;
      osc.connect(filter);
      node = filter;
    }
    node.connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private brass(note: number, t: number, duration: number, volume = 0.1) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = midiToHz(note);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(2600, t + 0.08);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.04);
    gain.gain.setValueAtTime(volume, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(filter).connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private kick(t: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  private noiseBurst(t: number, duration: number, volume: number, type: BiquadFilterType, freq: number, q = 1) {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise!;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter).connect(gain).connect(this.master!);
    source.start(t, Math.random() * 0.5);
    source.stop(t + duration + 0.05);
    return gain;
  }

  private snare(t: number, volume: number) {
    this.noiseBurst(t, 0.12, volume, "bandpass", 1800, 0.8);
    this.tone(190, t, 0.08, "triangle", volume * 0.4);
  }

  private hat(t: number, volume: number) {
    this.noiseBurst(t, 0.04, volume, "highpass", 7000);
  }

  private cymbal(t: number, duration: number) {
    this.noiseBurst(t, duration, 0.18, "highpass", 5000);
  }

  private cheer(t: number, duration: number) {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise!;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1100;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.5);
    gain.gain.setTargetAtTime(0, t + duration * 0.5, duration * 0.25);
    source.connect(filter).connect(gain).connect(this.master!);
    source.start(t);
    source.stop(t + duration + 1);
  }

  private startRumble() {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise!;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(this.master!);
    source.start();
    this.rumble = { source, gain };
  }
}
