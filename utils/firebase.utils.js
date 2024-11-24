const { bucket } = require("../config/firebase.config");
const { format } = require("url");

const uploadToFirebase = async (file, directory = "products") => {
  try {
    const fileName = `${directory}/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on("error", (error) => {
        reject(error);
      });

      blobStream.on("finish", async () => {
        // Make the file public
        await fileUpload.makePublic();

        // Get the public URL
        const publicUrl = format(
          `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`
        );

        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    throw new Error("Error uploading to Firebase");
  }
};

// Delete file from Firebase
const deleteFromFirebase = async (imageUrl) => {
  try {
    // Extract file path from URL
    // URL format: https://storage.googleapis.com/BUCKET_NAME/FILE_PATH
    const fileName = imageUrl.split("/").splice(4, 5).join("/");

    if (!fileName) {
      throw new Error("Invalid file URL");
    }

    // Decode the file name as it might contain special characters
    const decodedFileName = decodeURIComponent(fileName);

    // Delete file
    await bucket.file(decodedFileName).delete();

    return true;
  } catch (error) {
    console.error("Error deleting file from Firebase:", error);
    throw new Error("Error deleting file from Firebase");
  }
};

module.exports = { uploadToFirebase, deleteFromFirebase };
