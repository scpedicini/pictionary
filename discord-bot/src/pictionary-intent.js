import {Pictionary} from "./pictionary.js";
import {allWordsInSentence} from "./bot-helpers.js";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from "discord.js";

import {checkForPngSignature, fetchEndpoint} from "./bot-helpers.js";
import {AttachmentBuilder, EmbedBuilder} from "discord.js";

async function generateByStep(interaction, steps, prompt, seed, packName ) {
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
                    .setTitle(`Guess the prompt! (Category ${packName})`)
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



async function pictionaryIntent(interaction, pictionaryLastPackName) {
    try {
        await interaction.deferReply();

/*        if(interaction.isSelectMenu() && interaction.customId === 'new-round') {
            await interaction.update({content: 'New round started!', components: []});
        }*/

        const pictionary = new Pictionary();

        pictionaryLastPackName = pictionaryLastPackName === "All" ? null : pictionaryLastPackName;
        const {word, prompt} = pictionary.getRandomPrompt(pictionaryLastPackName);

        let seed = Math.floor(Number.MAX_SAFE_INTEGER * Math.random())
        const randomizeSeed = Math.random() > 0.4;

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
        collector.once('collect', async m => {
            // reject if this is the bot
            if (m.author.bot) return;
            // send a new message to the channel that they guessed correctly
            correctAuthor = m.author;
            await interaction.channel.send(`Well done ${m.author}! You guessed ${word}!`);
            runner.toggleGenerator(false);
            // collector.stop();
        });


        const stepArray = [2, 4, 6, 8, 10, 15, 20];
        let stepIndex = 0;

        while (runner.isGenerating() && stepIndex < stepArray.length) {
            const steps = stepArray[stepIndex];
            seed = randomizeSeed ? Math.floor(Number.MAX_SAFE_INTEGER * Math.random()) : seed;
            console.log(`Generating ${prompt} with ${steps} steps and seed ${seed}`);
            await generateByStep(interaction, steps, prompt, seed, pictionaryLastPackName);

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
        console.error(error);
        await interaction.editReply({content: 'There was an error while executing this command!', ephemeral: true});
    }
}


export {pictionaryIntent};