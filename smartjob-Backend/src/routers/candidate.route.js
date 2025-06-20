
import express from "express";
import {
    registerCandidate,
    loginCandidate,
    getAllCandidates,
    getCandidateByCandidateId,
    updateCandidateByCandidateId,
    deleteCandidateByCandidateId,
    changeCandidatePassword,
    sendResetCode,
    resetPasswordWithOtp
} from "../controllers/candidate.controller.js";

import { uploadFiles } from "../middlewares/imageMulter.middleware.js";

const router = express.Router();

router.post("/register", uploadFiles, registerCandidate);
router.post("/login", loginCandidate);
router.get("/", getAllCandidates);
router.get("/view/:candidateId", getCandidateByCandidateId);
router.put("/update/:candidateId", uploadFiles, updateCandidateByCandidateId);
router.delete("/delete/:candidateId", deleteCandidateByCandidateId);
router.post('/change-password', changeCandidatePassword);
router.post('/send-reset-code', sendResetCode);
router.post('/reset-password', resetPasswordWithOtp);


export default router;
