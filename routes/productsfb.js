const router = require("express").Router();
const Product = require("../models/productModel");
const multer = require("multer");
const adminAuth = require("../middlewares/adminAuth");
const uuid = require("uuid").v4;

const { bucket } = require("../firebase");

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/add-product",
  adminAuth,
  upload.array("productImages", 4),
  async (req, res) => {
    try {
      const {
        name,
        price,
        quantity,
        description,
        category,
        imagesUrl,
        manufacturer,
        isAvailable,
        isPrescriptionNecessary,
        isFeatured,
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      if (!price) {
        return res.status(400).json({ message: "Price is required" });
      }

      if (price < 1) {
        return res
          .status(400)
          .json({ message: "Price must be greater than 0" });
      }

      if (!quantity) {
        return res.status(400).json({ message: "Quantity is required" });
      }

      if (quantity < 1) {
        return res
          .status(400)
          .json({ message: "Quantity must be greater than 0" });
      }

      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      if (!manufacturer) {
        return res.status(400).json({ message: "Manufacturer is required" });
      }

      const files = req.files;
      console.log(files);

      const fileNames = files.map((file) => `${uuid()}-${file.originalname}`);
      console.log(fileNames);

      const blobs = fileNames.map((filename) => bucket.file(filename));
      console.log(blobs);

      const blobStreams = blobs.map((blob, index) =>
        blob.createWriteStream({
          metadata: {
            contentType: files[index].mimetype,
          },
        })
      );

      console.log(blobStreams);

      const downloadUrls = blobs.map((blob, index) => {
        return `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(blob.name)}?alt=media`;
      });

      console.log(downloadUrls);

      const product = new Product({
        name,
        price,
        quantity,
        description,
        category,
        imagesUrl: downloadUrls,
        manufacturer,
        isAvailable,
        isPrescriptionNecessary,
        isFeatured,
      });

      blobStreams.forEach((stream, index) => {
        stream.on("error", (error) => {
          res.status(500).send(error);
        });
      });

      blobStreams.forEach((stream, index) => {
        stream.on("finish", async () => {
          try {
            if (index === blobStreams.length - 1) {
              await product.save();
              res
                .status(201)
                .json({ message: "Product added successfully", product });
            }
          } catch (error) {
            res.status(500).json({ message: error.message });
          }
        });
      });

      //   to upload to firebase
      blobStreams.forEach((stream, index) => {
        stream.end(files[index].buffer);
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
