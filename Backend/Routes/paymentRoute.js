const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Route to add a payment (POST route)
router.post('/addpayment', (req, res) => {
    const { amount, date, method } = req.body;

    // Validate that all fields are provided
    if (!amount || !date || !method) {
        return res.status(400).json({ message: 'Please provide all fields: amount, date, method' });
    }

    let payment = {
        amount,
        date,
        method
    };

    // SQL query to insert the payment
    let sql = 'INSERT INTO payment SET ?';
    pool.query(sql, payment, (err, result) => {
        if (err) {
            console.error("Error adding payment:", err);
            return res.status(500).send("Error adding payment");
        }
        res.status(201).send(`Payment added with ID: ${result.insertId}`);
    });
});

// Route to get all payments
router.get('/payments', (req, res) => {
    console.log('Request received for all payments');
    
    const sql = 'SELECT * FROM payment';
    
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching payments:', err);
            res.status(500).send('Error fetching payments');
            return;
        }
        
        res.json(results);
    });
});

router.put('/update-payment', (req, res) => {
    const { payment_id, amount, date, method } = req.body;

    // Check if all required fields are provided
    if (!payment_id || !amount || !date || !method) {
        return res.status(400).send("All fields (payment_id, amount, date, method) are required");
    }

    const query = `
        UPDATE payment 
        SET amount = ?, date = ?, method = ? 
        WHERE payment_id = ?;
    `;

    pool.query(query, [amount, date, method, payment_id], (err, result) => {
        if (err) {
            console.error("Error updating payment:", err);
            return res.status(500).send("Error updating payment");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("Payment not found");
        }

        return res.send("Payment updated successfully");
    });
});

router.delete('/delete-payment', (req, res) => {
    const { payment_id } = req.body;

    // Check if payment ID is provided
    if (!payment_id) {
        return res.status(400).send("payment_id is required");
    }

    const query = 'DELETE FROM payment WHERE payment_id = ?';

    pool.query(query, [payment_id], (err, result) => {
        if (err) {
            console.error("Error deleting payment:", err);
            return res.status(500).send("Error deleting payment");
        }

        // Check if any rows were affected 
        if (result.affectedRows === 0) {
            return res.status(404).send("Payment not found");
        }

        res.send("Payment deleted successfully");
    });
});

// Route to search payments by amount or method
router.get('/searchpayment', (req, res) => {
    const { term } = req.query;
    const query = `
        SELECT * FROM payment 
        WHERE amount LIKE ? OR method LIKE ?
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

// Route to search across multiple entities
router.get('/search', (req, res) => {
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
    const validKeywords = ['amount', 'method']; // Add valid column names here
    if (!validKeywords.includes(keyword)) {
        return res.status(400).json({ "Status": "Error", "Message": "Invalid keyword" });
    }

    pool.query(`SELECT * FROM payment WHERE ?? = ? ORDER BY payment_id ${validSort}`, [keyword, keyvalue], (err, result, fields) => {
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