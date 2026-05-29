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

export const SoundService = {
  keys: AUDIO_KEYS,
  music: null,
  musicKey: null,
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
    if (!this.musicEnabled || !hasSound(scene, key)) {
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
    } catch {
      // Audio shutdown is best-effort because Phaser may already own scene teardown.
    }
    this.music = null;
    this.musicKey = null;
  },

  playSfx(scene, key) {
    if (!this.sfxEnabled || !hasSound(scene, key)) {
      return;
    }
    try {
      scene.sound.play(key, { volume: this.sfxVolume });
    } catch (error) {
      console.warn('[SoundService] sfx skipped:', key, error);
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
  },

  setSfxVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(value)));
  }
};
