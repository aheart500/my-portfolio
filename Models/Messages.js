const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  text: String,
  read: Boolean,
  Date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
