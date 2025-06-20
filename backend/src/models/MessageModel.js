const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recruiter', // Reference to the User model
        required: true,
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate', // Reference to the User model
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;