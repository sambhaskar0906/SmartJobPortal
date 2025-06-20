import Admin from '../models/admin.model.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';

// ✅ Token Generator (uses env directly)
const generateToken = (admin) => {
    return jwt.sign(
        {
            _id: admin._id,
            adminId: admin.adminId,
            first_name: admin.first_name,
            last_name: admin.last_name,
            email: admin.email,
            mobile: admin.mobile,
            profilePhoto: admin.profilePhoto,
            role: admin.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

// ✅ Admin Registration
export const registerAdmin = async (req, res) => {
    try {
        const { first_name, last_name, email, mobile, password, profilePhoto } = req.body;

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists with this email' });
        }

        const newAdmin = new Admin({
            first_name,
            last_name,
            email,
            mobile,
            password,
            profilePhoto: req.files?.profilePhoto?.[0]?.filename ? `upload/${req.files.profilePhoto[0].filename}` : ''
        });

        await newAdmin.save();
        console.log(newAdmin);
        const token = generateToken(newAdmin);

        res.status(201).json({
            message: 'Admin registered successfully',
            token,
            admin: {
                _id: newAdmin._id,
                adminId: newAdmin.adminId,
                first_name: newAdmin.first_name,
                last_name: newAdmin.last_name,
                email: newAdmin.email,
                mobile: newAdmin.mobile,
                profilePhoto: newAdmin.profilePhoto,
                role: newAdmin.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error registering admin', error: error.message });
    }
};

// ✅ Admin Login
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const isMatch = await admin.isPasswordCorrect(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = generateToken(admin);

        res.status(200).json({
            message: 'Login successful',
            token,
            admin: {
                _id: admin._id,
                adminId: admin.adminId,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email,
                mobile: admin.mobile,
                profilePhoto: admin.profilePhoto,
                role: admin.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Login error', error: error.message });
    }
};

// ✅ Get All Admins
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.status(200).json({ message: 'Admins fetched successfully', admins });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admins', error: error.message });
    }
};

// ✅ Get Admin by adminId
export const getAdminById = async (req, res) => {
    try {
        const { adminId } = req.params;
        const admin = await Admin.findOne({ adminId }).select('-password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.status(200).json({ message: 'Admin fetched successfully', admin });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin', error: error.message });
    }
};


// ✅ Update Admin by adminId
export const updateAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const updatedData = req.body;

        // If you're allowing profile photo update
        if (req.files?.profilePhoto?.[0]?.filename) {
            updatedData.profilePhoto = `upload/${req.files.profilePhoto[0].filename}`;
        }

        const updatedAdmin = await Admin.findOneAndUpdate(
            { adminId },
            { $set: updatedData },
            { new: true }
        ).select('-password');

        if (!updatedAdmin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ message: 'Admin updated successfully', admin: updatedAdmin });
    } catch (error) {
        res.status(500).json({ message: 'Error updating admin', error: error.message });
    }
};


// ✅ Delete Admin by adminId
export const deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const deletedAdmin = await Admin.findOneAndDelete({ adminId });

        if (!deletedAdmin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting admin', error: error.message });
    }
};


// ✅ Change Admin Password by adminId
export const changePassword = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { oldPassword, newPassword } = req.body;

        // Step 1: Find admin
        const admin = await Admin.findOne({ adminId });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Step 2: Validate old password
        const isMatch = await admin.isPasswordCorrect(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Old password is incorrect' });
        }

        // Step 3: Update to new password
        admin.password = newPassword; // Will be hashed by pre-save hook
        await admin.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};


//Send OTP Admin
export const sendResetCodeAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        admin.resetPasswordOTP = otp;
        admin.resetPasswordExpires = expiry;
        await admin.save({ validateBeforeSave: false });

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2e7d32; text-align: center;">SmartJob - Admin Password Reset</h2>
                <p>Hello ${admin.first_name},</p>
                <p>You requested to reset your admin account password. Use the OTP below:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 30px; font-weight: bold; color: #2e7d32; background: #f1f1f1; padding: 12px 24px; border-radius: 8px; letter-spacing: 4px;">
                        ${otp}
                    </span>
                </div>
                <p>This OTP is valid for <strong>10 minutes</strong>.</p>
                <p>If you didn’t request this, ignore this email.</p>
                <br/>
                <p style="color: #555;">Thanks,<br/>SmartJob Team</p>
            </div>
        `;

        await sendEmail(email, 'SmartJob Admin Password Reset OTP', htmlContent);

        res.status(200).json({ message: 'OTP sent to email successfully' });
    } catch (error) {
        console.error('Error in sendResetCodeAdmin:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// ✅ Reset Admin Password with OTP
export const resetAdminPasswordWithOtp = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        if (
            admin.resetPasswordOTP !== otp ||
            !admin.resetPasswordExpires ||
            admin.resetPasswordExpires < new Date()
        ) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        admin.password = newPassword;
        admin.resetPasswordOTP = undefined;
        admin.resetPasswordExpires = undefined;

        await admin.save({ validateBeforeSave: false });

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error in resetAdminPasswordWithOtp:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};



