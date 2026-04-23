const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
      const labels = { off: '🚫 Repeat off', track: '🔂 Repeating track', queue: '🔁 Repeating queue' };
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x7C3AED).setDescription(labels[mode])],
        ephemeral: true,
      });
    } else {
      await interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
    }
  },
};
