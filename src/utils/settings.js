const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '..', '..', 'settings.json');

const DEFAULT_SETTINGS = {
  // Auto-leave settings
  leaveOnEmpty: true,
  leaveOnEmptyDelay: 30,           // seconds before leaving empty channel
  leaveOnFinish: true,
  leaveOnFinishDelay: 120,          // seconds before leaving after queue ends
  leaveOnStop: false,
  leaveOnStopDelay: 30,

  // Playback defaults
  defaultVolume: 80,                // 0-100
  maxVolume: 150,                   // max allowed volume
  maxQueueSize: 200,                // max songs in queue
  maxHistorySize: 50,               // remembered songs

  // Behavior
  showNowPlaying: true,
  enableAutoplay: false,
  defaultRepeatMode: 'off',         // off | track | queue
  allowDuplicates: true,
  restrictToVoiceChannel: true,     // DJ must be in voice channel

  // DJ / Permissions
  djRoleName: 'DJ',
  djOnly: false,                    // only DJ role can use commands
  allowedTextChannels: [],          // empty = all channels

  // Dashboard
  dashboardEnabled: true,
};

class SettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.guildSettings = {};         // per-guild overrides
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(SETTINGS_PATH)) {
        const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
        this.settings = { ...DEFAULT_SETTINGS, ...raw.global };
        this.guildSettings = raw.guilds || {};
      }
    } catch (e) {
      console.error('[Settings] Failed to load:', e.message);
    }
  }

  save() {
    try {
      const data = {
        global: this.settings,
        guilds: this.guildSettings,
      };
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('[Settings] Failed to save:', e.message);
    }
  }

  // Get a setting (guild override > global)
  get(key, guildId = null) {
    if (guildId && this.guildSettings[guildId]?.[key] !== undefined) {
      return this.guildSettings[guildId][key];
    }
    return this.settings[key];
  }

  // Get all settings merged for a guild
  getAll(guildId = null) {
    if (guildId && this.guildSettings[guildId]) {
      return { ...this.settings, ...this.guildSettings[guildId] };
    }
    return { ...this.settings };
  }

  // Set global setting
  set(key, value) {
    if (key in DEFAULT_SETTINGS) {
      this.settings[key] = value;
      this.save();
      return true;
    }
    return false;
  }

  // Set guild-specific override
  setGuild(guildId, key, value) {
    if (key in DEFAULT_SETTINGS) {
      if (!this.guildSettings[guildId]) this.guildSettings[guildId] = {};
      this.guildSettings[guildId][key] = value;
      this.save();
      return true;
    }
    return false;
  }

  // Reset guild to global defaults
  resetGuild(guildId) {
    delete this.guildSettings[guildId];
    this.save();
  }

  // Reset everything
  resetAll() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.guildSettings = {};
    this.save();
  }

  getDefaults() {
    return { ...DEFAULT_SETTINGS };
  }
}

module.exports = new SettingsManager();
