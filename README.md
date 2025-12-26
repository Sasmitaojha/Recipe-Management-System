# Annapurna - Smart Recipe Manager

Annapurna is a beautiful, full-stack recipe management application built with **Node.js** and **Vanilla JavaScript**. It uses a glassmorphism design and features personalized recipe suggestions, detailed cooking instructions, and a review system.

![Annapurna Preview](https://via.placeholder.com/800x400?text=Annapurna+App+Preview)

## Features

-   **Deep Search**: Filter recipes by Cuisine (Italian, Mexican, etc.), Meal Type, and Dietary preferences (Vegan, Gluten-Free).
-   **User Personalization**: Create a profile with specific **Cooking Skills** (Beginner, Expert) and **Excluded Ingredients** (Allergies).
-   **Detailed Views**: View full ingredient lists and step-by-step cooking instructions.
-   **Smart Caching**: Reduces API calls by caching recipe details in a MySQL database.
-   **Community**: Rate and review recipes.
-   **Responsive Design**: Premium dark-mode UI with glassmorphism effects.

## Tech Stack

-   **Frontend**: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
-   **Backend**: Node.js, Express.js
-   **Database**: MySQL
-   **Authentication**: JWT (JSON Web Tokens)
-   **API Integration**: Spoonacular API (with Mock Fallback)

## Setup Instructions

### 1. Prerequisites
-   Node.js installed
-   MySQL Server installed and running

### 2. Installation

 Clone the repository
`git clone <repository-url>`

 Install dependencies
`npm install`

### 3. Database Setup

1.  Log in to your MySQL terminal.
2.  Create the database and schema using the initialization script:
    `node server/init-db.js`

### 4. Configuration

Create a `.env` file in the `server` directory with your credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=recipe_db
JWT_SECRET=your_jwt_secret
PORT=3000
SPOONACULAR_API_KEY=your_api_key  # Optional (App has a rich mock mode)
```

### 5. Run the Application

Start the server:
`npm start`

Open your browser to:
`http://localhost:3000`

## Mock Mode
If no API key is provided, Annapurna runs in **Mock Mode**, providing a curated list of 27 detailed recipes (including Tacos, Biryani, Pizza, and more) for testing the UI and database features without external dependencies.
