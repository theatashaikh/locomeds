const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // You'll need to add this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET_NAME, // Replace with your bucket name
});

const bucket = admin.storage().bucket();

module.exports = { bucket };
