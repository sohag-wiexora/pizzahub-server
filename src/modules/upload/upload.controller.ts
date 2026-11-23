import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as uploadService from './upload.service.js';

/** POST /api/v1/uploads/image (multipart, field name: "image") */

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(
      400,
      'Image file is required. Send it as multipart/form-data with the field name "image".',
    );
  }

  const uploaded = await uploadService.uploadImageToImgbb(req.file);

  return sendResponse(res, {
    statusCode: 201,
    message: 'Image uploaded successfully',
    data: uploaded,
  });
});
