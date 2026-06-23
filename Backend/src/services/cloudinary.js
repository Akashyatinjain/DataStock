import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// ==========================
// UPLOAD FILE
// ==========================

const uploadOnCloudinary = async (localFilePath) => {

  try {

    if (!localFilePath) {
      throw new Error("Local file path missing");
    }

    // upload file to cloudinary (using upload_large for chunked uploading of files up to 200MB)
    const response = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(
        localFilePath,
        {
          resource_type: "auto",
          chunk_size: 20 * 1024 * 1024 // 20MB chunks
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    // delete local temp file after success
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return {
      secure_url: response.secure_url,
      public_id: response.public_id,
      bytes: response.bytes,
      resource_type: response.resource_type,
      format: response.format,
      original_filename: response.original_filename
    };

  } catch (error) {

    console.log("CLOUDINARY ERROR:", error);

    // remove temp file if upload fails
    if (
      localFilePath &&
      fs.existsSync(localFilePath)
    ) {
      fs.unlinkSync(localFilePath);
    }

    throw new Error(
      error.message || "Cloudinary upload failed"
    );
  }
};


// ==========================
// DELETE FILE
// ==========================

// const deleteFromCloudinary = async (
//   publicId,
//   resourceType = "image"
// ) => {

//   try {

//     return await cloudinary.uploader.destroy(
//       publicId,
//       {
//         resource_type: resourceType
//       }
//     );

//   } catch (error) {

//     console.log(
//       "CLOUDINARY DELETE ERROR:",
//       error
//     );

//     throw new Error(
//       error.message || "Cloudinary delete failed"
//     );
//   }
// };
const deleteFromCloudinary = async (
  publicId,
  resourceType = "image"
) => {

  try {

    return await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: resourceType
      }
    );

  } catch (error) {

    console.log(
      "CLOUDINARY DELETE ERROR:",
      error
    );

    throw new Error(
      error.message || "Cloudinary delete failed"
    );
  }
};

export {
  uploadOnCloudinary,
  deleteFromCloudinary
};