/**
 * Offline Solfeggio & Ambient Soundscape Generator using Web Audio API.
 * Requires 0 external audio files/assets and works 100% offline.
 */

export type AmbientSoundscapeType = '528hz' | 'binaural_alpha' | 'deep_zen';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentType: AmbientSoundscapeType = '528hz';
  private masterGain: GainNode | null = null;
  private nodes: AudioNode[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public start(type: AmbientSoundscapeType = '528hz', volume = 0.08) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.currentType = type;
    this.isPlaying = true;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Master gain with smooth attack
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + 1.2);
    master.connect(ctx.destination);
    this.masterGain = master;

    if (type === '528hz') {
      // 528 Hz - Frecuencia de Transformación y Claridad Mental
      // Oscilador primario de 528 Hz (Onda sinusoidal pura y cálida)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now);

      // Armónico sutil en octava inferior (264 Hz) para calidez y profundidad
      const oscSub = ctx.createOscillator();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(264, now);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.35, now);
      oscSub.connect(subGain);
      subGain.connect(master);

      // Filtro de paso bajo para eliminar cualquier aspereza
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      osc1.connect(filter);
      filter.connect(master);

      // LFO para pulsación orgánica y meditativa (0.1 Hz)
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.015, now);
      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);

      osc1.start(now);
      oscSub.start(now);
      lfo.start(now);

      this.nodes.push(osc1, oscSub, subGain, filter, lfo, lfoGain);
    } else if (type === 'binaural_alpha') {
      // Ondas Alfa (10 Hz de diferencia): Portadora 216 Hz y 226 Hz
      // Induce enfoque tranquilo y estado de flujo
      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(216, now);

      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(226, now);

      // Canales estéreo si el navegador soporta StereoPannerNode
      if (typeof ctx.createStereoPanner === 'function') {
        const panL = ctx.createStereoPanner();
        panL.pan.setValueAtTime(-0.8, now);
        oscL.connect(panL);
        panL.connect(master);

        const panR = ctx.createStereoPanner();
        panR.pan.setValueAtTime(0.8, now);
        oscR.connect(panR);
        panR.connect(master);
        this.nodes.push(panL, panR);
      } else {
        oscL.connect(master);
        oscR.connect(master);
      }

      oscL.start(now);
      oscR.start(now);
      this.nodes.push(oscL, oscR);
    } else if (type === 'deep_zen') {
      // 432 Hz - Calma profunda y regulación del estrés
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(432, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      osc.connect(filter);
      filter.connect(master);
      osc.start(now);
      this.nodes.push(osc, filter);
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.1);
    }
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      } catch {
        // Fallback
      }
    }

    setTimeout(() => {
      this.nodes.forEach(node => {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        } catch {
          // Ignore
        }
      });
      this.nodes = [];
      this.masterGain = null;
    }, 550);
  }

  public toggle(type: AmbientSoundscapeType = '528hz') {
    if (this.isPlaying) {
      if (this.currentType === type) {
        this.stop();
        return false;
      } else {
        this.start(type);
        return true;
      }
    } else {
      this.start(type);
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentType(): AmbientSoundscapeType {
    return this.currentType;
  }
}

export const ambientSound = new AmbientSoundEngine();
