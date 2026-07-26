const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DEFAULT_PROFILE = { name: "", pronouns: "", language: "", likes: [], dislikes: [], notes: [] };

async function updateProfile(userId, field, action, value) {
    try {
        const filePath = path.join(DATA_DIR, `${userId}.json`);
        let data = "[]";
        try {
            data = await fs.readFile(filePath, 'utf8');
        } catch (e) {
            // File might not exist
        }

        let parsed = [];
        try {
            parsed = JSON.parse(data);
        } catch (e) { }

        let userData = { profile: { ...DEFAULT_PROFILE }, history: [] };

        if (Array.isArray(parsed)) {
            userData.history = parsed;
        } else {
            userData.profile = { ...DEFAULT_PROFILE, ...(parsed.profile || {}) };
            userData.history = parsed.history || [];
        }

        const validStringFields = ['name', 'pronouns', 'language'];
        const validArrayFields = ['likes', 'dislikes', 'notes'];

        if (!validStringFields.includes(field) && !validArrayFields.includes(field)) {
            return { error: `Invalid field '${field}'. Valid fields are: ${validStringFields.concat(validArrayFields).join(', ')}` };
        }

        if (validStringFields.includes(field)) {
            if (action !== 'set') return { error: `String fields only support 'set' action.` };
            userData.profile[field] = value;
        } else if (validArrayFields.includes(field)) {
            if (action === 'add') {
                if (!userData.profile[field].includes(value)) {
                    userData.profile[field].push(value);
                }
            } else if (action === 'remove') {
                userData.profile[field] = userData.profile[field].filter(v => v !== value);
            } else if (action === 'set') {
                // If they want to set the entire array, they should pass an array or string
                userData.profile[field] = Array.isArray(value) ? value : [value];
            } else {
                return { error: `Array fields only support 'add', 'remove', or 'set'.` };
            }
        }

        await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
        return { message: `Successfully applied ${action} on ${field} with value '${value}'.` };
    } catch (e) {
        return { error: `Failed to update profile: ${e.message}` };
    }
}

module.exports = { updateProfile };
