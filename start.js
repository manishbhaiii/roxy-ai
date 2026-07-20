const { spawn, execSync } = require('child_process');
const fs = require('fs');

const REPO_URL = "https://github.com/manishbhaiii/roxy-ai";

function runCommand(command) {
    try {
        console.log(`[StartRunner] Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`[StartRunner] Error executing command: ${command}`);
    }
}

function updateAndInstall() {
    if (!fs.existsSync('.git')) {
        console.log("[StartRunner] First time setup: Cloning repository...");
        runCommand(`git init`);
        runCommand(`git remote add origin ${REPO_URL}`);
        runCommand(`git fetch origin`);
        runCommand(`git reset --hard origin/main`);
    } else {
        console.log("[StartRunner] Checking for updates from GitHub...");
        runCommand(`git fetch --all`);
        runCommand(`git reset --hard origin/main`);
    }
    
    console.log("[StartRunner] Installing npm packages...");
    runCommand(`npm install`);
}

function startBot() {
    console.log("[StartRunner] Starting the bot...");
    
    const botProcess = spawn('node', ['index.js'], { stdio: 'inherit' });

    botProcess.on('close', (code) => {
        console.log(`[StartRunner] Bot process exited with code ${code}`);
        
        if (code === 2) {
            console.log("[StartRunner] Restart code (2) received. Updating and restarting...");
            updateAndInstall();
            startBot();
        } else if (code === 1) {
            console.log("[StartRunner] Stop code (1) received. Shutting down runner.");
            process.exit(0);
        } else {
            console.log("[StartRunner] Bot exited normally or crashed. Restarting in 5 seconds...");
            setTimeout(startBot, 5000);
        }
    });
}

// Initial Run
updateAndInstall();
startBot();
