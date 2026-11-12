/**
 * Offline Zen Audio Synthesizer using Web Audio API.
 * Proporciona sonidos armónicos relajantes (frecuencias 432Hz y 528Hz,
 * arpa pentatónica para burbujas zen, y tonos de resonancia) 100% offline.
 */

class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  private traceOsc: OscillatorNode | null = null;
  private traceGain: GainNode | null = null;
  private isMuted: boolean = false;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.traceGain && this.ctx) {
      this.traceGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Toca una nota armónica pentatónica tipo gota de agua o campana suave
   * ideal para reventar burbujas anti-estrés.
   * Escala pentatónica en afinación áurea (~432Hz / 528Hz):
   * Nota index 0..6
   */
  public playBubbleChime(scaleIndex: number = 0) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Escala pentatónica relajante centrada en 528Hz (Frecuencia de transformación y calma)
    const basePitches = [396, 432, 528, 639, 741, 852, 963];
    const pitch = basePitches[Math.abs(scaleIndex) % basePitches.length];

    // Oscilador senoidal puro (calidez y suavidad)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    // Micro inflexión de tono para sensación orgánica de gota de agua
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.04, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(pitch, now + 0.12);

    // Oscilador armónico secundario para dar brillo celestial
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(pitch * 2, now);

    // Ganancia con decaimiento natural tipo campana tibetana
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    // Filtro pasa-bajos para remover transitorios duros
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    osc.connect(gain);
    subOsc.connect(subGain);
    gain.connect(filter);
    subGain.connect(filter);
    filter.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.9);
    subOsc.stop(now + 0.9);
  }

  /**
   * Toca un acorde ascendente armónico de resolución zen (ej. al completar una sesión o puzzle)
   */
  public playZenCompletionChord() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const chords = [432, 528, 648, 864];
    chords.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.9);
    });
  }

  /**
   * Tono interactivo continuo para el trazador Zen Path.
   * Se modula armónicamente según la velocidad y movimiento del usuario.
   */
  public startTraceHum(initialFreq = 432) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.stopTraceHum();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(initialFreq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    this.traceOsc = osc;
    this.traceGain = gain;
  }

  public updateTraceHumFrequency(freq: number) {
    if (!this.traceOsc || !this.ctx || this.isMuted) return;
    const clampedFreq = Math.max(220, Math.min(880, freq));
    this.traceOsc.frequency.setTargetAtTime(clampedFreq, this.ctx.currentTime, 0.08);
  }

  public stopTraceHum() {
    if (this.traceOsc && this.traceGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.traceGain.gain.setValueAtTime(this.traceGain.gain.value, now);
      this.traceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      const oscToStop = this.traceOsc;
      setTimeout(() => {
        try {
          oscToStop.stop();
          oscToStop.disconnect();
        } catch {
          // ignore already stopped
        }
      }, 350);
      this.traceOsc = null;
      this.traceGain = null;
    }
  }
}

export const zenAudio = new ZenAudioEngine();
