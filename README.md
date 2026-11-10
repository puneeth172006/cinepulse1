# CinePulse -- Aggregated Movie & Review Hub

CinePulse is a movie discovery and review web application. Users can
browse movies, view movie details, read reviews, submit their own
reviews, and maintain a personal watchlist.

## Features

-   Browse movies with poster images and details.
-   Search and filter movies.
-   Filter movies by genre and language.
-   Register a new account and log in.
-   View movie details and ratings.
-   Read and submit movie reviews.
-   Add movies to a personal watchlist.
-   Remove movies from the watchlist.

## Technologies Used

-   **Frontend:** HTML, CSS, JavaScript
-   **Backend:** Node.js, Express.js
-   **Database:** MySQL

## Project Structure

``` text
cinepulse/
├── public/
│   ├── index.html
│   ├── movie.html
│   ├── auth.html
│   ├── watchlist.html
│   └── posters/
├── server.js
├── package.json
├── package-lock.json
└── .gitignore
```

## Requirements

Install the following before running the project:

-   [Node.js](https://nodejs.org/)
-   [MySQL](https://dev.mysql.com/downloads/)
-   A code editor such as [Visual Studio
    Code](https://code.visualstudio.com/)

## How to Run Locally

1.  Clone or download this repository.

2.  Open the project folder in Visual Studio Code.

3.  Install the project dependencies:

    ``` bash
    npm install
    ```

4.  Create a MySQL database named `cinepulse` and set up the required
    tables and data. The database backup is not included in this GitHub
    repository, so it must be provided or imported separately.

5.  Create a `.env` file in the project root with the database settings
    expected by `server.js`. Use your own local MySQL credentials. Do
    not upload this file to GitHub.

6.  Start the backend:

    ``` bash
    node server.js
    ```

7.  Open this address in your browser:

    <http://localhost:5000>

Keep the backend terminal and MySQL server running while using the
website.

## Database

CinePulse uses MySQL to store application data. The database includes
tables for:

-   Users
-   Movies
-   Genres
-   Movie--genre relationships
-   Reviews
-   Watchlists
-   User preferred genres
-   User preferred languages

## Security Note

Do not commit passwords, database credentials, `.env` files, or other
secret information to the public repository.

## Project Purpose

CinePulse was developed as an academic mini project to practise database
management, frontend development, backend development, and communication
between a web application and a relational database.

## Author

Developed as a student mini project.
