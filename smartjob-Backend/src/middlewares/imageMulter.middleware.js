// src/middlewares/fileUpload.middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

// Create folders if they don’t exist
const makeFolder = (folder) => {
  const dir = `./${folder}`;
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "profilePhoto") {
      cb(null, makeFolder("upload")); // profile photo
    } else if (file.fieldname === "candidateResume") {
      cb(null, makeFolder("resume")); // resume
    } else {
      cb(new Error("Invalid fieldname"), null);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const uniqueName = `${name}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

export const uploadFiles = multer({ storage }).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "candidateResume", maxCount: 1 }
]);
