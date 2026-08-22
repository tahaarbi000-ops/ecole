const { validationResult, body } = require("express-validator");
const Employ = require("../models/Employ");

exports.createEmploys = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required."),

    body("last_name")
        .trim()
        .notEmpty()
        .withMessage("Last name is required."),

    body("phone")
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^\d{8}$/)
        .withMessage("Invalid phone number."),

    body("salary")
        .notEmpty()
        .withMessage("Salary is required.")
        .isNumeric()
        .withMessage("Salary must be a number.")
        .custom((value) => {
            if (Number(value) < 0) {
                throw new Error("Salary cannot be negative.");
            }
            return true;
        }),

    body("date_deposited")
        .notEmpty()
        .withMessage("Deposit date is required.")
        .isISO8601()
        .withMessage("Invalid deposit date."),

    body("status")
        .isIn(["actif", "inactif", "en congé"])
        .withMessage("Invalid teacher status."),
    body("role")
        .isIn(["secrétaire","comptable","chauffeur","agent de nettoyage","agent de sécurité"])
        .withMessage("Invalid teacher status."),

    async (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: errors.array(),
                });
            }

            const {
                name,
                last_name,
                phone,
                salary,
                date_deposited,
                status,
                role
            } = req.body;

            const employ = await Employ.create({
                name,
                last_name,
                phone,
                salary,
                date_deposited,
                status,
                role
            });

            return res.status(201).json({
                message: "employs added successfully.",
                employ,
            });

        } catch (error) {
            console.error("Create teacher error:", error);

            return res.status(500).json({
                message: "Server error.",
            });
        }
    }
];

exports.getAllEmploys = async (req, res) => {
    try {
        const employs = await Employ.findAll({
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            message: "employs retrieved successfully.",
            employs,
        });

    } catch (error) {
        console.error("Get employs error:", error);

        return res.status(500).json({
            message: "Server error.",
        });
    }
};