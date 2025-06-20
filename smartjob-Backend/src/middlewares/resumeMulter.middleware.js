import multer from "multer";
import path from "path";
import fs from "fs";

const resumeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./resume";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const uniqueName = `${name}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

export const uploadResume = multer({ storage: resumeStorage });
