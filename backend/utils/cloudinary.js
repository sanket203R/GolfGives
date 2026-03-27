const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

const uploadFromDataUrl = async (dataUrl, folder = 'golfgives_verifications') => {
  if (!dataUrl) throw new Error('dataUrl is required');
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured');
  }

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: 'auto',
    overwrite: false,
    unique_filename: true
  });

  return result;
};

module.exports = { uploadFromDataUrl };