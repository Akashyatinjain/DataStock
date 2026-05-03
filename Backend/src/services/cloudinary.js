import {v2 as cloudinary} from "cloudinary"
import { log } from "console";
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_api_key,
    api_secret:process.env.CLOUDINARY_api_secret
});


const uploadOnCloudinary = async (localFilePath) =>{
    try{
        if(!localFilePath){
            return null;
        }
        //upload the files 
       const response = await cloudinary.uploader.upload(localFilePath, {
  resource_type: "auto"
});

// delete after success
fs.unlinkSync(localFilePath);

return response;
        // files has been succesfully uploaded
        // console.log("File is uploaded on cloudinary",response.url);
        // return response;
    }catch(error){
        console.log("CLOUDINARY ERROR:", error); // 🔥 ADD THIS
        fs.unlinkSync(localFilePath) //remove the locally saved temporary files as the upload operation got failed 
        return null;
    }
}

export  {uploadOnCloudinary};