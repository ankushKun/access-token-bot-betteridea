import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

if (!fs.existsSync('./codes.json')) {
  fs.writeFileSync('./codes.json', '{}');
}

const codes = JSON.parse(fs.readFileSync('./codes.json', 'utf-8'));


import { REST, Routes, Client, Events, GatewayIntentBits, Partials, SlashCommandBuilder } from "discord.js"
import axios from 'axios';

const rest = new REST().setToken(process.env.CLIENT_TOKEN);

const command = new SlashCommandBuilder().setName('access').setDescription('Get an early access code for Learn AO platform');
(async () => {
  try {
    console.log(`Started refreshing application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands('1255224427281383444', '1201431152913821757'),
      { body: [command.toJSON()] },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.Channel]
});

client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

setInterval(() => {
  fs.writeFileSync('./codes.json', JSON.stringify(codes, null, 2));
  // console.log(Object.keys(codes).length, 'Codes saved');
}, 5_000);

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'access') {
    if (codes[interaction.user.id]) {
      await interaction.reply({
        content: `You already created an early access code: \`${codes[interaction.user.id]}\``,
        ephemeral: true
      });
      return
    }

    const baseUrl = process.env.BACKEND_BASE

    const res = await axios.post(baseUrl + '/invitation')

    const code = res.data[0].code;
    await interaction.reply({
      content: `Here is your early access code: \`${code}\`\nMake sure to checkout the platform and offer your feedback, to get the OG role on discord ;)`,
      ephemeral: true
    });
    codes[interaction.user.id] = code;
  }
})


client.login(process.env.CLIENT_TOKEN);

