const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");

const addToCart = async (req, res) => {
  const { productId, quantity, itemSet, color } = req.body;
  // console.log(req.body);

  // console.log(itemSet);

  const userId = req.user.userId;
  //   console.log(req.user.userId);
  try {
    const product = await Product.findById(productId);
    // console.log(product);

    if (!product) {
      throw new CustomError.NotFoundError("Product not found");
    }

    // Calculate the price for the given quantity
    const price = product.price * quantity;

    // Create a new CartItem
    const cartItem = new CartItem({
      productId,
      quantity,
      price,
      itemSet,
      color,
    });

    // Find the user's cart or create a new one
    let cart = await Cart.findOne({ userId });
    // console.log(cart);

    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0, totalItems: 0 });
    }

    // const itemExists = cart.items.some(
    //   (item) => console.log(item.itemSet, cartItem.itemSet)
    //   // item.productId.toString() === cartItem.productId &&
    //   // item.color === cartItem.color &&
    //   // item.itemSet.length === cartItem.itemSet.length &&
    //   // item.itemSet.every(
    //   //   (set, index) =>
    //   //     set.size === cartItem.itemSet[index].size &&
    //   //     set.length === cartItem.itemSet[index].length
    //   // )
    // );
    // console.log(itemExists);

    // if (itemExists) {
    //   throw new CustomError.ForbiddenError("Item allready exist in cart.");
    // }

    // Add the CartItem to the cart
    cart.items.push(cartItem);
    cart.totalPrice += price;
    cart.totalItems += quantity;

    await cart.save();
    console.log(cart);

    res.status(StatusCodes.CREATED).json({ success: true, data: cart });
    //   console.log("adding to kart");
  } catch (error) {
    // console.log(error);

    throw new CustomError.BadRequestError(
      "Something went wrong while adding into the cart....",
      error
    );
  }
};

const getCart = async (req, res) => {
  const userId = req.user.userId;

  const cart = await Cart.findOne({ userId }).populate("items.productId");

  if (!cart) {
    throw new CustomError.NotFoundError("Cart not found");
  }
  res.status(StatusCodes.OK).json({ data: cart });
};

const removeitem = async (req, res) => {
  //   const { cartItemId } = req.params.id;
  const userId = req.user.userId;
  //   console.log(req.params.id);
  //   console.log(userId);

  // Find the user's cart
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new CustomError.NotFoundError("Cart is empty.");
  }

  // Find the CartItem
  const cartItem = cart.items.id(req.params.id);
  //   console.log(cartItem);

  if (!cartItem) {
    throw new Error("CartItem not found");
  }

  //   Remove the CartItem from the cart
  cart.items.pull(cartItem._id);
  cart.totalPrice -= cartItem.price;
  cart.totalItems -= cartItem.quantity;

  await cart.save();
  res.status(StatusCodes.OK).json({ data: "item Romoved", cart });
};

const updateCartItem = async (req, res) => {
  const userId = req.user.userId;
  const cartItemId = req.params.id;
  const { quantity, itemSet, color } = req.body;
  try {
    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the cart item
    const cartItem = cart.items.id(cartItemId);
    if (!cartItem) {
      return res.status(404).json({ message: "CartItem not found" });
    }
    // Update only the fields that are provided
    if (quantity !== undefined) {
      cartItem.quantity += quantity;
      cartItem.price =
        (cartItem.price / cartItem.quantity) * (cartItem.quantity + quantity); // Adjust the price based on the new quantity
    }
    if (itemSet !== undefined) {
      cartItem.itemSet = itemSet;
    }
    if (color !== undefined) {
      cartItem.color = color;
    }

    // Recalculate the cart total
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
    cart.totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    await cart.save();
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};
module.exports = { addToCart, getCart, removeitem, updateCartItem };
