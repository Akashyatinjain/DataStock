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

    // upload file to cloudinary
    const response = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: "auto"
      }
    );

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