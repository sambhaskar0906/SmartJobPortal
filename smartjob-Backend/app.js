import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import candidateRoutes from './src/routers/candidate.route.js';
import adminRoutes from './src/routers/admin.route.js';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use('/upload', express.static('upload'));

app.use('/resume', express.static('resume'));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());

app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/admin', adminRoutes)

export { app };
