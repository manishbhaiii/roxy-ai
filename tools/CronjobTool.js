const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '../data/cronjobs.json');
let activeTimers = {}; // { jobId: timeoutId }

async function loadJobs() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

async function saveJobs(jobs) {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(jobs, null, 2));
}

async function scheduleTask(client, userId, channelId, instruction, delayMinutes) {
    if (delayMinutes <= 0) return { error: "Delay must be greater than 0 minutes." };
    if (delayMinutes > 43200) return { error: "Cannot schedule tasks more than 30 days in advance." };

    let jobs = await loadJobs();
    if (!jobs[userId]) jobs[userId] = [];

    if (jobs[userId].length >= 5) {
        return { error: "Limit reached. You can only have a maximum of 5 active cronjobs." };
    }

    const jobId = crypto.randomBytes(4).toString('hex');
    const triggerAt = Date.now() + (delayMinutes * 60 * 1000);
    
    const job = {
        id: jobId,
        userId: userId,
        channelId: channelId,
        instruction: instruction,
        triggerAt: triggerAt
    };

    jobs[userId].push(job);
    await saveJobs(jobs);
    
    startTimer(client, job);
    return { success: true, jobId: jobId, message: `Task scheduled to run in ${delayMinutes} minutes.` };
}

async function listTasks(userId) {
    let jobs = await loadJobs();
    let userJobs = jobs[userId] || [];
    
    if (userJobs.length === 0) return { message: "You have no active scheduled tasks." };

    return {
        tasks: userJobs.map(j => ({
            id: j.id,
            instruction: j.instruction,
            runs_in_minutes: Math.max(0, Math.round((j.triggerAt - Date.now()) / 60000))
        }))
    };
}

async function deleteTask(userId, jobId) {
    let jobs = await loadJobs();
    if (!jobs[userId]) return { error: "You have no tasks." };

    const initialLength = jobs[userId].length;
    jobs[userId] = jobs[userId].filter(j => j.id !== jobId);

    if (jobs[userId].length === initialLength) {
        return { error: `Task with ID ${jobId} not found.` };
    }

    await saveJobs(jobs);

    if (activeTimers[jobId]) {
        clearTimeout(activeTimers[jobId]);
        delete activeTimers[jobId];
    }

    return { success: true, message: `Task ${jobId} successfully deleted.` };
}

function startTimer(client, job) {
    const delay = job.triggerAt - Date.now();

    if (delay <= 0) {
        executeJob(client, job);
    } else {
        const timeoutId = setTimeout(() => {
            executeJob(client, job);
        }, delay);
        activeTimers[job.id] = timeoutId;
    }
}

async function executeJob(client, job) {
    // Remove from active tasks
    let jobs = await loadJobs();
    if (jobs[job.userId]) {
        jobs[job.userId] = jobs[job.userId].filter(j => j.id !== job.id);
        await saveJobs(jobs);
    }
    delete activeTimers[job.id];

    if (typeof client.triggerCronjob === 'function') {
        client.triggerCronjob(job);
    } else {
        console.error("client.triggerCronjob is not defined!");
    }
}

async function initCronjobs(client) {
    let jobs = await loadJobs();
    for (const userId in jobs) {
        for (const job of jobs[userId]) {
            startTimer(client, job);
        }
    }
    console.log("[CronjobTool] All saved tasks have been loaded and scheduled.");
}

module.exports = { scheduleTask, listTasks, deleteTask, initCronjobs };
