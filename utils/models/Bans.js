const { Schema, model } = require('mongoose');

const banSchema = new Schema({
    guildID: { type: String, required: true},
    userID: { type: String, required: true},
    userName : { type: String, required: true},
    reason: { type: String, required: false},
    bannedAt: { type: Date, required: true}
});

module.exports = model('Ban', banSchema);
