import {checkForPngSignature, fetchEndpoint} from "./bot-helpers.js";
import {ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} from "discord.js";

async function renderIntent(interaction) {

    try {

        await interaction.deferReply();

        const prompt = interaction.options.getString('prompt');
        const steps = interaction.options.getInteger('steps') || 30;

        console.log(`Running render for prompt: ${prompt} with ${steps} steps`);

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

                // add a button to retry the render and pass the prompt and steps as options
                const button = new ButtonBuilder()
                    .setCustomId('retry-render')
                    .setLabel('Retry render')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder()
                    .addComponents(button);



                // add a collector to listen for button clicks
                const filter = i => i.customId === 'retry-render' && i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({filter, time: 60000});

                collector.once('collect', async rerenderInteraction => {
                    // send a slash command to the channel the button was clicked in
                    // await i.deferUpdate();
                    // await i.channel.send({content: `/render ${prompt}`});
                    //await renderIntent(interaction);
                    // send a follow up
                    // await interaction.followUp({content: 'Clcked retry'});

                    // disable the button
                    button.setDisabled(true);
                    await interaction.editReply({components: [row]});

                    // set options on rerenderInteraction
                    rerenderInteraction.options = interaction.options;
                    await renderIntent(rerenderInteraction);

                });

                // send embed with image
                await interaction.editReply({embeds: [embed], files: [file], components: [row]});
                // await interaction.editReply({embeds: [embed], files: [file] });
                return;
            }
        }

        await interaction.editReply('Something went wrong');

    } catch (error) {
        console.error(error);
        await interaction.editReply({content: 'There was an error while executing this command!', ephemeral: true});
    }

}

export {renderIntent};