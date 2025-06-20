import express from 'express';
import { registerAdmin, loginAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin, changePassword, sendResetCodeAdmin, resetAdminPasswordWithOtp } from '../controllers/admin.controller.js';
import { uploadFiles } from "../middlewares/imageMulter.middleware.js";

const router = express.Router();

router.post('/register', uploadFiles, registerAdmin);
router.post('/login', loginAdmin);
router.get('/getAllAdmin', getAllAdmins);
router.get('/view/:adminId', getAdminById);
router.put('/update/:adminId', updateAdmin);
router.delete('/delete/:adminId', deleteAdmin);
router.put('/change-password/:adminId', changePassword);
router.post('/send-reset-code', sendResetCodeAdmin);
router.post('/reset-password', resetAdminPasswordWithOtp);


export default router;
