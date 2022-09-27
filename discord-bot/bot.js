import {Client, GatewayIntentBits, REST, Routes} from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const {BOT_TOKEN, APP_ID, PUBLIC_KEY } = process.env;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    try {

        if (interaction.commandName === 'ping') {
            await interaction.reply('Pong!');
        } else if (interaction.commandName === 'render') {
            const prompt = interaction.options.getString('prompt');
            const steps = interaction.options.getInteger('steps');
            await interaction.reply(`Prompt: ${prompt}, Steps: ${steps}`);
        }
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(BOT_TOKEN);
