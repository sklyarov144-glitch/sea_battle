const AUDIO_KEYS = {
  music_menu: 'music_menu',
  music_battle: 'music_battle',
  sfx_click: 'sfx_click',
  sfx_shot: 'sfx_shot',
  sfx_hit: 'sfx_hit',
  sfx_miss: 'sfx_miss',
  sfx_explosion: 'sfx_explosion',
  sfx_reward: 'sfx_reward',
  sfx_rank_up: 'sfx_rank_up',
  sfx_button_hover: 'sfx_button_hover'
};

function hasSound(scene, key) {
  try {
    return Boolean(scene?.cache?.audio?.exists(key));
  } catch {
    return false;
  }
}

function getAudioContext(scene) {
  return scene?.sound?.context ?? scene?.sound?.manager?.context ?? null;
}

export const SoundService = {
  keys: AUDIO_KEYS,
  music: null,
  musicKey: null,
  fallbackMusic: null,
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.45,
  sfxVolume: 0.7,

  init(profile) {
    const settings = profile?.settings ?? {};
    this.musicEnabled = settings.music !== false;
    this.sfxEnabled = settings.sound !== false;
    this.musicVolume = typeof settings.musicVolume === 'number' ? settings.musicVolume : this.musicVolume;
    this.sfxVolume = typeof settings.sfxVolume === 'number' ? settings.sfxVolume : this.sfxVolume;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
  },

  playMusic(scene, key) {
    if (!this.musicEnabled) {
      return;
    }
    if (!hasSound(scene, key)) {
      this.playFallbackMusic(scene, key);
      return;
    }
    if (this.musicKey === key && this.music?.isPlaying) {
      this.music.setVolume(this.musicVolume);
      return;
    }
    this.stopMusic();
    try {
      this.music = scene.sound.add(key, { loop: true, volume: this.musicVolume });
      this.musicKey = key;
      this.music.play();
    } catch (error) {
      console.warn('[SoundService] music skipped:', key, error);
    }
  },

  stopMusic() {
    try {
      this.music?.stop();
      this.music?.destroy();
      this.fallbackMusic?.oscillator?.stop();
      this.fallbackMusic?.gain?.disconnect();
    } catch {
      // Audio shutdown is best-effort because Phaser may already own scene teardown.
    }
    this.music = null;
    this.musicKey = null;
    this.fallbackMusic = null;
  },

  playSfx(scene, key) {
    if (!this.sfxEnabled) {
      return;
    }
    if (!hasSound(scene, key)) {
      this.playFallbackSfx(scene, key);
      return;
    }
    try {
      scene.sound.play(key, { volume: this.sfxVolume });
    } catch (error) {
      console.warn('[SoundService] sfx skipped:', key, error);
    }
  },

  playFallbackMusic(scene, key) {
    if (this.musicKey === key && this.fallbackMusic) {
      this.fallbackMusic.gain.gain.value = this.musicVolume * 0.045;
      return;
    }
    this.stopMusic();
    const context = getAudioContext(scene);
    if (!context) {
      return;
    }
    try {
      context.resume?.();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = key === AUDIO_KEYS.music_battle ? 132 : 98;
      gain.gain.value = this.musicVolume * 0.045;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      this.musicKey = key;
      this.fallbackMusic = { oscillator, gain };
    } catch (error) {
      console.warn('[SoundService] fallback music skipped:', key, error);
    }
  },

  playFallbackSfx(scene, key) {
    const context = getAudioContext(scene);
    if (!context) {
      return;
    }
    try {
      context.resume?.();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      const frequencyMap = {
        [AUDIO_KEYS.sfx_hit]: 170,
        [AUDIO_KEYS.sfx_shot]: 92,
        [AUDIO_KEYS.sfx_miss]: 420,
        [AUDIO_KEYS.sfx_explosion]: 62,
        [AUDIO_KEYS.sfx_reward]: 660,
        [AUDIO_KEYS.sfx_rank_up]: 780,
        [AUDIO_KEYS.sfx_button_hover]: 520,
        [AUDIO_KEYS.sfx_click]: 360
      };
      oscillator.type = key === AUDIO_KEYS.sfx_explosion || key === AUDIO_KEYS.sfx_shot ? 'sawtooth' : 'square';
      oscillator.frequency.setValueAtTime(frequencyMap[key] ?? 300, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, (frequencyMap[key] ?? 300) * 0.55), now + 0.12);
      gain.gain.setValueAtTime(this.sfxVolume * 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
    } catch (error) {
      console.warn('[SoundService] fallback sfx skipped:', key, error);
    }
  },

  setMusicEnabled(value) {
    this.musicEnabled = Boolean(value);
    if (!this.musicEnabled) {
      this.stopMusic();
    }
  },

  setSfxEnabled(value) {
    this.sfxEnabled = Boolean(value);
  },

  setMusicVolume(value) {
    this.musicVolume = Math.max(0, Math.min(1, Number(value)));
    this.music?.setVolume(this.musicVolume);
    if (this.fallbackMusic) {
      this.fallbackMusic.gain.gain.value = this.musicVolume * 0.045;
    }
  },

  setSfxVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(value)));
  }
};
