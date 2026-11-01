const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },

    image: {
        filename: {
            type: String,
            default: "listingimage",
        },
        url: {
            type: String,
            default: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
        },
    },

    price: {
        type: Number,
        min: 0,
    },

    location: {
        type: String,
        trim: true,
    },

    country: {
        type: String,
        trim: true,
    },
    
    
    status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
    },


    owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
    },
    reviews: [
    {
        type: Schema.Types.ObjectId,
        ref: "Review"
    }
    ],
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;