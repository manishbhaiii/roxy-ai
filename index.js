const oldLog = console.log; console.log = () => {}; require('dotenv').config(); console.log = oldLog;
const { Client, GatewayIntentBits, Events, PermissionsBitField } = require('discord.js');
const gradient = require('gradient-string');
const { getChatResponse } = require('./brain/ai');
const { initCronjobs } = require('./tools/CronjobTool');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
});

client.triggerCronjob = async (job) => {
    try {
        const channel = await client.channels.fetch(job.channelId);
        const user = await client.users.fetch(job.userId);
        
        const fakeMessage = {
            author: user,
            channel: channel,
            client: client,
            guild: channel.guild || null,
            reply: (opts) => channel.send(opts)
        };
        
        const syntheticPrompt = `[SCHEDULED TASK TRIGGERED] Task: "${job.instruction}". Execute this now! IMPORTANT: You MUST mention the user by including <@${job.userId}> in your text response so they get a notification.`;
        const replyText = await getChatResponse(fakeMessage, user.displayName || user.username, syntheticPrompt);
        
        if (replyText) {
            await channel.send(replyText);
        }
    } catch (e) {
        console.error("Failed to trigger cronjob:", e);
    }
};

const purpleWhite = gradient('purple', 'white');

console.log(purpleWhite('roxy ai is booting..'));

client.once(Events.ClientReady, () => {
    console.log(purpleWhite(`hi i am ${client.user.username}`));
    initCronjobs(client);
});

client.on(Events.MessageCreate, async (message) => {
    try {
        if (message.author.bot) return;

        if (message.mentions.everyone) return;

        if (message.mentions.roles.size > 0) return;

        if (message.channel.isTextBased() && !message.channel.isDMBased()) {
            const permissions = message.channel.permissionsFor(message.client.user);
            if (!permissions || !permissions.has(PermissionsBitField.Flags.SendMessages)) {
                return;
            }
        }

        const isMentioned = message.mentions.has(message.client.user);
        
        let isReplyToBot = false;
        if (message.reference && message.reference.messageId) {
            try {
                const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
                if (referencedMessage.author.id === message.client.user.id) {
                    isReplyToBot = true;
                }
            } catch (err) {
            }
        }

        if (!isMentioned && !isReplyToBot) return;

        await message.channel.sendTyping();

        const displayName = message.member ? message.member.displayName : (message.author.displayName || message.author.username);
        
        let content = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
        
        if (message.stickers.size > 0) {
            const stickerNames = message.stickers.map(s => s.name).join(", ");
            content += (content ? " " : "") + `[User sent sticker: ${stickerNames}]`;
        }

        if (!content) {
            content = "Hello";
        }

        const response = await getChatResponse(message, displayName, content);
        
        if (response) {
            await message.reply(response);
        }

    } catch (error) {
        console.error("Message handling error:", error);
    }
});

client.login(process.env.DISCORD_TOKEN);
