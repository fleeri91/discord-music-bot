const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('repeat')
    .setDescription('Set repeat mode')
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Repeat mode')
        .setRequired(true)
        .addChoices(
          { name: '🚫 Off', value: 'off' },
          { name: '🔂 Track', value: 'track' },
          { name: '🔁 Queue', value: 'queue' },
        )
    ),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;
    const mode = interaction.options.getString('mode');

    if (player.setRepeat(interaction.guildId, mode)) {
      const labels = { off: '🚫 Repeat off', track: '🔂 Repeating current track', queue: '🔁 Repeating entire queue' };
      await interaction.reply(labels[mode]);
    } else {
      await interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
    }
  },
};
