const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require ('jsonwebtoken');



const activeTokens = new Set();  // Store active tokens for tracking logged-in users

// Secret key for JWT
const JWT_SECRET = 'your_secret_key';  // Replace with a secure key in production

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).send('Access Denied: No Token Provided');

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send('Invalid or expired token');
        req.user = user;  // Attach user data to request
        next();  // Proceed to the next middleware or route handler
    });
}





// Route to add a user (POST route)
router.post('/adduser', (req, res) => {
    const { user_name, user_email, user_pass } = req.body;

    // Validate that all fields are provided
    if (!user_name || !user_email || !user_pass) {
        return res.status(400).json({ message: 'Please provide all fields: user_name, user_email, user_pass' });
    }

    // Hash the password before storing it
    bcrypt.hash(user_pass, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Error hashing password');
        }

        let user = {
            user_name,
            user_email,
            user_pass: hashedPassword
        };

        // SQL query to insert the user
        let sql = 'INSERT INTO user SET ?';
        pool.query(sql, user, (err, result) => {
            if (err) {
                console.error("Error adding user:", err);
                return res.status(500).send("Error adding user");
            }
            res.status(201).send(`User added with ID: ${result.insertId}`);
        });
    });
});

// Route to get all users
router.get('/users', (req, res) => {
    console.log('Request received for all users');
    
    const sql = 'SELECT * FROM user';
    
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Error fetching users');
            return;
        }
        
        res.json(results);
    });
});

router.put('/update-user', (req, res) => {
    const { user_id, user_name, user_email, user_pass } = req.body;

    // Check if all required fields are provided
    if (!user_id || !user_name || !user_email || !user_pass) {
        return res.status(400).send("All fields (user_id, user_name, user_email, user_pass) are required");
    }

    // Hash the new password before updating
    bcrypt.hash(user_pass, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Error hashing password');
        }

        const query = `
            UPDATE user 
            SET user_name = ?, user_email = ?, user_pass = ? 
            WHERE user_id = ?;
        `;

        pool.query(query, [user_name, user_email, hashedPassword, user_id], (err, result) => {
            if (err) {
                console.error("Error updating user:", err);
                return res.status(500).send("Error updating user");
            }

            if (result.affectedRows === 0) {
                return res.status(404).send("User not found");
            }

            return res.send("User updated successfully");
        });
    });
});



router.delete('/delete-user', (req, res) => {
    const { user_id } = req.body;

    // Check if user ID is provided
    if (!user_id) {
        return res.status(400).send("user_id is required");
    }

    const query = 'DELETE FROM user WHERE user_id = ?';

    pool.query(query, [user_id], (err, result) => {
        if (err) {
            console.error("Error deleting user:", err);
            return res.status(500).send("Error deleting user");
        }

        // Check if any rows were affected
        if (result.affectedRows === 0) {
            return res.status(404).send("User not found");
        }

        res.send("User deleted successfully");
    });
});







// Route to search users by name or email
router.get('/searchuser', (req, res) => {
    const { term } = req.query;
    const query = `
        SELECT * FROM user 
        WHERE user_name LIKE ? OR user_email LIKE ?
    `;

    // Use pool.query to execute the query
    pool.query(query, [`%${term}%`, `%${term}%`], (err, results) => {
        if (err) {
            console.error('Error during search:', err);
            res.status(500).send('Error during search');
            return;
        }
        res.json(results); // Send the results back as JSON
    });
});



// Route to handle user login
router.post('/login', (req, res) => {
    const { user_email, user_pass } = req.body;
  
    if (!user_email || !user_pass) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }
  
    const sql = 'SELECT * FROM user WHERE user_email = ?';
    pool.query(sql, [user_email], (err, results) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).send('Error fetching user');
      }
  
      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      const user = results[0];
  
      bcrypt.compare(user_pass, user.user_pass, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).send('Error comparing passwords');
        }
  
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
  
        // Generate a JWT token
        const token = jwt.sign({ id: user.user_id, email: user.user_email }, JWT_SECRET, { expiresIn: '1h' });
  
        // Return the token and user info
        res.json({ message: 'Login successful', token });
      });
    });
  });
  









// Route to search across multiple entities
router.get('/searchuser', (req, res) => {
    const keyword = req.query.keyword;
    const keyvalue = req.query.keyvalue;
    const sort = req.query.sort;

    // Validate that keyword and keyvalue are provided
    if (!keyword || !keyvalue) {
        return res.status(400).json({ "Status": "Error", "Message": "Both keyword and keyvalue are required" });
    }

    // Validate sort input to prevent SQL injection
    const validSort = ['ASC', 'DESC'].includes(sort?.toUpperCase()) ? sort.toUpperCase() : 'ASC';

    // Validate keyword to prevent SQL injection
    const validKeywords = ['user_name', 'user_email']; // Add valid column names here
    if (!validKeywords.includes(keyword)) {
        return res.status(400).json({ "Status": "Error", "Message": "Invalid keyword" });
    }

    pool.query(`SELECT * FROM user WHERE ?? = ? ORDER BY user_id ${validSort}`, [keyword, keyvalue], (err, result, fields) => {
        if (err) {
            res.json({ "Status": "Error", "Message": err });
        } else {
            res.json(result);
            console.log(result);
        }
    });
    console.log("Incoming SEARCH Request");
});

module.exports = router;