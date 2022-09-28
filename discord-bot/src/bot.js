import * as config from './bot-config.js';
import {Client, GatewayIntentBits, REST, Routes, AttachmentBuilder, EmbedBuilder} from 'discord.js';
import {checkForPngSignature, fetchEndpoint} from "./bot-helpers.js";

const client = new Client({intents: [GatewayIntentBits.Guilds]});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if (interaction.commandName === 'delayed-ping') {
        await interaction.deferReply();
        setTimeout(() => {
            interaction.editReply('Pong!');
        }, 10000);
    } else if (interaction.commandName === 'render') {
        try {
            await interaction.deferReply();

            const prompt = interaction.options.getString('prompt');
            const steps = interaction.options.getInteger('steps') || 30;

            // are we currently running a render?
            const {isGenerating} = await fetchEndpoint('/is-busy', {});
            if (isGenerating) {
                await interaction.editReply('Currently generating, please wait.');
                return;
            }

            const stableDiffusionData = await fetchEndpoint('/generate', {prompt, steps});

            // check images for base64 encoded image
            const image = stableDiffusionData.images?.[0];
            if (image && typeof image === 'string') {
                // create buffer from base64 encoded image
                const buffer = Buffer.from(image, 'base64');

                // check if buffer is a png
                if (checkForPngSignature(buffer)) {
                    // use EmbedBuilder to create embed with image
                    const file = new AttachmentBuilder(buffer, {name: 'render.png'});
                    const embed = new EmbedBuilder()
                        .setTitle(`Image for ${prompt} with ${steps} steps`)
                        .setImage('attachment://render.png');

                    // send embed with image
                    await interaction.editReply({embeds: [embed], files: [file]});
                    return;
                }
            }

            await interaction.editReply('Something went wrong');

        } catch (error) {
            console.error(error);
            await interaction.editReply({content: 'There was an error while executing this command!', ephemeral: true});
        }

        // await interaction.reply(`Prompt: ${prompt}, Steps: ${steps}`);
    } else if (interaction.commandName === 'pictionary') {
        await interaction.reply(`Pictionary hasn't been setup yet because Shaun is a lazy git.`);
    }

});

client.login(config.BOT_TOKEN);
