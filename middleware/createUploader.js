import multer from "multer";
import path from "path";
import fs from "fs";

export const createUploader = (folderName = "uploads") => {
  const uploadPath = path.join(process.cwd(), folderName);
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
      cb(null, uniqueName);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  };

  return multer({ storage, fileFilter });
};

// export default uploader instances if needed
export const productUpload = createUploader("uploads/products");
export const newsUpload = createUploader("uploads/news");
