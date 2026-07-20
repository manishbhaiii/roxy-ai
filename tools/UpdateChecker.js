const { execSync } = require('child_process');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

let lastNotifiedSha = null;

async function checkGithubUpdate(client) {
    try {
        if (!process.env.OWNER_ID) return;

        const response = await fetch("https://api.github.com/repos/manishbhaiii/roxy-ai/commits/main");
        if (!response.ok) return;

        const data = await response.json();
        const remoteSha = data.sha;
        const commitMsg = data.commit.message;

        let localSha = "";
        try {
            localSha = execSync('git rev-parse HEAD').toString().trim();
        } catch (e) {
            console.error("[UpdateChecker] Failed to get local git sha");
            return;
        }

        if (remoteSha !== localSha && lastNotifiedSha !== remoteSha) {
            lastNotifiedSha = remoteSha;
            const user = await client.users.fetch(process.env.OWNER_ID);
            if (user) {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('update_bot_btn')
                        .setLabel('click to update')
                        .setStyle(ButtonStyle.Success)
                );

                const dmContent = `new update is avilable\nchnagelog\n${commitMsg}`;
                await user.send({ content: dmContent, components: [row] });
                console.log("[UpdateChecker] Sent update notification to owner.");
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
