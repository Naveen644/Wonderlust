const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    comment: {
    type: String,
    required: true,
    minlength: [3, "Comment must be at least 3 characters long."],
    maxlength: [500, "Comment cannot exceed 500 characters."]
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },

    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing"
    }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;