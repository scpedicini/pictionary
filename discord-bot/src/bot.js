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
     EmbedBuilder, SelectMenuBuilder
} from 'discord.js';
import {allWordsInSentence, checkForPngSignature, fetchEndpoint} from "./bot-helpers.js";
import {Pictionary} from "./pictionary.js";
import {renderIntent} from "./render-intent.js";
import {pictionaryIntent} from "./pictionary-intent.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // adds server functionality
        GatewayIntentBits.GuildMessages, // adds message functionality
        GatewayIntentBits.MessageContent // adds message content functionality (this is a privileged intent)
    ]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

let isPlayingPictionary = false;
let pictionaryLastPackName = undefined;
const ALL_PACK_NAME = "All";

let isRendering = false;

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
    if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isSelectMenu()) return;


    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');

        // get interaction channel id
        const channelId = interaction.channelId;

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
    } else if (interaction.commandName === 'reset') {
        isPlayingPictionary = false;
        await interaction.reply('Resetting pictionary', {ephemeral: true});
    } else if (interaction.commandName === 'pictionary') {
        const pictionary = new Pictionary();
        const packs = [...pictionary.wordGenerator.wordPacks, { name: ALL_PACK_NAME, description: 'All packs' }];

        // build a menu for all packs
        const menu = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('new-round')
                    .setPlaceholder('Select a pack')
                    .addOptions(packs.map(pack => {
                        return {
                            label: pack.name,
                            value: pack.name,
                            description: pack.description,
                            default: false
                        };
                    })));

        // send the menu
        await interaction.reply({content: 'Select a pack', components: [menu], ephemeral: true});
    } else if (interaction.customId === 'new-round') {

        if (isPlayingPictionary) {
            await interaction.reply('A game is already in progress');
            return;
        }

        isPlayingPictionary = true;

        if(interaction.values && interaction.values.length > 0) {
            pictionaryLastPackName = interaction.values[0];
        }

        console.log(`Pictionary with pack ${pictionaryLastPackName}`);
        await pictionaryIntent(interaction, pictionaryLastPackName);

        isPlayingPictionary = false;

    }

});

client.login(config.BOT_TOKEN);
