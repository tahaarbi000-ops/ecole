const { validationResult, body } = require("express-validator");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");

exports.createTeacher = [
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

        body("matieres")
        .notEmpty()
        .withMessage("matieres date is required."),


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
                matieres
            } = req.body;
            console.log(matieres)

            const teacher = await Teacher.create({
                name,
                last_name,
                phone,
                salary,
                date_deposited,
                status,
            });
            for(const matiere of matieres){
                await Subject.create({label:matiere,teacher_id:teacher.id})
            }

            return res.status(201).json({
                message: "Teacher added successfully.",
                teacher,
            });

        } catch (error) {
            console.error("Create teacher error:", error);

            return res.status(500).json({
                message: "Server error.",
            });
        }
    }
];

exports.getAllTeacher = async (req, res) => {
    try {
        const teachers = await Teacher.findAll({
            order: [["createdAt", "DESC"]],
            include:[
                {
                    model:Subject,
                    as:"subject",
                    attributes:["label"]
                }
            ]
        });

        return res.status(200).json({
            message: "teachers retrieved successfully.",
            teachers,
        });

    } catch (error) {
        console.error("Get teachers error:", error);

        return res.status(500).json({
            message: "Server error.",
        });
    }
};