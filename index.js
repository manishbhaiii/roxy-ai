require('dotenv').config();
const { Client, GatewayIntentBits, Events, PermissionsBitField } = require('discord.js');
const gradient = require('gradient-string');
const { getChatResponse } = require('./brain/ai');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const purpleWhite = gradient('purple', 'white');

console.log(purpleWhite('roxy ai is booting..'));

client.once(Events.ClientReady, () => {
    console.log(purpleWhite(`hi i am ${client.user.username}`));
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
