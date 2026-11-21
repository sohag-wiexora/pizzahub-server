import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth.js';
import { ApiError } from '../../utils/apiError.js';
import * as controller from './upload.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new ApiError(400, 'Only image files are allowed.'));
    }
    callback(null, true);
  },
});

const router = Router();

// Any signed-in user may upload (menu item images are required for vendors,
// profile images are optional for everyone else).
router.post('/image', authenticate, upload.single('image'), controller.uploadImage);

export default router;
