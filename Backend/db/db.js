const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 10, // Limit the number of connections
    host: "localhost",
    user: "root",
    password: "", 
    database: "computerapp"
});

// Test the pool connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("Error connecting to MySQL:", err.code, err.message);
        return;
    }
    console.log("MySQL connected");
    connection.release(); // Release the connection back to the pool
});

module.exports = pool;
