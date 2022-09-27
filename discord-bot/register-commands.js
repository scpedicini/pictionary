import {Client, GatewayIntentBits, REST, Routes, ApplicationCommandOptionType} from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const {BOT_TOKEN, APP_ID, PUBLIC_KEY} = process.env;

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
    },
    {
        name: 'render',
        description: 'Render a prompt',
        options: [
            {
                name: 'prompt',
                description: 'The prompt to render',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'steps',
                description: 'The number of steps to render',
                type: ApplicationCommandOptionType.Integer,
                required: false,
            }
        ]
    }
];

const rest = new REST({version: '10'}).setToken(BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(APP_ID), {body: commands});

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
