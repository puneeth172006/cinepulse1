
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MySQL connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Home route
app.get("/", (req, res) => {
    res.send("Welcome to CinePulse Backend!");
});

// Get all movies with their genres
app.get("/api/movies", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                m.movie_id,
                m.title,
                m.overview,
                m.release_date,
                m.language,
                m.poster_path,
                GROUP_CONCAT(
                    DISTINCT g.genre_name
                    ORDER BY g.genre_name
                    SEPARATOR ', '
                ) AS genres
            FROM movies m
            LEFT JOIN movie_genres mg
                ON m.movie_id = mg.movie_id
            LEFT JOIN genres g
                ON mg.genre_id = g.genre_id
            GROUP BY
                m.movie_id,
                m.title,
                m.overview,
                m.release_date,
                m.language,
                m.poster_path
        `);

        res.json({
            message: "Movies fetched successfully!",
            movies: rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch movies"
        });
    }
});

// Get movie details by ID
app.get("/api/movies/:id", async (req, res) => {
    try {
        const movieId = req.params.id;

        const [rows] = await db.query(
            "SELECT * FROM movies WHERE movie_id = ?",
            [movieId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Movie not found"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch movie details"
        });
    }
});

// Get reviews with usernames
app.get("/api/movies/:movieId/reviews", async (req, res) => {
    try {
        const movieId = req.params.movieId;

        const [rows] = await db.query(
            `SELECT
                r.review_id,
                r.user_id,
                u.username,
                r.rating,
                r.review_text
             FROM reviews r
             JOIN users u
                ON r.user_id = u.user_id
             WHERE r.movie_id = ?
             ORDER BY r.review_id DESC`,
            [movieId]
        );

        res.json({
            message: "Reviews fetched successfully!",
            reviews: rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch reviews"
        });
    }
});

// Add a review for a movie
app.post("/api/movies/:movieId/reviews", async (req, res) => {
    try {
        const movieId = req.params.movieId;
        const { user_id, rating, review_text } = req.body;

        if (!user_id || !rating || !review_text) {
            return res.status(400).json({
                message: "Please provide user_id, rating and review_text"
            });
        }

        if (rating < 1 || rating > 10) {
            return res.status(400).json({
                message: "Rating must be between 1 and 10"
            });
        }

        const [result] = await db.query(
            "INSERT INTO reviews (user_id, movie_id, rating, review_text) VALUES (?, ?, ?, ?)",
            [user_id, movieId, rating, review_text]
        );

        res.status(201).json({
            message: "Review added successfully!",
            review_id: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to add review"
        });
    }
});

// Get average rating for a movie
app.get("/api/movies/:movieId/rating", async (req, res) => {
    try {
        const movieId = req.params.movieId;

        const [rows] = await db.query(
            `SELECT
                AVG(rating) AS average_rating,
                COUNT(*) AS total_reviews
             FROM reviews
             WHERE movie_id = ?`,
            [movieId]
        );

        res.json({
            message: "Movie rating fetched successfully!",
            average_rating: rows[0].average_rating,
            total_reviews: rows[0].total_reviews
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch movie rating"
        });
    }
});

// Get user's watchlist
app.get("/api/users/:userId/watchlist", async (req, res) => {
    try {
        const userId = req.params.userId;

        const [rows] = await db.query(
            `SELECT
                w.watchlist_id,
                w.user_id,
                m.movie_id,
                m.title,
                m.overview,
                m.language,
                m.poster_path,
                w.added_at
             FROM watchlist w
             JOIN movies m
                ON w.movie_id = m.movie_id
             WHERE w.user_id = ?`,
            [userId]
        );

        res.json({
            message: "Watchlist fetched successfully!",
            watchlist: rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch watchlist"
        });
    }
});

// Add movie to user's watchlist
app.post("/api/users/:userId/watchlist", async (req, res) => {
    try {
        const userId = req.params.userId;
        const movieId = req.body.movie_id;

        await db.query(
            "INSERT INTO watchlist (user_id, movie_id) VALUES (?, ?)",
            [userId, movieId]
        );

        res.json({
            message: "Movie added to watchlist successfully!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to add movie to watchlist"
        });
    }
});

// Remove movie from user's watchlist
app.delete("/api/users/:userId/watchlist/:movieId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const movieId = req.params.movieId;

        const [result] = await db.query(
            "DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?",
            [userId, movieId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Movie not found in watchlist"
            });
        }

        res.json({
            message: "Movie removed from watchlist successfully!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to remove movie from watchlist"
        });
    }
});

// User Registration API
app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please enter all fields"
            });
        }

        // Check if email already exists
        const [existingUser] = await db.query(
            "SELECT user_id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        await db.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );

        res.status(201).json({
            message: "User registered successfully!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Registration failed"
        });
    }
});

// User Login API
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password"
            });
        }

        // Find user by email
        const [rows] = await db.query(
            "SELECT user_id, username, email, password FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = rows[0];

        // Compare entered password with hashed password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.json({
            message: "Login successful!",
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Login failed"
        });
    }
});

// Start server
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`CinePulse server running on port ${PORT}`);
});
