import Candidate from '../models/candidate.model.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';

const generateToken = (candidate) => {
    return jwt.sign(
        {
            id: candidate._id,
            candidateId: candidate.candidateId,
            email: candidate.email,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            mobile: candidate.mobile,
            job_function: candidate.job_function,
            current_location: candidate.current_location,
            experience: candidate.experience,
            key_skills: candidate.key_skills,
            candidateResume: candidate.candidateResume,
            profilePhoto: candidate.profilePhoto,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

// Register Candidate
export const registerCandidate = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            mobile,
            job_function,
            current_location,
            years,
            months,
            key_skills,
            password,
        } = req.body;

        const existingCandidate = await Candidate.findOne({ email });
        if (existingCandidate) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        const candidate = new Candidate({
            first_name,
            last_name,
            email,
            mobile,
            job_function,
            current_location,
            experience: { years, months },
            key_skills,
            password,
            candidateResume: req.files?.candidateResume?.[0]?.path || '',
            profilePhoto: req.files?.profilePhoto?.[0]?.path || '',
        });

        await candidate.save();

        const token = generateToken(candidate);

        return res.status(201).json({
            message: 'Candidate registered successfully',
            token,
            user: {
                id: candidate._id,
                candidateId: candidate.candidateId,
                first_name: candidate.first_name,
                last_name: candidate.last_name,
                email: candidate.email,
                mobile: candidate.mobile,
                job_function: candidate.job_function,
                current_location: candidate.current_location,
                experience: candidate.experience,
                key_skills: candidate.key_skills,
                candidateResume: candidate.candidateResume,
                profilePhoto: candidate.profilePhoto,
            },
        });
    } catch (error) {
        console.error('Error in registerCandidate:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// Login Candidate
export const loginCandidate = async (req, res) => {
    try {
        const { email, password } = req.body;

        const candidate = await Candidate.findOne({ email });
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const isMatch = await candidate.isPasswordCorrect(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(candidate);

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: candidate._id,
                candidateId: candidate.candidateId,
                first_name: candidate.first_name,
                last_name: candidate.last_name,
                email: candidate.email,
                mobile: candidate.mobile,
                job_function: candidate.job_function,
                current_location: candidate.current_location,
                experience: candidate.experience,
                key_skills: candidate.key_skills,
                candidateResume: candidate.candidateResume,
                profilePhoto: candidate.profilePhoto,
            },
        });
    } catch (error) {
        console.error('Error in loginCandidate:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// Get all candidates
export const getAllCandidates = async (req, res) => {
    try {
        const candidates = await Candidate.find().select("-password");
        res.status(200).json(candidates);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// View candidate by candidateId
export const getCandidateByCandidateId = async (req, res) => {
    try {
        const candidate = await Candidate.findOne({ candidateId: req.params.candidateId }).select("-password");
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }
        res.status(200).json(candidate);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Update candidate by candidateId
export const updateCandidateByCandidateId = async (req, res) => {
    try {
        const { candidateId } = req.params;

        const updateData = {
            ...req.body,
            experience: {
                years: req.body.years,
                months: req.body.months,
            },
        };

        if (req.files?.candidateResume?.[0]?.path) {
            updateData.candidateResume = req.files.candidateResume[0].path;
        }

        if (req.files?.profilePhoto?.[0]?.path) {
            updateData.profilePhoto = req.files.profilePhoto[0].path;
        }

        const updatedCandidate = await Candidate.findOneAndUpdate(
            { candidateId },
            updateData,
            { new: true }
        );

        if (!updatedCandidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }

        res.status(200).json({ message: "Candidate updated successfully", user: updatedCandidate });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Delete candidate by candidateId
export const deleteCandidateByCandidateId = async (req, res) => {
    try {
        const candidate = await Candidate.findOneAndDelete({ candidateId: req.params.candidateId });
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }
        res.status(200).json({ message: "Candidate deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Change password 
export const changeCandidatePassword = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: 'Access denied. No token provided or invalid format.' });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Old and new password are required' });
        }

        const candidate = await Candidate.findById(decoded.id);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const isMatch = await candidate.isPasswordCorrect(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Old password is incorrect' });
        }

        candidate.password = newPassword;

        // ✅ Save only password and skip other validation
        await candidate.save({ validateBeforeSave: false });

        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error in changeCandidatePassword:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// OTP Send by Email
export const sendResetCode = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const candidate = await Candidate.findOne({ email });
        if (!candidate) return res.status(404).json({ message: "Candidate not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        candidate.resetPasswordOTP = otp;
        candidate.resetPasswordExpires = expiry;
        await candidate.save({ validateBeforeSave: false });

        // HTML email content
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2e7d32; text-align: center;">SmartJob - Password Reset</h2>
                <p>Hello,</p>
                <p>You requested to reset your SmartJob account password. Please use the OTP below to proceed:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 30px; font-weight: bold; color: #2e7d32; background: #f1f1f1; padding: 12px 24px; border-radius: 8px; letter-spacing: 4px;">
                        ${otp}
                    </span>
                </div>
                <p>This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone.</p>
                <p>If you didn’t request this password reset, you can safely ignore this email.</p>
                <br/>
                <p style="color: #555;">Thanks & Regards,<br/>SmartJob Team</p>
            </div>
        `;

        await sendEmail(email, 'SmartJob Password Reset OTP', htmlContent);

        res.status(200).json({ message: 'OTP sent to email successfully' });
    } catch (error) {
        console.error('Error in sendResetCode:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// Reset Password by OTP
export const resetPasswordWithOtp = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const candidate = await Candidate.findOne({ email });
        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

        if (
            candidate.resetPasswordOTP !== otp ||
            !candidate.resetPasswordExpires ||
            candidate.resetPasswordExpires < new Date()
        ) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        candidate.password = newPassword;
        candidate.resetPasswordOTP = undefined;
        candidate.resetPasswordExpires = undefined;

        await candidate.save({ validateBeforeSave: false });

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error in resetPasswordWithOtp:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};




