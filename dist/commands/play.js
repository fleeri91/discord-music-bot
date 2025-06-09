"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePlayCommand = handlePlayCommand;
const voicePlayer_1 = require("../utils/voicePlayer");
async function handlePlayCommand(message, args) {
    const url = args[0];
    const textChannel = message.channel;
    if (!url || !/^https?:\/\/.+/.test(url)) {
        await textChannel.send("Please provide a valid YouTube link.");
        return;
    }
    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
        await textChannel.send("You need to be in a voice channel first!");
        return;
    }
    try {
        await (0, voicePlayer_1.joinAndPlay)(voiceChannel, url);
        await textChannel.send(`Playing: ${url}`);
    }
    catch (error) {
        console.error(error);
        await textChannel.send("Failed to play audio.");
    }
}
