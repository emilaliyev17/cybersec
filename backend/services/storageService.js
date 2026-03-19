const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

// Initialize GCS storage
let storage, bucket;
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'strategybrix-media';

try {
  storage = new Storage({
    projectId: 'contract-management-473819',
  });
  bucket = storage.bucket(BUCKET_NAME);
} catch (err) {
  console.warn('GCS initialization failed, will use local storage fallback:', err.message);
}

// Ensure local upload directory exists
const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'bios');
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

/**
 * Upload a file to GCS, with local filesystem fallback for development
 * @param {Object} file - Multer file object
 * @param {String} folder - Folder in bucket (e.g. 'bios')
 * @returns {Promise<String>} - Public URL of the uploaded file
 */
const uploadFile = async (file, folder = 'bios') => {
  if (!file) throw new Error('No file provided');

  const uniqueName = `${Date.now()}-${file.originalname}`;

  // Try GCS first (production)
  if (bucket && process.env.NODE_ENV === 'production') {
    const fileName = `${folder}/${uniqueName}`;
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        console.error('GCS Upload Error:', err);
        reject(err);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  }

  // Local fallback (development)
  const localPath = path.join(LOCAL_UPLOAD_DIR, uniqueName);
  fs.writeFileSync(localPath, file.buffer);
  const port = process.env.PORT || 5001;
  const localUrl = `http://localhost:${port}/uploads/bios/${uniqueName}`;
  console.log(`Photo saved locally: ${localUrl}`);
  return localUrl;
};

module.exports = {
  uploadFile,
  BUCKET_NAME,
};

