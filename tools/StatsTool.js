const os = require('os');

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getStats(client) {
    return {
        ping: `${client.ws.ping}ms`,
        bot_uptime: formatUptime(process.uptime()),
        system_uptime: formatUptime(os.uptime()),
        memory_usage: {
            process_rss: formatBytes(process.memoryUsage().rss),
            process_heap_used: formatBytes(process.memoryUsage().heapUsed),
            system_free: formatBytes(os.freemem()),
            system_total: formatBytes(os.totalmem())
        },
        cpu: {
            model: os.cpus()[0]?.model || "Unknown CPU",
            cores: os.cpus().length,
            arch: os.arch()
        },
        os: `${os.type()} ${os.release()} (${os.platform()})`
    };
}

module.exports = { getStats };
