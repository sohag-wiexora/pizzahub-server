import { env } from '../../config/env.js';
import { ApiError } from '../../utils/apiError.js';

interface ImgbbUploadResponse {
  success: boolean;
  data?: {
    url: string;
    display_url: string;
    thumb?: { url: string };
    delete_url?: string;
  };
  error?: { message?: string };
}

interface UploadableFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

/**
 * Proxies the upload to ImgBB so the API key never leaves the server.
 * Returns the direct image URL that is stored on menu items.
 */

export const uploadImageToImgbb = async (file: UploadableFile) => {
  const form = new FormData();
  form.append(
    'image',
    new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
    file.originalname,
  );

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${env.IMGBB_API_KEY}`, {
    method: 'POST',
    body: form,
  });

  const result = (await response.json().catch(() => null)) as ImgbbUploadResponse | null;

  if (!response.ok || !result?.success || !result.data) {
    throw new ApiError(
      502,
      result?.error?.message
        ? `Image upload failed: ${result.error.message}`
        : 'Image upload failed. Please try again.',
    );
  }

  return {
    url: result.data.url,
    displayUrl: result.data.display_url,
    thumbnailUrl: result.data.thumb?.url ?? result.data.url,
    deleteUrl: result.data.delete_url ?? null,
  };
};
