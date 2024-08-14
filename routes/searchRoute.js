const router = require("express").Router();
const {
  searchProduct,
  searchCategory,
  querySearch,
} = require("../controllers/productController");


router.get("/", searchProduct);


router.get("/category", searchCategory);
router.get("/q", querySearch);

module.exports = router;
