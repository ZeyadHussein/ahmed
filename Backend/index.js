const express = require('express');
const cors = require('cors'); // Import CORS
const app = express();
const userRoute = require('./Routes/userRoute'); // Ensure this path is correct
const propertyRoute = require('./Routes/propertyRoute');
const paymentRoute = require('./Routes/paymentRoute');
const agentRoute = require('./Routes/agentRoute');
const appointmentRoute = require('./Routes/appointmentRoute');

// Enable CORS for all origins (or specify only the origin you want to allow)
app.use(cors()); // This will allow all domains to access your backend

app.use(express.json()); // Middleware to parse JSON body

app.use('/api', userRoute); // Ensure this line is present
app.use('/api', propertyRoute); 
app.use('/api', paymentRoute);
app.use('/api', agentRoute);
app.use('/api', appointmentRoute);

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
