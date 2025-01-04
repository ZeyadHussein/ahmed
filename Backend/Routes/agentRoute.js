const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const bcrypt = require('bcrypt'); // For password hashing

// Route to add an agent (POST route)
router.post('/addagent', (req, res) => {
    const { name, Email, Password } = req.body;

    // Validate that all fields are provided
    if (!name || !Email || !Password) {
        return res.status(400).json({ message: 'Please provide all fields: name, Email, Password' });
    }

    // Hash the password before storing it
    bcrypt.hash(Password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Error hashing password');
        }

        let agent = {
            name,
            Email,
            Password: hashedPassword
        };

        // SQL query to insert the agent
        let sql = 'INSERT INTO agent SET ?';
        pool.query(sql, agent, (err, result) => {
            if (err) {
                console.error("Error adding agent:", err);
                return res.status(500).send("Error adding agent");
            }
            res.status(201).send(`Agent added with ID: ${result.insertId}`);
        });
    });
});


// Route to get all agents
router.get('/agents', (req, res) => {
    console.log('Request received for all agents');
    
    const sql = 'SELECT * FROM agent';
    
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching agents:', err);
            res.status(500).send('Error fetching agents');
            return;
        }
        
        res.json(results);
    });
});

router.put('/update-agent', (req, res) => {
    const { agent_id, name, Email, Password } = req.body;

    // Check if all required fields are provided
    if (!agent_id || !name || !Email || !Password) {
        return res.status(400).send("All fields (agent_id, name, Email, Password) are required");
    }

    // Hash the new password before updating
    bcrypt.hash(Password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Error hashing password');
        }

        const query = `
            UPDATE agent 
            SET name = ?, Email = ?, Password = ? 
            WHERE agent_id = ?;
        `;

        pool.query(query, [name, Email, hashedPassword, agent_id], (err, result) => {
            if (err) {
                console.error("Error updating agent:", err);
                return res.status(500).send("Error updating agent");
            }

            if (result.affectedRows === 0) {
                return res.status(404).send("Agent not found");
            }

            return res.send("Agent updated successfully");
        });
    });
});




// DELETE AGENT

router.delete('/delete-agent', (req, res) => {
    const { agent_id } = req.body;

    // Check if agent ID is provided
    if (!agent_id) {
        return res.status(400).send("agent_id is required");
    }

    const query = 'DELETE FROM agent WHERE agent_id = ?';

    pool.query(query, [agent_id], (err, result) => {
        if (err) {
            console.error("Error deleting agent:", err);
            return res.status(500).send("Error deleting agent");
        }

        // Check if any rows were affected 
        if (result.affectedRows === 0) {
            return res.status(404).send("Agent not found");
        }

        res.send("Agent deleted successfully");
    });
});











// Route to search agents by name or email
router.get('/searchagent', (req, res) => {
    const { term } = req.query;
    const query = `
        SELECT * FROM agent 
        WHERE name LIKE ? OR Email LIKE ?
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
    const validKeywords = ['name', 'Email']; // Add valid column names here
    if (!validKeywords.includes(keyword)) {
        return res.status(400).json({ "Status": "Error", "Message": "Invalid keyword" });
    }

    pool.query(`SELECT * FROM agent WHERE ?? = ? ORDER BY agent_id ${validSort}`, [keyword, keyvalue], (err, result, fields) => {
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