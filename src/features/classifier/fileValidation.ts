export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type FileValidation = { valid: true } | { valid: false; message: string };

export function validateImageFile(file: File): FileValidation {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return { valid: false, message: 'Choose a JPEG, PNG, or WebP image.' };
  }
  if (file.size <= 0) return { valid: false, message: 'This file is empty. Choose another image.' };
  if (file.size > MAX_IMAGE_BYTES) return { valid: false, message: 'This image is larger than 10 MB. Choose a smaller file.' };
  return { valid: true };
}
