"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const play_1 = require("./commands/play");
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
    ],
});
client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith("!"))
        return;
    const [command, ...args] = message.content.trim().split(/\s+/);
    if (command.toLowerCase() === "!play") {
        await (0, play_1.handlePlayCommand)(message, args);
    }
});
client.login(process.env.DISCORD_TOKEN);
