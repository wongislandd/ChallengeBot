// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');
const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');
const settings = require('./settings.json')

const exclusionKey = 'exclusion'
const challengeMap = settings.challenges
const challengeNames = Object.keys(challengeMap)
const challengeChoices = challengeNames.map(challengeName => ({ name: challengeName, value : challengeName}))
const codeLink = "https://github.com/wongislandd/ChallengeBot/blob/main/challengebot.js"

const challengeCmd = new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Roll a team comp challenge.')
    .addStringOption(option =>
        option.setName(exclusionKey)
            .setDescription('Exclude a comp from the choice pool.')
            .setRequired(false)
            .addChoices(...challengeChoices) 
    )

const commands = [
    challengeCmd,
    new SlashCommandBuilder().setName('ping').setDescription("Check my status"),
    new SlashCommandBuilder().setName('code').setDescription("Link my code"),
].map(command => command.toJSON())


const rest = new REST({ version: '9' }).setToken(token)


rest.put(Routes.applicationCommands(settings.clientId), { body: commands })
    .then(() => console.log("Successfully registered application commands."))
    .catch(console.error)

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_MEMBERS"],
})


client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, member, channel } = interaction

    switch (commandName) {
        case 'challenge':
            let excludedChallenge = interaction.options.getString(exclusionKey)
            let rolledChallenge = excludedChallenge ? rollChallengeWithExclusion() : rollChallenge()
            interaction.reply(getChallengeEmbededResponse(rolledChallenge, excludedChallenge))
            break
        case 'code':
            interaction.reply({ content: getCodeLink(), ephemeral: true })
            break
        case 'ping':
            interaction.reply({ content: "Pong!", ephemeral: true })
            break;
    }
})

function rollChallengeWithExclusion(excludedChallenge) {
    const filteredChallengeNames = challengeNames.filter(challenge => challenge != excludedChallenge)
    return rollRandom(filteredChallengeNames)
}

function rollChallenge() {
    return rollRandom(challengeNames)
}

function rollRandom(arr) {
    return arr[Math.floor(Math.random()*arr.length)]
}

function getChallengeEmbededResponse(challengeName, excludedChallenge) {
    let challengeImageUrl = challengeMap[challengeName]
    const embeded = new EmbedBuilder()
        .setTitle(challengeName)
        .setImage(challengeImageUrl)
    if (excludedChallenge != null) {
        embeded.setDescription("Excluded " + excludedChallenge + " from the selection.")
    }
    return {
        embeds: [embeded.data]
    }
}

function getCodeLink() {
    return "View my code here: " + codeLink
}

/**
 * When the bot turns on
 */
 client.on("ready", () => {
    console.log("Bot is online!")
    client.user.setActivity("Roll a /challenge!")
})


/**
 * Log into the bot profile.
 */
client.login(token)