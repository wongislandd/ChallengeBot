// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');
const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');
const settings = require('./settings.json')

const challenge = new SlashCommandBuilder()
    .setName('challenge')
    .setDescription("Roll a team comp challenge.")

const commands = [
    challenge,
    new SlashCommandBuilder().setName('ping').setDescription("Check my status"),
].map(command => command.toJSON())


const rest = new REST({ version: '9' }).setToken(token)

const challengeMap = settings.challenges
const challengeNames = Object.keys(challengeMap)

rest.put(Routes.applicationGuildCommands(settings.clientId, settings.serverId), { body: commands })
    .then(() => console.log("Successfully registered application commands."))
    .catch(console.error)

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_MEMBERS"],
})

client.on("guildMemberAdd", (member) => {
    nickname(member)
})


client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, member, channel } = interaction

    if (channel.id != settings.challengesChannelId) {
        interaction.reply({ content: 'Use the reroll channel for this command!', ephemeral: true })
        return;
    }

    switch (commandName) {
        case 'challenge':
            let rolledChallenge = rollChallenge()
            interaction.reply(getChallengeEmbededResponse(rolledChallenge))
            break
        case 'ping':
            interaction.reply({ content: "Pong!", ephemeral: true })
            break;
    }
})

function rollChallenge() {
    return challengeNames[Math.floor(Math.random()*challengeNames.length)]
}

function getChallengeEmbededResponse(challengeName) {
    let challengeImageUrl = challengeMap[challengeName]
    const embededImage = new EmbedBuilder()
        .setTitle(challengeName)
        .setImage(challengeImageUrl)
    return {
        embeds: [embededImage.data]
    }
}

/**
 * When the bot turns on
 */
 client.on("ready", () => {
    console.log("Bot is online!")
    client.user.setActivity("Use /challenge to roll a team comp.")
})


/**
 * Log into the bot profile.
 */
client.login(token)