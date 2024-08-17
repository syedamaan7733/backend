const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const createProduct = async (req, res) => {
  const items = req.body;
  req.body.user = req.user.userId;
  const product = await Product.create(items);
  res.status(StatusCodes.CREATED).json({ product });
};

const getAllProducts = async (req, res) => {
  const products = await Product.find({})
    .sort({ createdAt: -1 })
    .select(
      "brand colors price images itemSet material category gender article createdAt"
    );
  console.log("OK");

  res.status(StatusCodes.OK).json({ count: products.length, products });
};

const getSingleProduct = async (req, res) => {
  const { id: productId } = req.params;
  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new CustomError.NotFoundError(`No product with id: ${productId}`);
  }
  res.status(StatusCodes.OK).json({ product });
};

const updateProduct = async (req, res) => {
  const { id: productId } = req.params;
  const product = await Product.updateOne(
    { _id: productId },
    { $set: req.body },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!product) {
    throw new CustomError.NotFoundError(`No product wth Id: ${productId}`);
  }
  res.status(StatusCodes.OK).json({ product });
};

const deleteProduct = async (req, res) => {
  const { id: productId } = req.params;
  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new CustomError.NotFoundError(`No product with Id: ${productId}`);
  }
  await Product.deleteOne({ _id: productId });
  res.status(StatusCodes.OK).json({ msg: "Product have been deleted ;)" });
};

/*
 *____________________________*
 |CATEGORY RELATED CONTROLLERS|
  ____________________________
*/

const searchCategory = async (req, res) => {
  const { gender } = req.query;
  // console.log(gender);

  try {
    let categories;
    if (!gender) {
      categories = await Product.distinct("category");
    } else {
      // Find all distinct categories in the Product collection based on the gender
      categories = await Product.distinct("category", { gender: gender });
      // console.log(categories);
    }
    //
    // Send the list of categories as a response
    res.status(200).json({
      success: true,
      data: categories,
      totalCategory: `Total category in ${gender} section: ${categories.length}`,
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching categories",
      error: error.message,
    });
  }
};

const searchProductsByCategory = async (req, res) => {
  const { category } = req.query; // Use req.query to get the category

  try {
    // Find all products in the Product collection that match the given category
    // Sort by 'createdAt' field in descending order to get the latest items first
    const products = await Product.find({ category: category }).sort({
      createdAt: -1,
    });
    console.log(products);

    // Send the list of products as a response
    res.status(200).json({
      success: true,
      products: products,
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching products",
      error: error.message,
    });
  }
};

// search functionality
const searchProduct = async (req, res) => {
  try {
    const { q, page = 1 } = req.query; // Extract 'q' and 'page' from query parameters

    // Construct the search query
    const searchQuery = {
      $or: [
        { gender: { $regex: q } }, // Case-insensitive search in gender
        { brand: { $regex: q, $options: "i" } }, // Case-insensitive search in brand
        { category: { $regex: q, $options: "i" } }, // Case-insensitive search in category
        { article: { $regex: q, $options: "i" } }, // Case-insensitive search in article
      ],
    };

    // Pagination options
    const limit = 10; // Number of results per page
    const skip = (page - 1) * limit; // Calculate how many results to skip

    // Execute the query with pagination
    const products = await Product.find(searchQuery)
      .select("brand article category gender") // Only select the productName field
      .skip(skip) // Skip the appropriate number of results
      .limit(limit); // Limit the number of results returned

    // Get the total count of matching documents
    const total = await Product.countDocuments(searchQuery);

    // Calculate the total number of pages
    const totalPages = Math.ceil(total / limit);

    // Send the response with products, current page, and total pages
    res.json({
      products,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const querySearch = async (req, res) => {
  res.json({ msg: "hello" });
};

const searchArticle = async (req, res) => {
  try {
    // Extract the article from the request query
    const { article } = req.query;

    // Ensure the article parameter is provided
    if (!article) {
      return res.status(400).json({
        success: false,
        message: "Article query parameter is required",
      });
    }

    // Search for products with the matching article
    const products = await Product.find({
      article: { $regex: article, $options: "i" },
    });

    // Check if products were found
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found matching the article",
      });
    }

    // Send the list of matching products as a response
    res.status(200).json({
      success: true,
      products: products,
    });
  } catch (error) {
    // Handle errors
    console.error("Error searching for article:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching for the article",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  searchProduct,
  searchCategory,
  searchProductsByCategory,
  querySearch,
};
