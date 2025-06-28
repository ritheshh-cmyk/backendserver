"use strict";
// @ts-nocheck
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { storage } = require('./storage.js');
const router = express.Router();
// Login endpoint
router.post('/login', (req, res) => {
    (async () => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }
            // Get user from storage
            const user = await storage.getUserByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            // For now, simple password comparison (in production, use bcrypt)
            if (user.password !== password) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            // Generate JWT token
            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    })().catch(error => {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    });
});
// Register endpoint
router.post('/register', (req, res) => {
    (async () => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }
            // Check if user already exists
            const existingUser = await storage.getUserByUsername(username);
            if (existingUser) {
                return res.status(409).json({ error: 'Username already exists' });
            }
            // Create new user
            const newUser = await storage.createUser({ username, password });
            res.status(201).json({
                message: 'User created successfully',
                user: {
                    id: newUser.id,
                    username: newUser.username
                }
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    })().catch(error => {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    });
});
module.exports = router;
