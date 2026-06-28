import multer from 'multer';

// Use memory storage since we want to upload directly to Supabase from the buffer
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
