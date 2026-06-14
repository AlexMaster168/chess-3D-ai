/**
 * Procedural audio engine for Battle Chess.
 * Generates all sound effects and music using Web Audio API — no external files needed.
 */

export type SoundEffect =
  | 'sword_clash'
  | 'sword_swing'
  | 'magic_blast'
  | 'magic_charge'
  | 'rock_smash'
  | 'death_scream'
  | 'death_fall'
  | 'shield_block'
  | 'spear_thrust'
  | 'arrow_fire'
  | 'impact_light'
  | 'impact_heavy'
  | 'sparkle'
  | 'rumble'
  | 'whoosh'
  | 'check'
  | 'checkmate'
  | 'move'
  | 'castle'
  | 'promote';

interface AudioOptions {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicOsc: OscillatorNode[] = [];
  private musicPlaying = false;
  private options: AudioOptions = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.3,
    muted: false,
  };

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.options.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.options.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.options.musicVolume;
    this.musicGain.connect(this.masterGain);
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) throw new Error('AudioEngine not initialized. Call init() first.');
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMasterVolume(v: number): void {
    this.options.masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.options.masterVolume;
  }

  setSfxVolume(v: number): void {
    this.options.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain) this.sfxGain.gain.value = this.options.sfxVolume;
  }

  setMusicVolume(v: number): void {
    this.options.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain) this.musicGain.gain.value = this.options.musicVolume;
  }

  toggleMute(): boolean {
    this.options.muted = !this.options.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.options.muted ? 0 : this.options.masterVolume;
    }
    return this.options.muted;
  }

  get isMuted(): boolean {
    return this.options.muted;
  }

  // ── Sound effects ──────────────────────────────────────────────

  play(sound: SoundEffect, volume: number = 1): void {
    const ctx = this.ensureCtx();
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    switch (sound) {
      case 'sword_clash':
        this.swordClash(ctx, dest, now, volume);
        break;
      case 'sword_swing':
        this.swordSwing(ctx, dest, now, volume);
        break;
      case 'magic_blast':
        this.magicBlast(ctx, dest, now, volume);
        break;
      case 'magic_charge':
        this.magicCharge(ctx, dest, now, volume);
        break;
      case 'rock_smash':
        this.rockSmash(ctx, dest, now, volume);
        break;
      case 'death_scream':
        this.deathScream(ctx, dest, now, volume);
        break;
      case 'death_fall':
        this.deathFall(ctx, dest, now, volume);
        break;
      case 'shield_block':
        this.shieldBlock(ctx, dest, now, volume);
        break;
      case 'spear_thrust':
        this.spearThrust(ctx, dest, now, volume);
        break;
      case 'arrow_fire':
        this.arrowFire(ctx, dest, now, volume);
        break;
      case 'impact_light':
        this.impactLight(ctx, dest, now, volume);
        break;
      case 'impact_heavy':
        this.impactHeavy(ctx, dest, now, volume);
        break;
      case 'sparkle':
        this.sparkle(ctx, dest, now, volume);
        break;
      case 'rumble':
        this.rumble(ctx, dest, now, volume);
        break;
      case 'whoosh':
        this.whoosh(ctx, dest, now, volume);
        break;
      case 'check':
        this.checkSound(ctx, dest, now, volume);
        break;
      case 'checkmate':
        this.checkmateSound(ctx, dest, now, volume);
        break;
      case 'move':
        this.moveSound(ctx, dest, now, volume);
        break;
      case 'castle':
        this.castleSound(ctx, dest, now, volume);
        break;
      case 'promote':
        this.promoteSound(ctx, dest, now, volume);
        break;
    }
  }

  // ── Procedural sound implementations ───────────────────────────

  private swordClash(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    // Metallic impact: noise burst + resonant ping
    const dur = 0.25;
    const noise = this.noiseBurst(ctx, t, dur, 0.5 * vol);
    const hp = this.highpass(ctx, noise, 2000);
    hp.connect(dest);

    // Resonant metallic ring
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + dur);
    g.gain.setValueAtTime(0.3 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);

    // Second harmonic
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3200, t);
    osc2.frequency.exponentialRampToValueAtTime(1200, t + dur * 0.6);
    g2.gain.setValueAtTime(0.15 * vol, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);
    osc2.connect(g2).connect(dest);
    osc2.start(t);
    osc2.stop(t + dur * 0.6);
  }

  private swordSwing(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.15;
    const noise = this.noiseBurst(ctx, t, dur, 0.2 * vol);
    const bp = this.bandpass(ctx, noise, 1500, 2);
    bp.connect(dest);
  }

  private magicBlast(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.6;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + dur);
    g.gain.setValueAtTime(0.3 * vol, t);
    g.gain.linearRampToValueAtTime(0.4 * vol, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const lp = this.lowpass(ctx, osc, 1200);
    lp.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);

    // Sparkle overlay
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, t);
    osc2.frequency.exponentialRampToValueAtTime(400, t + dur * 0.8);
    g2.gain.setValueAtTime(0.15 * vol, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.8);
    osc2.connect(g2).connect(dest);
    osc2.start(t);
    osc2.stop(t + dur * 0.8);
  }

  private magicCharge(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.4;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(900, t + dur);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.25 * vol, t + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);
  }

  private rockSmash(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.4;
    // Low thump
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + dur);
    g.gain.setValueAtTime(0.5 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);

    // Rock debris noise
    const noise = this.noiseBurst(ctx, t, dur * 0.8, 0.3 * vol);
    const lp = this.lowpass(ctx, noise, 600);
    lp.connect(dest);
  }

  private deathScream(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.5;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.linearRampToValueAtTime(200, t + dur);
    g.gain.setValueAtTime(0.2 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const bp = this.bandpass(ctx, osc, 400, 3);
    bp.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);
  }

  private deathFall(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.35;
    const noise = this.noiseBurst(ctx, t, dur, 0.2 * vol);
    const lp = this.lowpass(ctx, noise, 300);
    lp.connect(dest);
  }

  private shieldBlock(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.2;
    const noise = this.noiseBurst(ctx, t, dur, 0.4 * vol);
    const bp = this.bandpass(ctx, noise, 800, 2);
    bp.connect(dest);

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + dur);
    g.gain.setValueAtTime(0.25 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);
  }

  private spearThrust(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.12;
    const noise = this.noiseBurst(ctx, t, dur, 0.3 * vol);
    const hp = this.highpass(ctx, noise, 3000);
    hp.connect(dest);

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + dur);
    g.gain.setValueAtTime(0.15 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);
  }

  private arrowFire(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.3;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + dur);
    g.gain.setValueAtTime(0.2 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);
  }

  private impactLight(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.1;
    const noise = this.noiseBurst(ctx, t, dur, 0.25 * vol);
    const bp = this.bandpass(ctx, noise, 2000, 1.5);
    bp.connect(dest);
  }

  private impactHeavy(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.3;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + dur);
    g.gain.setValueAtTime(0.5 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);

    const noise = this.noiseBurst(ctx, t, dur * 0.5, 0.3 * vol);
    const lp = this.lowpass(ctx, noise, 400);
    lp.connect(dest);
  }

  private sparkle(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.3;
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.06;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 + i * 500, t + delay);
      g.gain.setValueAtTime(0.12 * vol, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.15);
      osc.connect(g).connect(dest);
      osc.start(t + delay);
      osc.stop(t + delay + 0.15);
    }
  }

  private rumble(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.8;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, t);
    osc.frequency.linearRampToValueAtTime(25, t + dur);
    g.gain.setValueAtTime(0.35 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);

    const noise = this.noiseBurst(ctx, t, dur, 0.15 * vol);
    const lp = this.lowpass(ctx, noise, 200);
    lp.connect(dest);
  }

  private whoosh(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.2;
    const noise = this.noiseBurst(ctx, t, dur, 0.2 * vol);
    const bp = this.bandpass(ctx, noise, 1000, 1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    bp.connect(g).connect(dest);
  }

  private checkSound(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.5;
    for (let i = 0; i < 2; i++) {
      const delay = i * 0.15;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, t + delay);
      g.gain.setValueAtTime(0.15 * vol, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.2);
      const lp = this.lowpass(ctx, osc, 1500);
      lp.connect(g).connect(dest);
      osc.start(t + delay);
      osc.stop(t + delay + 0.2);
    }
  }

  private checkmateSound(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 1.2;
    // Deep dramatic chord
    const freqs = [100, 125.97, 150, 200];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.15 * vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      const lp = this.lowpass(ctx, osc, 800);
      lp.connect(g).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
    }
    // Cymbal-like noise
    const noise = this.noiseBurst(ctx, t, dur, 0.2 * vol);
    const hp = this.highpass(ctx, noise, 3000);
    hp.connect(dest);
  }

  private moveSound(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.08;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + dur);
    g.gain.setValueAtTime(0.1 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);
  }

  private castleSound(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    // Two quick slides for king + rook
    for (let i = 0; i < 2; i++) {
      const delay = i * 0.12;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, t + delay);
      osc.frequency.linearRampToValueAtTime(600, t + delay + 0.1);
      g.gain.setValueAtTime(0.12 * vol, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.15);
      osc.connect(g).connect(dest);
      osc.start(t + delay);
      osc.stop(t + delay + 0.15);
    }
  }

  private promoteSound(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const dur = 0.5;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + dur);
    g.gain.setValueAtTime(0.2 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur);
    this.sparkle(ctx, dest, t + dur * 0.5, vol * 0.5);
  }

  // ── Background music ───────────────────────────────────────────

  startMusic(): void {
    if (this.musicPlaying) return;
    const ctx = this.ensureCtx();
    this.musicPlaying = true;
    this.playMusicLoop(ctx);
  }

  stopMusic(): void {
    this.musicPlaying = false;
    for (const osc of this.musicOsc) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.musicOsc = [];
  }

  private playMusicLoop(ctx: AudioContext): void {
    if (!this.musicPlaying || !this.musicGain) return;

    // Medieval-inspired bass drone + rhythmic pattern
    const t = ctx.currentTime;
    const bpm = 90;
    const beatDur = 60 / bpm;
    const barDur = beatDur * 4;
    const loopBars = 4;
    const totalDur = barDur * loopBars;

    // Drone (fundamental)
    const drone = ctx.createOscillator();
    const droneG = ctx.createGain();
    drone.type = 'sawtooth';
    drone.frequency.value = 65.41; // C2
    droneG.gain.value = 0.06;
    const droneLp = this.lowpass(ctx, drone, 200);
    droneLp.connect(droneG).connect(this.musicGain);
    drone.start(t);
    drone.stop(t + totalDur);
    this.musicOsc.push(drone);

    // Fifth drone
    const drone5 = ctx.createOscillator();
    const drone5G = ctx.createGain();
    drone5.type = 'triangle';
    drone5.frequency.value = 98; // G2
    drone5G.gain.value = 0.04;
    drone5.connect(drone5G).connect(this.musicGain);
    drone5.start(t);
    drone5.stop(t + totalDur);
    this.musicOsc.push(drone5);

    // Rhythmic bass pattern (dotted quarter, eighth, half feel)
    const bassPattern = [0, 0.75, 1.5, 2, 3]; // beats within a bar
    const bassNotes = [65.41, 73.42, 82.41, 73.42]; // C2, D2, E2, D2 (per bar)

    for (let bar = 0; bar < loopBars; bar++) {
      const barStart = t + bar * barDur;
      const bassFreq = bassNotes[bar % bassNotes.length];

      for (const beat of bassPattern) {
        const noteT = barStart + beat * beatDur;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = bassFreq;
        g.gain.setValueAtTime(0.08, noteT);
        g.gain.exponentialRampToValueAtTime(0.001, noteT + beatDur * 0.8);
        osc.connect(g).connect(this.musicGain);
        osc.start(noteT);
        osc.stop(noteT + beatDur * 0.8);
        this.musicOsc.push(osc);
      }
    }

    // High melodic accent (every 2 bars, sparse)
    const melodyNotes = [
      { beat: 0, freq: 261.63, dur: 2 },     // C4
      { beat: 2, freq: 329.63, dur: 1.5 },    // E4
      { beat: 3.5, freq: 392, dur: 0.5 },     // G4
    ];
    for (let bar = 0; bar < loopBars; bar += 2) {
      const barStart = t + bar * barDur;
      for (const note of melodyNotes) {
        const noteT = barStart + note.beat * beatDur;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        g.gain.setValueAtTime(0.04, noteT);
        g.gain.exponentialRampToValueAtTime(0.001, noteT + note.dur * beatDur);
        osc.connect(g).connect(this.musicGain);
        osc.start(noteT);
        osc.stop(noteT + note.dur * beatDur);
        this.musicOsc.push(osc);
      }
    }

    // Schedule next loop
    setTimeout(() => {
      this.musicOsc = this.musicOsc.filter(o => {
        try { return o.context.currentTime < (o as any)._stopTime; } catch { return false; }
      });
      if (this.musicPlaying) this.playMusicLoop(ctx);
    }, totalDur * 1000 - 100); // slight overlap
  }

  // ── Helpers ────────────────────────────────────────────────────

  private noiseBurst(ctx: AudioContext, t: number, dur: number, vol: number): AudioBufferSourceNode {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * dur);
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * vol;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);
    return src;
  }

  private lowpass(ctx: AudioContext, input: AudioNode, freq: number): BiquadFilterNode {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    input.connect(f);
    return f;
  }

  private highpass(ctx: AudioContext, input: AudioNode, freq: number): BiquadFilterNode {
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = freq;
    input.connect(f);
    return f;
  }

  private bandpass(ctx: AudioContext, input: AudioNode, freq: number, q: number): BiquadFilterNode {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    input.connect(f);
    return f;
  }

  dispose(): void {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
  }
}

// Singleton
let _instance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!_instance) _instance = new AudioEngine();
  return _instance;
}
