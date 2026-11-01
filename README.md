# Wonderlust 🏡

Wonderlust is a full-stack property listing and booking web application inspired by platforms like Airbnb. Users can explore properties, submit their own listings, and request bookings. Administrators can review listings and manage booking requests.

## 🚀 Features

### User Features
- User registration and login
- Browse approved property listings
- Search listings by title, location, and country
- Filter listings by price range
- Create and submit property listings for approval
- View personal listings and their approval status
- Submit ratings and reviews
- Book properties by selecting check-in and check-out dates
- View and cancel pending bookings

### Admin Features
- Admin authentication and role-based access
- Admin dashboard
- Approve or reject submitted listings
- View pending booking requests
- Approve or reject booking requests

### Booking Features
- Automatic booking price calculation
- Booking status management
- Prevention of overlapping pending or confirmed bookings

## 🛠️ Technologies Used

- **Frontend:** HTML, CSS, Bootstrap, EJS
- **Backend:** JavaScript, Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** Passport.js, Express Session
- **Version Control:** Git and GitHub

## ⚙️ Installation and Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/Naveen644/Wonderlust.git
   ```

2. Navigate to the project folder:

   ```bash
   cd Wonderlust
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory:

   ```env
   SESSION_SECRET=your_secret_key
   ```

5. Make sure MongoDB is running locally.

6. Start the application:

   ```bash
   node app.js
   ```

7. Open your browser:

   ```text
   http://localhost:8080
   ```

## 📁 Project Structure

```text
Wonderlust/
├── init/
├── models/
│   ├── booking.js
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── public/
│   └── css/
├── views/
│   ├── admin/
│   ├── bookings/
│   ├── includes/
│   ├── layouts/
│   ├── listings/
│   └── users/
├── .gitignore
├── app.js
├── package.json
└── package-lock.json
```

## 🔐 Security

- Password-based authentication using Passport.js.
- Role-based access control for admin routes.
- Listing ownership checks.
- Booking ownership checks.
- Environment variables for session secrets.

## 👨‍💻 Author

**Naveen**

GitHub: [Naveen644](https://github.com/Naveen644)

---

This project is being developed as a practical full-stack web development learning project.