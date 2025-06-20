import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminSchema = new mongoose.Schema(
    {
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        mobile: { type: String, required: true, unique: true },
        password: {
            type: String,
            required: true,
            minlength: [6, 'Password should be at least 6 characters long'],
        },
        profilePhoto: { type: String },
        adminId: {
            type: String,
            unique: true,
        },
        role: {
            type: Number,
            default: 1,
            required: true,
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

// 🔐 Password hashing & adminId generation
adminSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    if (!this.adminId) {
        const prefix = 'ADM';
        const randomDigit = Math.floor(1000 + Math.random() * 9000);
        this.adminId = `${prefix}_${randomDigit}`;
    }

    next();
});

// ✅ Password comparison method
adminSchema.methods.isPasswordCorrect = async function (password) {
    return bcrypt.compare(password, this.password);
};

export default mongoose.model('Admin', adminSchema);
