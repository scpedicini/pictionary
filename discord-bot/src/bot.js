import * as config from './bot-config.js';
import {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from 'discord.js';
import {allWordsInSentence, checkForPngSignature, fetchEndpoint} from "./bot-helpers.js";
import {Pictionary} from "./pictionary.js";
import {renderIntent} from "./render-intent.js";

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

let isPlayingPictionary = false;
let pictionaryLastPacks = [];

let isRendering = false;

async function generateByStep(interaction, steps, prompt, seed) {
    try {

        // are we currently running a render?
        const {isGenerating} = await fetchEndpoint('/is-busy', {});
        if (isGenerating) {
            return;
        }

        const stableDiffusionData = await fetchEndpoint('/generate', {prompt, steps, seed});

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
                    .setTitle(`Guess the prompt!`)
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
}

// listen for all messages in all channels the bot has access to
client.on('messageCreate', async message => {
    // ignore messages from other bots
    if (message.author.bot) return;

    // ignore messages that don't start with the prefix
    // if (!message.content.startsWith(config.prefix)) return;

    // message.channel.send({embeds: [embed], files: [attachment]});

    // repeat message back to user
    // message.channel.send(message.content);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;


    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');

    } else if (interaction.commandName === 'delayed-ping') {
        await interaction.deferReply();
        setTimeout(() => {
            interaction.editReply('Pong!');
        }, 10000);
    } else if (interaction.commandName === 'render' /*|| interaction.customId === 'retry-render'*/) {
        if (isRendering) {
            await interaction.reply('There is already a render in progress');
            return;
        }

        isRendering = true;
        await renderIntent(interaction);
        isRendering = false;
        // await interaction.reply(`Prompt: ${prompt}, Steps: ${steps}`);
    } else if (interaction.commandName === 'packs') {


    } else if (interaction.commandName === 'pictionary' || interaction.customId === 'new-round') {

        if (isPlayingPictionary) {
            await interaction.reply('A game is already in progress');
            return;
        }

        isPlayingPictionary = true;

        try {

            await interaction.deferReply();

            const pictionary = new Pictionary();

            const {word, artist, medium, modifier} = pictionary.getRandomWord();
            let prompt = `${word}, ${artist}, ${medium}`;

            if (modifier) {
                prompt = `${word}, ${modifier}, ${artist}, ${medium}`;
            }

            const seed = Math.floor(Number.MAX_SAFE_INTEGER * Math.random())

            // build a collector to listen if the user writes the word 'dolphin'
            const filter = m => allWordsInSentence(m.content, word);
            const collector = interaction.channel.createMessageCollector({filter, time: 60000});
            let correctAuthor = undefined;

            const runner = (() => {
                let generatingImages = true;

                const toggleGenerator = (status) => generatingImages = status;
                const isGenerating = () => generatingImages;

                return {
                    toggleGenerator,
                    isGenerating
                };
            })();

            // listen for the first message that matches the filter
            collector.on('collect', async m => {
                // reject if this is the bot
                if (m.author.bot) return;
                // send a new message to the channel that they guessed correctly
                correctAuthor = m.author;
                await interaction.channel.send(`Well done ${m.author}! You guessed the word!`);
                runner.toggleGenerator(false);
                collector.stop();
            });


            const stepArray = [1, 2, 4, 6, 8, 10, 15, 20];
            let stepIndex = 0;

            while (runner.isGenerating() && stepIndex < stepArray.length) {
                const steps = stepArray[stepIndex];
                console.log(`Generating ${prompt} with ${steps} steps`);
                await generateByStep(interaction, steps, prompt, seed);

                // wait a few seconds
                if (stepIndex < stepArray.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
                stepIndex++;
            }

            collector.stop();
            if (correctAuthor) {
                // add a point to the user
            } else {
                await interaction.channel.send(`Nobody guessed the word! It was a ${word}!`);
            }

            // 1 second delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new-round')
                        .setLabel('New round!')
                        .setStyle(ButtonStyle.Primary),
                );


            await interaction.channel.send({components: [row]});
        } catch (error) {
            isPlayingPictionary = false;
            console.error(error);
            await interaction.editReply({content: 'There was an error while executing this command!', ephemeral: true});
        } finally {
            isPlayingPictionary = false;
        }

    }

});

client.login(config.BOT_TOKEN);
