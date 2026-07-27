const { execSync } = require('child_process');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

let lastNotifiedSha = null;

async function checkGithubUpdate(client) {
    try {
        if (!process.env.OWNER_ID) return;

        const response = await fetch("https://api.github.com/repos/manishbhaiii/roxy-ai/commits");
        if (!response.ok) return;

        const commits = await response.json();
        if (!commits || commits.length === 0) return;

        const latestRemoteSha = commits[0].sha;

        if (lastNotifiedSha === latestRemoteSha) return;

        let isNew = false;
        try {
            execSync(`git cat-file -e ${latestRemoteSha}^{commit}`, { stdio: 'ignore' });
        } catch (e) {
            isNew = true;
        }

        if (isNew) {
            lastNotifiedSha = latestRemoteSha;

            let newCommits = [];
            for (const c of commits) {
                try {
                    execSync(`git cat-file -e ${c.sha}^{commit}`, { stdio: 'ignore' });
                    break;
                } catch (e) {
                    newCommits.push(c);
                }
            }

            let changelog = "";
            newCommits.forEach((c, i) => {
                const shortMsg = c.commit.message.split('\n')[0];
                changelog += `\`${i + 1}.\` ${shortMsg}\n`;
            });

            const user = await client.users.fetch(process.env.OWNER_ID);
            if (user) {
                const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                
                const embed = new EmbedBuilder()
                    .setTitle('New Update Available')
                    .setColor('#5865F2')
                    .setDescription(`**Changelog:**\n${changelog}\n\n**Join our Discord server to get updated with latest changelog and new features!**\nhttps://discord.com/invite/hZf4j8GzzK\n\n**Also check out this channel for more details:**\nhttps://discord.com/channels/1270616787809206364/1531021551200370718`)
                    .setFooter({ text: 'Roxy AI Update System' })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('update_bot_btn')
                        .setLabel('Click to Update')
                        .setStyle(ButtonStyle.Success)
                );

                await user.send({ embeds: [embed], components: [row] });
                console.log(`[UpdateChecker] Sent update notification to owner for ${newCommits.length} commits.`);
            }
        }
    } catch (e) {
        console.error("[UpdateChecker] Error checking updates:", e);
    }
}

function startUpdateChecker(client) {
    // Check once on boot
    checkGithubUpdate(client);
    
    // Check every 30 minutes
    setInterval(() => {
        checkGithubUpdate(client);
    }, 30 * 60 * 1000);
}

module.exports = { startUpdateChecker };
