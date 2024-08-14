const { StatusCodes } = require("http-status-codes");
const validator = require("validator");
const User = require("../models/User");
const CustomError = require("../errors");
const { createJWT, createTokenUser, attach_ResTOCookie } = require("../utils");
const { default: Domain } = require("twilio/lib/base/Domain");
const { signedCookie } = require("cookie-parser");

const register = async (req, res) => {
  // scopping data from upcomming request
  const { name, phone, email, password } = req.body;

  // checking if email already in Database or not
  if (email) {
    const isEmailAlreadyExists = await User.findOne({ email });
    // console.log(isEmailAlreadyExists);
    if (isEmailAlreadyExists) {
      throw new CustomError.BadRequestError("Email Alerady Exist.");
    }
  }
  // first registerd User is Always an Admin
  const isFistAdmin = (await User.countDocuments({})) === 0;
  const role = isFistAdmin ? "admin" : "user";

  // creating a new User
  const user = await User.create({ name, phone, email, password, role });

  // extracting user data and createing cookie for forwarding as response
  const tokenUser = createTokenUser(user);
  // console.log(tokenUser);
  // attach_ResTOCookie({ res, user: tokenUser });

  // ALhumdulillah
  res.status(StatusCodes.CREATED).json({ tokenUser });
};

const logIn = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  const isEmail = validator.isEmail(identifier);
  // console.log(isEmail);
  let user;
  if (isEmail) {
    user = await User.findOne({ email: identifier });
  } else {
    user = await User.findOne({ phone: identifier });
  }
  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credential");
  }
  // checking the password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Password");
  }
  const userToken = createTokenUser(user);
  const token = createJWT({ payload: userToken });
  // console.log(token);
  // res.cookie("jwtoken", token, {
  //   httpOnly: true,
  //   secure: true,
  //   // sameSite: "None",
  //   // path: "/",
  //   signed: true,
  //   // Domain: "http://localhost:5173/",
  // });

  // console.log(req.signedCookies);
  // attach_ResTOCookie({ res, user: userToken });
  // res.cookie("token", "hellotoken");
  // console.log(token);

  res.status(StatusCodes.OK).json({ token, userToken });
};

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

module.exports = { register, logIn, logout };
