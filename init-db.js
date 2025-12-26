const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function initDB() {
    console.log('Connecting to MySQL...');

    // Connect without database selected to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    console.log('Reading schema...');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    try {
        await connection.query(schemaSql);
        console.log('Database and tables created successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await connection.end();
    }
}

initDB();
