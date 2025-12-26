const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function viewData() {
    console.log('Connecting to database...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'recipe_db'
        });

        console.log('\n--- USERS ---');
        const [users] = await connection.query('SELECT id, username, email FROM users');
        console.table(users);

        console.log('\n--- REVIEWS ---');
        const [reviews] = await connection.query('SELECT * FROM reviews');
        console.table(reviews);

        await connection.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

viewData();
