const { validationResult, body } = require("express-validator");
const User = require("../models/Users");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

exports.login = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
    , async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        try {
            const { email, password } = req.body;

            const user = await User.findOne({
                where: { email }
            });

            if (!user) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                },
                process.env.JWT_SECRET
            );

            return res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                }
            });
            return res.status(200).json({
                message: "Login successful"
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Server error"
            });
        }
    }]