const express = require('express');
const router = express.Router();
const pool = require('../db/db');


router.post('/addappointment', (req, res) => {
    const { appointment_date, appointment_time, status } = req.body;

    // Validate that all fields are provided
    if (!appointment_date || !appointment_time || !status) {
        return res.status(400).json({ message: 'Please provide all fields: appointment_date, appointment_time, status' });
    }

    let appointment = {
        appointment_date,
        appointment_time,
        status
    };

    // SQL query to insert the appointment
    let sql = 'INSERT INTO appointments SET ?';
    pool.query(sql, appointment, (err, result) => {
        if (err) {
            console.error("Error adding appointment:", err);
            return res.status(500).json({ message: "Error adding appointment", error: err });
        }
        res.status(201).send(`Appointment added with ID: ${result.insertId}`);
    });
});


// Route to get all appointments
router.get('/appointments', (req, res) => {
    console.log('Request received for all appointments');
    
    const sql = 'SELECT * FROM appointments';
    
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching appointments:', err);
            res.status(500).send('Error fetching appointments');
            return;
        }
        
        res.json(results);
    });
});

router.put('/update-appointment', (req, res) => {
    const { appointment_id, appointment_date, appointment_time, status } = req.body;

    // Check if all required fields are provided
    if (!appointment_id || !appointment_date || !appointment_time || !status) {
        return res.status(400).send("All fields (appointment_id, appointment_date, appointment_time, status) are required");
    }

    const query = `
        UPDATE appointments 
        SET appointment_date = ?, appointment_time = ?, status = ? 
        WHERE appointment_id = ?;
    `;

    pool.query(query, [appointment_date, appointment_time, status, appointment_id], (err, result) => {
        if (err) {
            console.error("Error updating appointment:", err);
            return res.status(500).send("Error updating appointment");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("Appointment not found");
        }

        return res.send("Appointment updated successfully");
    });
});

router.delete('/delete-appointment', (req, res) => {
    const { appointment_id } = req.body;

    // Check if appointment ID is provided
    if (!appointment_id) {
        return res.status(400).send("appointment_id is required");
    }

    const query = 'DELETE FROM appointments WHERE appointment_id = ?';

    pool.query(query, [appointment_id], (err, result) => {
        if (err) {
            console.error("Error deleting appointment:", err);
            return res.status(500).send("Error deleting appointment");
        }

        // Check if any rows were affected 
        if (result.affectedRows === 0) {
            return res.status(404).send("Appointment not found");
        }

        res.send("Appointment deleted successfully");
    });
});

// Route to search appointments by date or status
router.get('/searchappointment', (req, res) => {
    const { term } = req.query;
    const query = `
        SELECT * FROM appointments 
        WHERE appointment_date LIKE ? OR status LIKE ?
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
    const validKeywords = ['appointment_date', 'status']; // Add valid column names here
    if (!validKeywords.includes(keyword)) {
        return res.status(400).json({ "Status": "Error", "Message": "Invalid keyword" });
    }

    pool.query(`SELECT * FROM appointments WHERE ?? = ? ORDER BY appointment_id ${validSort}`, [keyword, keyvalue], (err, result, fields) => {
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