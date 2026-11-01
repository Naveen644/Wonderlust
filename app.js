require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const listing = require("./models/listing.js")
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");
const flash = require("connect-flash");
const Review = require("./models/review.js");
const Booking = require("./models/booking.js");

const mongoUrl = "mongodb://127.0.0.1:27017/wonderlust";

main().then(() =>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});
async function main(){
    await mongoose.connect(mongoUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));

app.use(
    session({
        secret: "wonderlust-secret",
        resave: false,
        saveUninitialized: true,
    })
);

app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }

    next();
};

//admin 
const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "Please log in first.");
        return res.redirect("/login");
    }

    if (req.user.role !== "admin") {
        req.flash("error", "Access denied. Admins only.");
        return res.redirect("/listings");
    }

    next();
};



// Signup form
app.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    const newUser = new User({
        username: username,
        email: email
    });

    const registeredUser = await User.register(newUser, password);

    res.redirect("/listings");
});

//login 
// Login form
app.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

// Login
app.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login"
    }),
    (req, res) => {
        res.redirect("/listings");
    }
);
//logout
app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        res.redirect("/listings");
    });
});

const isOwner = async (req, res, next) => {
    const { id } = req.params;

    const Listing = await listing.findById(id);

    if (!Listing.owner || !Listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that.");
        return res.redirect("/listings");
    }

    next();
};


const isReviewAuthor = async (req, res, next) => {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
        req.flash("error", "Review not found.");
        return res.redirect("/listings");
    }

    if (!review.author || !review.author.equals(req.user._id)) {
        req.flash("error", "You don't have permission to delete this review.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    next();
};


app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.get("/", (req, res) => {
    res.redirect("/listings");
});

// admin login 
app.get("/admin/login", (req, res) => {
    res.render("admin/login.ejs");
});

app.post(
    "/admin/login",
    passport.authenticate("local", {
        failureFlash: true,
        failureRedirect: "/admin/login"
    }),
    (req, res, next) => {
        if (req.user.role !== "admin") {
            return req.logout((err) => {
                if (err) return next(err);

                req.flash("error", "Admin access only.");
                res.redirect("/admin/login");
            });
        }

        req.flash("success", "Welcome, Admin!");
        res.redirect("/admin");
    }
);

app.post("/admin/logout", isAdmin, (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);

        req.flash("success", "Admin logged out successfully.");
        res.redirect("/admin/login");
    });
});


//admin
app.get("/admin", isAdmin, async (req, res) => {
    const pendingListings = await listing.find({
        status: "pending"
    });

    const pendingBookings = await Booking.find({
        status: "pending"
    }).populate("listing").populate("user");

    res.render("admin/dashboard.ejs", {
        pendingListings,
        pendingBookings
    });
});

//admin booking details 

app.post("/admin/bookings/:id/approve", isAdmin, async (req, res) => {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking || booking.status !== "pending") {
        req.flash("error", "Pending booking not found.");
        return res.redirect("/admin");
    }

    // Check for another confirmed overlapping booking
    const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        listing: booking.listing,
        status: "confirmed",
        checkIn: { $lt: booking.checkOut },
        checkOut: { $gt: booking.checkIn }
    });

    if (conflict) {
        req.flash("error", "These dates are already confirmed for another booking.");
        return res.redirect("/admin");
    }

    booking.status = "confirmed";
    await booking.save();

    req.flash("success", "Booking approved successfully!");
    res.redirect("/admin");
});


app.post("/admin/bookings/:id/reject", isAdmin, async (req, res) => {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking || booking.status !== "pending") {
        req.flash("error", "Pending booking not found.");
        return res.redirect("/admin");
    }

    booking.status = "rejected";
    await booking.save();

    req.flash("success", "Booking rejected successfully!");
    res.redirect("/admin");
});

//my listings
app.get("/my-listings", isLoggedIn, async (req, res) => {
    const myListings = await listing.find({
        owner: req.user._id
    });

    res.render("listings/myListings.ejs", { myListings });
});

app.post("/admin/listings/:id/approve", isAdmin, async (req, res) => {
    const { id } = req.params;

    const updatedListing = await listing.findByIdAndUpdate(
        id,
        { status: "approved" },
        { new: true, runValidators: true }
    );

    if (!updatedListing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/admin");
    }

    req.flash("success", "Listing approved successfully!");
    res.redirect("/admin");
});

app.post("/admin/listings/:id/reject", isAdmin, async (req, res) => {
    const { id } = req.params;

    const updatedListing = await listing.findByIdAndUpdate(
        id,
        { status: "rejected" },
        { new: true, runValidators: true }
    );

    if (!updatedListing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/admin");
    }

    req.flash("success", "Listing rejected.");
    res.redirect("/admin");
});




// index.js route


app.get("/listings", async (req, res) => {
    const { search, minPrice, maxPrice } = req.query;

    let filter = {};

    // Search by title, location, or country
    if (search && search.trim()) {
        filter.$or = [
            { title: { $regex: search.trim(), $options: "i" } },
            { location: { $regex: search.trim(), $options: "i" } },
            { country: { $regex: search.trim(), $options: "i" } }
        ];
    }

    // Validate and apply price filters
    const validMin = minPrice !== undefined &&
        minPrice.trim() !== "" &&
        Number.isFinite(Number(minPrice)) &&
        Number(minPrice) >= 0;

    const validMax = maxPrice !== undefined &&
        maxPrice.trim() !== "" &&
        Number.isFinite(Number(maxPrice)) &&
        Number(maxPrice) >= 0;

    if (
        validMin &&
        validMax &&
        Number(minPrice) > Number(maxPrice)
    ) {
        req.flash("error", "Minimum price cannot exceed maximum price.");
        return res.redirect("/listings");
    }

    if (validMin || validMax) {
        filter.price = {};

        if (validMin) filter.price.$gte = Number(minPrice);
        if (validMax) filter.price.$lte = Number(maxPrice);
    }

    filter.status = "approved";

    const allListings = await listing.find(filter);

    res.render("listings/index.ejs", {
        allListings,
        search: search || "",
        minPrice: minPrice || "",
        maxPrice: maxPrice || ""
    });
});



//New route
app.get("/listings/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
})

// show route

app.get("/listings/:id", async (req, res) => {
    let { id } = req.params;

    const Listing = await listing
        .findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        });

    res.render("listings/show.ejs", { Listing });
});


// show route 
app.put("/listings/:id", isLoggedIn, async (req, res) => {
    let { id } = req.params;
    await listing.findByIdAndUpdate(id, { ...req.body.Listing });
    res.redirect(`/listings/${id}`);
});

//create route
app.post("/listings", isLoggedIn, async (req, res) => {
    const newListing = new listing({
    ...req.body.listing,
    owner: req.user._id,
    status: "pending"
    });

    newListing.owner = req.user._id;

    await newListing.save();

    res.redirect("/listings");
});

// review

app.post("/listings/:id/reviews", isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body.review || {};

    // Validate rating
    const numericRating = Number(rating);

    if (
        rating === undefined ||
        rating === "" ||
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
    ) {
        req.flash("error", "Rating must be a whole number from 1 to 5.");
        return res.redirect(`/listings/${id}`);
    }

    // Validate comment
    if (typeof comment !== "string" || !comment.trim()) {
        req.flash("error", "Please write a comment before submitting.");
        return res.redirect(`/listings/${id}`);
    }

    // Check that the listing exists
    const Listing = await listing.findById(id);
    if (Listing.owner && Listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot review your own listing.");
    return res.redirect(`/listings/${id}`);
    }

    if (!Listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    // Create and save the review
    const newReview = new Review({
        rating: numericRating,
        comment: comment.trim(),
        author: req.user._id
    });

    try {
    await newReview.save();

    Listing.reviews.push(newReview._id);
    await Listing.save();
    } catch (err) {
    if (err.name === "ValidationError") {
        req.flash("error", err.message);
        return res.redirect(`/listings/${id}`);
    }

    throw err;
}
    req.flash("success", "Review added successfully!");
    res.redirect(`/listings/${id}`);
});

//booking dates

app.post("/listings/:id/book", isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut } = req.body;

    // Find listing
    const foundListing = await listing.findById(id);

    if (!foundListing || foundListing.status !== "approved") {
        req.flash("error", "Listing is not available for booking.");
        return res.redirect("/listings");
    }

    // Validate dates
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (
        !checkIn ||
        !checkOut ||
        isNaN(startDate.getTime()) ||
        isNaN(endDate.getTime()) ||
        startDate < new Date(new Date().toDateString()) ||
        endDate <= startDate
    ) {
        req.flash("error", "Please select valid booking dates.");
        return res.redirect(`/listings/${id}`);
    }

    // Calculate total nights
    const nights = Math.ceil(
        (endDate - startDate) / (1000 * 60 * 60 * 24)
    );
    
    // Check for overlapping bookings
    const existingBooking = await Booking.findOne({
        listing: id,
        status: { $in: ["pending", "confirmed"] },
        checkIn: { $lt: endDate },
        checkOut: { $gt: startDate }
    });

    if (existingBooking) {
        req.flash(
            "error",
            "Sorry, this listing is already booked for these dates."
        );
        return res.redirect(`/listings/${id}`);
    }

    const totalPrice = nights * foundListing.price;

    // Create booking
    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        checkIn: startDate,
        checkOut: endDate,
        totalPrice: totalPrice
    });

    await newBooking.save();

    req.flash("success", "Booking request submitted successfully!");
    res.redirect("/listings");
});

//fetching bookings
app.get("/my-bookings", isLoggedIn, async (req, res) => {
    const bookings = await Booking.find({
        user: req.user._id
    }).populate("listing");

    res.render("bookings/index.ejs", { bookings });
});

//delete bookings

app.post("/my-bookings/:bookingId/cancel", isLoggedIn, async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
        _id: bookingId,
        user: req.user._id
    });

    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect("/my-bookings");
    }

    if (booking.status !== "pending") {
        req.flash("error", "Only pending bookings can be cancelled.");
        return res.redirect("/my-bookings");
    }

    booking.status = "cancelled";
    await booking.save();

    req.flash("success", "Booking cancelled successfully!");
    res.redirect("/my-bookings");
});


//delete review
app.delete(
    "/listings/:id/reviews/:reviewId",
    isLoggedIn,
    isReviewAuthor,
    async (req, res) => {
        const { id, reviewId } = req.params;

        await listing.findByIdAndUpdate(id, {
            $pull: { reviews: reviewId }
        });

        await Review.findByIdAndDelete(reviewId);

        req.flash("success", "Review deleted successfully!");

        res.redirect(`/listings/${id}`);
    }
);


//edit route 
app.get("/listings/:id/edit", isLoggedIn, isOwner, async (req, res) => {
    let {id} = req.params;
    const Listing = await listing.findById(id);
    res.render("listings/edit.ejs",{ Listing })
})

//update route
app.put("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
    let { id } = req.params;

    await listing.findByIdAndUpdate(id, { ...req.body.Listing });

    res.redirect(`/listings/${id}`);
});

//delete route
app.delete("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
    let { id } = req.params;

    await listing.findByIdAndDelete(id);

    res.redirect("/listings");
});


app.listen(8080,()=>{
    console.log("server is listennig...");
})