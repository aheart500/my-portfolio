require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const Admin = require("./Models/Admin");
const Message = require("./Models/Messages");
const SECRET = process.env.SECRET;
const DBURI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3001;
const jwt = require("jsonwebtoken");
const path = require("path");
const mongoose = require("mongoose");
mongoose
  .connect(
    DBURI,
    {
      useNewUrlParser: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    },
    () => {
      console.log("Connected to Database");
    }
  )
  .catch(err => {
    console.log(err);
  });

const getToken = (req, res, next) => {
  const authorization = req.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    req.token = authorization.substring(7);
  }
  next();
};

app.use(express.static("build"));
app.get("/admin", (req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, "./build/") });
});
app.use(bodyParser.json());

app.use(getToken);

app.get("/api/admin/messages", async (req, res) => {
  const token = req.token;
  const decodedToken = jwt.verify(token, SECRET);
  if (!decodedToken) {
    return res.status(401).json({
      error: "You're not authorized"
    });
  }
  const messages = await Message.find({}).sort({ Date: -1 });

  res.status(200).json(messages);
});
app.post("/api/admin/messages", async (req, res) => {
  try {
    const message = new Message({
      ...req.body,
      read: false
    });
    const response = await message.save();

    res.status(200).send("Sent");
  } catch (err) {
    res.status(404);
  }
});

app.patch("/api/admin/messages/:messageId", async (req, res) => {
  try {
    await Message.findByIdAndUpdate(
      { _id: req.params.messageId },
      { ...req.body }
    );
    const newMessages = await Message.find({}).sort({ Date: -1 });
    res.status(200).json(newMessages);
  } catch (err) {
    res.status(401);
  }
});

app.post("/api/admin/", async (req, res) => {
  const { email, pass } = req.body;
  try {
    const user = await Admin.findOne({ email: email });
    const correctPass =
      user !== null ? await bcrypt.compare(pass, user.password) : false;
    if (!(user && correctPass)) {
      return res.status(401).json({
        error: "invalid username or password"
      });
    }

    if (user && correctPass) {
      const dataToToken = {
        id: user._id
      };
      const token = jwt.sign(dataToToken, SECRET);
      res.status(200).json({ token });
    }
  } catch {
    res.status(401).json({
      error: "invalid username or password"
    });
  }
});

app.listen(PORT, () => {
  console.log("Server is listening on port " + PORT + "..");
});
