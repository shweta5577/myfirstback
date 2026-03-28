const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

const signup = async (req, res) => {
  try {
    const { name, email, password, role, preferredLanguage } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "patient",
      preferredLanguage: preferredLanguage || "en"
    });

    const token = signToken(user);
    return res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name, 
        email, 
        role: user.role,
        patientCode: user.patientCode || null
      } 
    });
  } catch (error) {
    return res.status(400).json({ message: "Signup failed", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

const listPatients = async (req, res) => {
  const patients = await User.find({ role: "patient" }).select("name email preferredLanguage").sort({ name: 1 });
  return res.json(patients);
};

module.exports = {
  signup,
  login,
  me,
  listPatients
};
