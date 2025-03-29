// const multer = require("multer");
const path = require("path");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./public/images");
//   },
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       file.fieldname + "-" + Date.now() + path.extname(file.originalname)
//     );
//   },
// });

// const upload = multer({ storage: storage });
// module.exports = upload;
// cloudinaryConfig.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY,      // Your API key
  api_secret: process.env.CLOUDINARY_API_SECRET // Your API secret
});

// Set up storage using multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", // Folder name in your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
    public_id: (req, file) =>
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
  }
});

// Multer upload middleware
const upload = require("multer")({ storage: storage });

module.exports = { upload, cloudinary };
