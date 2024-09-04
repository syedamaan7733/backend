require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();

// packages
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
// const cloudinary = require("cloudinary").v2;

const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// connectDV
const connectDB = require("./db/connect");

// middleware
app.use(express.json());
app.use(morgan("tiny"));
app.set("trust proxy", 1);
app.use(cors());
app.use(cookieParser(process.env.JWT_SECRET));

// cloudinary config
// cloudinary.config({
//   cloud_name: process.env.CLOUDNARY_NAME,
//   api_key: CLOUDNARY_API_KEY,
//   api_secret: CLOUDNARY_API_SECRET,
// });

app.get("/", (req, res) => {
  res.send("Finally after so much long time....");
});

// routes mapping
const authRouter = require("./routes/authRoutes");
const productRouter = require("./routes/productRoutes");
const userRouter = require("./routes/userRoutes");
const orderRouter = require("./routes/orderRoutes");
const cartRouter = require("./routes/cartRoutes");
const searchRouter = require("./routes/searchRoute");

// routing map
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/search", searchRouter);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start-up function
const port = process.env.PORT || 7000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`Server is listening in in PORT:${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};
start();
