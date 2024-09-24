// Import necessary packages
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const { v6: uuidv6, v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;
const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");

cloudinary.config({
  cloud_name: process.env.CLOUDNARY_NAME,
  api_key: process.env.CLOUDNARY_API_KEY,
  api_secret: process.env.CLOUDNARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "..", "public", "data", "images");
    fs.ensureDirSync(uploadPath); // Ensure the directory exists
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffixAdv = uuidv4();
    const uniqueSuffix = uuidv6();
    cb(null, uniqueSuffix + uniqueSuffixAdv + "-" + file.originalname);
  },
});
// Specifing the max image size
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 7 * 1024 * 1024 },
// });

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory instead of disk
  limits: { fileSize: 7 * 1024 * 1024 }, // Limit file size to 7MB
});

// Utility function to delete temporary files after upload
const deleteTempFiles = (files) => {
  files.forEach((file) => {
    const filePath = file.path;
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete the ${filePath}`, err);
      else console.log(`Deleted temp file: ${filePath}`);
    });
  });
};

// function to upload in the cloud
// const uploadToCloudinary = (filePath) => {
//   return cloudinary.uploader.upload(filePath, {
//     folder: "salim_api_product_images",
//   });
// };

const uploadToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "salim_api_product_images" },
      (error, result) => {
        if (error) {
          return reject(new Error("Failed to upload to Cloudinary."));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer); // Stream the buffer to Cloudinary
  });
};

// router.post("/upload-img", (req, res) => {
//   const uploadHandler = upload.any();

//   uploadHandler(req, res, async (err) => {
//     if (err) {
//       throw new CustomError.BadRequestError("Something Went Wrong try again.");
//     }
//     try {
//       // declaring all necessary val from the request also handling the error
//       const files = req.files;
//       if (!files || files.length === 0) {
//         throw new CustomError.BadRequestError("Please upload images.");
//       }

//       const { primaryImages, colorImages } = req.body;

//       if (Object.keys(req.body).length === 0) {
//         throw new CustomError.BadRequestError(
//           `Please provide the Body structure in which you want to store
//            the secure URL links. And keys of both files and string must matchs
//            the format`
//         );
//       }
//       // parsed the JSON data
//       const parsedPrimaryImages = JSON.parse(primaryImages);
//       const parsedColorImages = JSON.parse(colorImages);

//       // setting up response body
//       const imgResponse = {
//         primaryImages: [],
//         colorImages: {},
//       };

//       // primaray Images upload functionality
//       const primaryImgUploads = files
//         .filter((f) => parsedPrimaryImages.includes(f.originalname))
//         .map(async (file) => {
//           const result = await uploadToCloudinary(file.path);
//           fs.remove(file.path);
//           return result.secure_url;
//         });
//       // uploading images to cloud and saving the link in the object
//       imgResponse.primaryImages = await Promise.all(primaryImgUploads);

//       // Color based image upload functionality
//       for (let color in parsedColorImages) {
//         const colorImgFiles = files.filter((f) =>
//           parsedColorImages[color].includes(f.originalname)
//         );
//         const colorImgUploads = colorImgFiles.map(async (file) => {
//           const result = await uploadToCloudinary(file.path);
//           fs.remove(file.path);
//           return result.secure_url;
//         });

//         imgResponse.colorImages[color] = await Promise.all(colorImgUploads);
//       }
//       // deleteTempFiles(files);
//       res.status(StatusCodes.CREATED).json({ data: imgResponse });
//     } catch (error) {
//       res
//         .status(StatusCodes.INTERNAL_SERVER_ERROR)
//         .json({ error: error.message });
//     }
//   });
// });

router.post("/upload-img", (req, res) => {
  const uploadHandler = upload.any();

  uploadHandler(req, res, async (err) => {
    if (err) {
      throw new CustomError.BadRequestError("Something Went Wrong try again.");
    }
    try {
      const files = req.files;
      console.log(files, req.body);
      if (!files || files.length === 0) {
        throw new CustomError.BadRequestError("Please upload images.");
      }

      const { primaryImages, colorImages } = req.body;

      if (Object.keys(req.body).length === 0) {
        throw new CustomError.BadRequestError(
          "Please provide the Body structure in which you want to store the secure URL links."
        );
      }

      const parsedPrimaryImages = JSON.parse(primaryImages);
      const parsedColorImages = JSON.parse(colorImages);

      const imgResponse = {
        primaryImages: [],
        colorImages: {},
      };

      // Upload primary images
      const primaryImgUploads = files
        .filter((f) => parsedPrimaryImages.includes(f.originalname))
        .map(async (file) => {
          const result = await uploadToCloudinary(
            file.buffer,
            file.originalname
          );
          return result;
        });

      imgResponse.primaryImages = await Promise.all(primaryImgUploads);

      // Upload color images
      for (let color in parsedColorImages) {
        const colorImgFiles = files.filter((f) =>
          parsedColorImages[color].includes(f.originalname)
        );
        const colorImgUploads = colorImgFiles.map(async (file) => {
          const result = await uploadToCloudinary(
            file.buffer,
            file.originalname
          );
          return result;
        });

        imgResponse.colorImages[color] = await Promise.all(colorImgUploads);
      }

      res.status(StatusCodes.CREATED).json({ data: imgResponse });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  });
});

module.exports = router;

// Configure Multer to store files in public/data/images
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, "..", "public", "data", "images");
//     fs.ensureDirSync(uploadPath); // Ensure the directory exists
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = uuidv4();
//     cb(
//       null,
//       file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
//     ); // Use a unique name for each file
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 7 * 1024 * 1024 },
// });

// // POST route to handle image upload
// router.post("/upload-img", (req, res) => {
//   const uploadHandler = upload.any();
//   uploadHandler(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({ error: err.message });
//     }

// {
//   /* <>--------------------------------------------------------------------</> */
// }

// try {
//   const files = req.files;
//   // console.log(files);
//   files.filter(async (f) => {
//     const res = await uploadToCloudinary(f.path);
//     fs.removeSync(f.path);
//     console.log(res.secure_url);
//   });
//   // deleteTempFiles(files);
//   res.status(StatusCodes.CREATED).json({ msg: "test proceeded" });
// } catch (error) {
//   throw new CustomError.BadRequestError(error);
// }

// {
//   /* <>--------------------------------------------------------------------</> */
// }

//     try {

//       const files = req.files;
//       if (!files || files.length === 0) {
//         return res.status(400).json({ error: "No files uploaded" });
//       }

//       const uploadPromises = files.map((file) => {
//         return new Promise((resolve, reject) => {
//           cloudinary.uploader.upload(
//             file.path,
//             {
//               folder: "salim_api_product_images", // Specify a folder in Cloudinary
//             },
//             (error, result) => {
//               if (error) {
//                 reject(error);
//               } else {
//                 resolve(result);
//               }
//             }
//           );
//         });
//       });

//       const results = await Promise.all(uploadPromises);

//       // Delete local files after successful upload
//       files.forEach((file) => {
//         const filePath = path.join(
//           __dirname,
//           "public",
//           "tempImg",
//           file.filename
//         );
//         fs.remove(filePath, (err) => {
//           if (err) {
//             console.error(`Failed to delete file ${filePath}:`, err);
//           }
//         });
//       });

//       res.status(200).json({
//         message: "Images uploaded successfully",
//         data: results,
//       });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });
// });
const obj = {
  primaryImages: ["primary_3.jpeg", "primary_2.jpeg", "primary_1.png"],
  colorImages: {
    red: ["red_shoes_2.webp", "red_shoes_1.png"],
    blue: ["blue_shoes_2.png", "blue_shoes_1.png"],
    orange: ["orange_shoes_2.png", "orange_shoes_1.png"],
  },
};
