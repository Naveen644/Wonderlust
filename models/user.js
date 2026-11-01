const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);