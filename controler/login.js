require("dotenv").config();
const userDb = require("../model/user");
const bcrypt = require("bcrypt");

const mongoose = require("mongoose");

// const userDb = {
//   users: require("../model/users.json"),
//   setUsers: function (data) {
//     this.users = data;
//   },
// };
const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {
  const { user, pwd } = req.body;
  try {
    if (!user || !pwd)
      return res.status(401).json({ error: "username or password required" });
    console.log(user, pwd);
    const foundUser = await userDb.findOne({ userName: user }).exec();
    if (!foundUser) return res.sendStatus(404); //unathorized

    const match = await bcrypt.compare(pwd, foundUser.password);

    if (match) {
      const accessToken = jwt.sign(
        { userName: foundUser.userName },
        process.env.ACCESS_SECRET,
        { expiresIn: "60s" }
      );
      const refreshToken = jwt.sign(
        { userName: foundUser.userName },
        process.env.ACCESS_REFRESH,
        { expiresIn: "1d" }
      );
      foundUser.refreshToken = refreshToken;
      //save in the database with this particular user
      const result = await foundUser.save();
      console.log(result);
      //sending the refresh token and the acess token
      //we can send the acess token either in the header or as payload
      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        //inproduction should be included
        // secure: true,
        // sameSite: "None",
        // maxAge: 24 * 60 * 60 * 1000,
      });
      //sending the acess token in the payload
      res.json({ accessToken });
    } else res.status(401).json({ message: "this is the problem" });
  } catch (error) {
    console.log(error);
  }
};
module.exports = { loginUser };
