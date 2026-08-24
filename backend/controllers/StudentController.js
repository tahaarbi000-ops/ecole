const { validationResult, body } = require("express-validator");
const Student = require("../models/Student");
const { Subscription } = require("../models");

exports.createStudent = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required."),

    body("last_name")
        .trim()
        .notEmpty()
        .withMessage("Last name is required."),

    body("father_name")
        .optional()
        .trim(),

    body("mother_name")
        .optional()
        .trim(),

    body("father_phone")
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^\d{8}$/)
        .withMessage("Invalid father phone number."),

    body("mother_phone")
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^\d{8}$/)
        .withMessage("Invalid mother phone number."),

    body("gender")
        .isIn(["garçon", "fille"])
        .withMessage("Gender must be M or F."),

    body("birthday")
        .notEmpty()
        .withMessage("Date of birth is required.")
        .isISO8601()
        .withMessage("Invalid date of birth."),

    body("classe")
        .trim()
        .notEmpty()
        .withMessage("Class is required."),

    body("address")
        .trim()
        .notEmpty()
        .withMessage("Address is required."),

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
                father_name,
                mother_name,
                father_phone,
                mother_phone,
                address,
                classe,
                gender,
                birthday
            } = req.body;
            console.log(classe)

            const student = await Student.create({
                name,
                last_name,
                father_name,
                mother_name,
                father_phone,
                mother_phone,
                gender,
                birthday,
                class:classe,
                address,
            });

            await Subscription.create({amount:50,student_id:student.id,transport:false})

            return res.status(201).json({
                message: "Student added successfully.",
                student,
            });

        } catch (error) {
            console.error("Create student error:", error);

            return res.status(500).json({
                message: "Server error.",
            });
        }
    }
];

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.findAll({
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            message: "Students retrieved successfully.",
            students,
        });

    } catch (error) {
        console.error("Get students error:", error);

        return res.status(500).json({
            message: "Server error.",
        });
    }
};