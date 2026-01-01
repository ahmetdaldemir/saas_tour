import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Uploads klasörünü oluştur (hem source hem dist için)
const getUploadsDir = () => {
  // Production'da __dirname: /app/dist/modules/shared/controllers
  // Development'ta __dirname: src/modules/shared/controllers
  // Her iki durumda da /app/public/uploads'a gitmek gerekir (Dockerfile'da COPY public ./public)
  let baseDir: string;
  if (__dirname.includes('dist')) {
    // Production: /app/dist/modules/shared/controllers -> ../../../../public/uploads
    // /app/dist/modules/shared/controllers -> ../../../../ -> /app/ -> public/uploads
    baseDir = path.join(__dirname, '../../../../public/uploads');
  } else {
    // Development: src/modules/shared/controllers -> ../../../public/uploads
    baseDir = path.join(__dirname, '../../../public/uploads');
  }
  
  // Klasör yoksa oluştur
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(`Uploads directory created: ${baseDir}`);
  }
  
  return baseDir;
};

const uploadsDir = getUploadsDir();
console.log(`Uploads directory: ${uploadsDir}`);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Klasörün var olduğundan emin ol
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Created uploads directory in destination callback: ${uploadsDir}`);
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Dosya adını: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;
    console.log(`Saving file: ${filename} to ${uploadsDir}`);
    cb(null, filename);
  },
});

// File filter - resim ve video dosyalarına izin ver
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim ve video dosyaları yüklenebilir (JPEG, PNG, GIF, WebP, SVG, ICO, MP4, MOV, AVI)'));
  }
};

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (for videos)
  },
});

export class FileUploadController {
  static async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Dosya yüklenmedi' });
      }

      // Dosyanın gerçekten kaydedildiğini kontrol et
      const filePath = path.join(uploadsDir, req.file.filename);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found after upload: ${filePath}`);
        return res.status(500).json({ message: 'Dosya kaydedilemedi' });
      }

      console.log(`File uploaded successfully: ${filePath}`);

      // Public URL oluştur
      const fileUrl = `/uploads/${req.file.filename}`;
      const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;

      res.json({
        success: true,
        url: fileUrl,
        fullUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: (error as Error).message || 'Dosya yükleme hatası' });
    }
  }
}

