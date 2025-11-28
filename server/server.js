// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = "supersecretkey123"; // In production, use .env!

app.use(cors());
app.use(express.json());

// --- MONGODB CONNECT ---
// Use environment variable for DB or fallback to local
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sentimentDB';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB Error:', err));

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const analysisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to user
    text: String,
    sentiment: String,
    polarity: Number,
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Analysis = mongoose.model('Analysis', analysisSchema);

// --- MIDDLEWARE: Protect Routes ---
const auth = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: "Access Denied" });

    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid Token" });
    }
};

// --- ROUTES ---

// 1. REGISTER
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered!" });
    } catch (err) {
        res.status(400).json({ error: "Username already exists" });
    }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "User not found" });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: "Invalid password" });

        // Create Token
        const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// 3. ANALYZE (Protected)
app.post('/api/analyze', auth, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text required" });

    try {
        // Call Python Service
        // Use Env variable for Python URL in production
        const pythonUrl = process.env.PYTHON_URL || 'http://127.0.0.1:8000/predict';
        const mlResponse = await axios.post(pythonUrl, { text });
        const { sentiment, polarity } = mlResponse.data;

        const newRecord = new Analysis({ 
            userId: req.user._id, // Save against the specific user
            text, sentiment, polarity 
        });
        await newRecord.save();
        res.json(newRecord);
    } catch (error) {
        console.error("ML Service Error:", error.message);
        res.status(500).json({ error: "Analysis failed" });
    }
});

// 4. HISTORY (Protected - Only get MY history)
app.get('/api/history', auth, async (req, res) => {
    try {
        const history = await Analysis.find({ userId: req.user._id }) // Filter by User ID
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Error fetching history" });
    }
});

app.listen(PORT, () => console.log(`🚀 Node Server running on port ${PORT}`));