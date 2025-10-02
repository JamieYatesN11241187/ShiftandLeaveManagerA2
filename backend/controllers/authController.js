const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createUserAccount } = require('../models/UserAccount');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { name, email, password, role, dob } = req.body;
    const user = new User({
        name,
        email,
        password,
        role,
        dob
    });
    try {
        const userAccount = createUserAccount(user);
        if (userAccount.getAge() < 14) {
            return res.status(400).json({ message: 'Apologies, but you are too young to work under Australian Compliance' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });
        await user.save();
        res.status(201).json(userAccount.getProfile());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            const userAccount = createUserAccount(user);
            res.status(200).json({ ...userAccount.getProfile(), token: generateToken(user.id) });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userAccount = createUserAccount(user);
        res.status(200).json(userAccount.getProfile());
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, email, role } = req.body;
        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;
        const updatedUser = await user.save();
        const userAccount = createUserAccount(updatedUser);
        res.json({ ...userAccount.getProfile(), token: generateToken(updatedUser.id) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['manager', 'worker'] } });
        const userAccounts = users.map(createUserAccount);
        res.json(userAccounts.map(u => u.getProfile()));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, updateUserProfile, getProfile, getAllUsers };