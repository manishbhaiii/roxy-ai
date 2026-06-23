require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const gradient = require('gradient-string');

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

client.login(process.env.DISCORD_TOKEN);
