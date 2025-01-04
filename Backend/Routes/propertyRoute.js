const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Route to add a property (POST route)
router.post('/addproperty', (req, res) => {
    const { address, size, type } = req.body;

    // Validate that all fields are provided
    if (!address || !size || !type) {
        return res.status(400).json({ message: 'Please provide all fields: address, size, type' });
    }

    let property = {
        address,
        size,
        type
    };

    // SQL query to insert the property
    let sql = 'INSERT INTO property SET ?';
    pool.query(sql, property, (err, result) => {
        if (err) {
            console.error("Error adding property:", err);
            return res.status(500).send("Error adding property");
        }
        res.status(201).send(`Property added with ID: ${result.insertId}`);
    });
});

// Route to get all properties
router.get('/properties', (req, res) => {
    console.log('Request received for all properties');
    
    const sql = 'SELECT * FROM property';
    
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching properties:', err);
            res.status(500).send('Error fetching properties');
            return;
        }
        
        res.json(results);
    });
});

router.put('/update-property', (req, res) => {
    const { property_id, address, size, type } = req.body;

    // Check if all required fields are provided
    if (!property_id || !address || !size || !type) {
        return res.status(400).send("All fields (property_id, address, size, type) are required");
    }

    const query = `
        UPDATE property 
        SET address = ?, size = ?, type = ? 
        WHERE property_id = ?;
    `;

    pool.query(query, [address, size, type, property_id], (err, result) => {
        if (err) {
            console.error("Error updating property:", err);
            return res.status(500).send("Error updating property");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("Property not found");
        }

        return res.send("Property updated successfully");
    });
});

router.delete('/delete-property', (req, res) => {
    const { property_id } = req.body;

    // Check if property ID is provided
    if (!property_id) {
        return res.status(400).send("property_id is required");
    }

    const query = 'DELETE FROM property WHERE property_id = ?';

    pool.query(query, [property_id], (err, result) => {
        if (err) {
            console.error("Error deleting property:", err);
            return res.status(500).send("Error deleting property");
        }

        // Check if any rows were affected 
        if (result.affectedRows === 0) {
            return res.status(404).send("Property not found");
        }

        res.send("Property deleted successfully");
    });
});

// Route to search properties by address or type
router.get('/searchproperty', (req, res) => {
    const { term } = req.query;
    const query = `
        SELECT * FROM property 
        WHERE address LIKE ? OR type LIKE ?
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
    const validKeywords = ['address', 'type']; // Add valid column names here
    if (!validKeywords.includes(keyword)) {
        return res.status(400).json({ "Status": "Error", "Message": "Invalid keyword" });
    }

    pool.query(`SELECT * FROM property WHERE ?? = ? ORDER BY property_id ${validSort}`, [keyword, keyvalue], (err, result, fields) => {
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