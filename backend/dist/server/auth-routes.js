"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const storage_1 = require("./storage");
const router = express_1.default.Router();
router.post('/login', (req, res) => {
    (async () => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const user = await storage_1.storage.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        let isValidPassword = false;
        if (user.password === password) {
            isValidPassword = true;
        }
        else {
            try {
                isValidPassword = await bcryptjs_1.default.compare(password, user.password);
            }
            catch (error) {
                console.error('Bcrypt comparison error:', error);
                isValidPassword = false;
            }
        }
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });
    })().catch(error => {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    });
});
router.post('/register', (req, res) => {
    (async () => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const existingUser = await storage_1.storage.getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await storage_1.storage.createUser({ username, password: hashedPassword });
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username
            }
        });
    })().catch(error => {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    });
});
exports.default = router;
//# sourceMappingURL=auth-routes.js.map