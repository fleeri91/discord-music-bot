"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinAndPlay = joinAndPlay;
const voice_1 = require("@discordjs/voice");
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
async function joinAndPlay(voiceChannel, url) {
    const connection = (0, voice_1.joinVoiceChannel)({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
    });
    await (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Ready, 20000);
    const stream = (0, ytdl_core_1.default)(url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25,
    });
    const resource = (0, voice_1.createAudioResource)(stream);
    const player = (0, voice_1.createAudioPlayer)();
    player.on(voice_1.AudioPlayerStatus.Idle, () => {
        connection.destroy();
    });
    player.on("error", (err) => {
        console.error("Playback error:", err);
        connection.destroy();
    });
    connection.subscribe(player);
    player.play(resource);
}
