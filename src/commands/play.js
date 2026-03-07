const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
  isYouTubeUrl,
  getYouTubeType,
  resolveYouTubeVideo,
  resolveYouTubePlaylist,
  searchYouTube,
} = require("../utils/youtube");
const {
  isSpotifyUrl,
  getSpotifyType,
  resolveSpotifyTrack,
  resolveSpotifyPlaylist,
} = require("../utils/spotify");
const settings = require("../utils/settings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription(
      "Play a song or playlist from YouTube/Spotify, or search by name",
    )
    .addStringOption((opt) =>
      opt
        .setName("query")
        .setDescription("YouTube/Spotify URL or search query")
        .setRequired(true),
    ),

  async execute(interaction) {
    let query = interaction.options.getString("query");
    const member = interaction.member;
    const guildId = interaction.guildId;

    // Check if user is in a voice channel
    if (!member.voice.channel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel!",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const player = interaction.client.musicPlayer;
    let queue = player.getQueue(guildId);

    // Create queue if it doesn't exist
    if (!queue) {
      queue = await player.createQueue(
        guildId,
        member.voice.channel,
        interaction.channel,
      );
    }

    try {
      let songs = [];

      // ── Spotify URL ──
      if (isSpotifyUrl(query)) {
        const type = getSpotifyType(query);

        if (type === "track") {
          songs = await resolveSpotifyTrack(query);
        } else if (type === "playlist" || type === "album") {
          const playlist = await resolveYouTubePlaylist(query);
          songs = playlist.tracks;

          if (songs.length > 0) {
            // Tag all songs with requester
            songs.forEach((s) => (s.requestedBy = member.user.id));

            // Check queue size limit
            const maxQueue = settings.get("maxQueueSize", guildId);
            const available = maxQueue - queue.songs.length;
            if (songs.length > available) songs = songs.slice(0, available);

            queue.songs.push(...songs);

            const embed = new EmbedBuilder()
              .setColor(0x1db954)
              .setTitle("🎵 Spotify Playlist Added")
              .setDescription(
                `**${playlist.name}**\nAdded **${songs.length}** tracks to the queue`,
              )
              .setThumbnail(playlist.thumbnail)
              .setFooter({ text: `Requested by ${member.user.username}` });

            await interaction.editReply({ embeds: [embed] });

            if (!queue.playing) player.play(queue);
            return;
          }
        }

        // ── YouTube URL ──
      } else if (isYouTubeUrl(query)) {
        let type = getYouTubeType(query);

        // If URL has both a video ID and a playlist, treat as single video
        // (e.g. youtube.com/watch?v=xxx&list=yyy)
        const url = new URL(query);
        if (url.searchParams.has("v") && url.searchParams.has("list")) {
          // Strip the playlist param — user linked a specific video
          url.searchParams.delete("list");
          url.searchParams.delete("index");
          query = url.toString();
          type = "video";
        }

        if (type === "video") {
          const song = await resolveYouTubeVideo(query);
          songs = [song];
        } else if (type === "playlist") {
          const playlist = await resolveYouTubePlaylist(query);
          songs = playlist.tracks;

          if (songs.length > 0) {
            songs.forEach((s) => (s.requestedBy = member.user.id));
            const maxQueue = settings.get("maxQueueSize", guildId);
            const available = maxQueue - queue.songs.length;
            if (songs.length > available) songs = songs.slice(0, available);

            queue.songs.push(...songs);

            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("🎵 YouTube Playlist Added")
              .setDescription(
                `**${playlist.name}**\nAdded **${songs.length}** tracks to the queue`,
              )
              .setThumbnail(playlist.thumbnail)
              .setFooter({ text: `Requested by ${member.user.username}` });

            await interaction.editReply({ embeds: [embed] });

            if (!queue.playing) player.play(queue);
            return;
          }
        }

        // ── Search Query ──
      } else {
        const results = await searchYouTube(query, 1);
        if (results.length) {
          songs = [results[0]];
        }
      }

      // Handle single song add
      if (songs.length === 0) {
        return interaction.editReply("❌ No results found for your query.");
      }

      const song = songs[0];
      song.requestedBy = member.user.id;

      // Check queue size
      const maxQueue = settings.get("maxQueueSize", guildId);
      if (queue.songs.length >= maxQueue) {
        return interaction.editReply(
          `❌ Queue is full (max ${maxQueue} songs).`,
        );
      }

      queue.songs.push(song);

      const position = queue.songs.length - 1;
      const sourceColor = song.source === "spotify" ? 0x1db954 : 0xff0000;
      const sourceIcon = song.source === "spotify" ? "🟢" : "🔴";

      const embed = new EmbedBuilder()
        .setColor(sourceColor)
        .setTitle(`${sourceIcon} Added to Queue`)
        .setDescription(
          `**[${song.title}](${song.url})**${song.artist ? `\nby ${song.artist}` : ""}`,
        )
        .setThumbnail(song.thumbnail)
        .addFields(
          { name: "Duration", value: song.duration || "Unknown", inline: true },
          {
            name: "Position",
            value: position === 0 ? "Now Playing" : `#${position}`,
            inline: true,
          },
        )
        .setFooter({ text: `Requested by ${member.user.username}` });

      await interaction.editReply({ embeds: [embed] });

      if (!queue.playing) player.play(queue);
    } catch (err) {
      console.error("[Play Command]", err);
      await interaction.editReply(`❌ Error: ${err.message}`).catch(() => {});
    }
  },
};
