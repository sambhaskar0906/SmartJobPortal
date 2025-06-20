import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const candidateSchema = new mongoose.Schema(
    {
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        mobile: { type: String, required: true, unique: true },
        job_function: { type: String, required: true },
        current_location: { type: String, required: true },
        experience: {
            years: { type: Number, required: true },
            months: { type: Number, required: true },
        },
        key_skills: { type: String, required: true },
        password: {
            type: String,
            required: true,
            minlength: [6, 'Password should be at least 6 characters long'],
        },
        candidateResume: { type: String, required: true },
        profilePhoto: { type: String },
        candidateId: {
            type: String,
            unique: true,
        },
        resetPasswordOTP: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
    },
    { timestamps: true }
);


candidateSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    if (!this.candidateId) {
        const prefix = 'CAND';
        const randomDigit = Math.floor(1000 + Math.random() * 9000);
        this.candidateId = `${prefix}_${randomDigit}`;
    }

    next();
});

candidateSchema.methods.isPasswordCorrect = async function (password) {
    return bcrypt.compare(password, this.password);
};

export default mongoose.model('Candidate', candidateSchema);
