import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const logAuthError = (type, error) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${type}: ${error.message}\n${error.stack}\n\n`;
    try {
        fs.appendFileSync('auth-error.log', logMsg);
    } catch (e) {
        console.error('Failed to write to auth-error.log');
    }
    console.error(`[${timestamp}] ${type}:`, error);
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

export const signup = async (req, res) => {
    try {
        const { email, password, businessName, name } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({
            email,
            password,
            businessName: businessName || name || 'My Business',
            name: name || businessName
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            businessName: user.businessName,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        logAuthError('Signup Error', error);
        res.status(500).json({
            message: 'Signup failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                businessName: user.businessName,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        logAuthError('Signin Error', error);
        res.status(500).json({ message: 'Signin failed', error: error.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        logAuthError('GetMe Error', error);
        res.status(500).json({ message: 'Profile fetch failed', error: error.message });
    }
};
