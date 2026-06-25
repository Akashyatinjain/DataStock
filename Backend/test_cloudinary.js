import "./src/config/env.js";
import { uploadOnCloudinary } from "./src/services/cloudinary.js";
import fs from "fs";

async function main() {
  const tempFile = "./test_temp.txt";
  fs.writeFileSync(tempFile, "Hello Cloudinary, this is a test upload!");

  console.log("Starting test upload...");
  try {
    const result = await uploadOnCloudinary(tempFile);
    console.log("UPLOAD SUCCESSFUL!");
    console.log("RESULT:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("UPLOAD FAILED:", error);
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

main();
