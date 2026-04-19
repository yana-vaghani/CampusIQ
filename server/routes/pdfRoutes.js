const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const db = require("../db/pool"); // your DB connection

const router = express.Router();

// store file temporarily
const upload = multer({ dest: "uploads/" });

// POST /api/upload-pdf
router.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        if (req.file.mimetype !== "application/pdf") {
            return res.status(400).json({ error: "Only PDF allowed" });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "raw", // "raw" prevents the 401 Error on Cloudinary for PDFs
            folder: "pdfs",
        });

        fs.unlinkSync(req.file.path);

        const userId = 1;

        await db.query(
            "INSERT INTO pdfs (url, public_id, user_id) VALUES ($1, $2, $3)",
            [result.secure_url, result.public_id, userId]
        );

        res.json({
            url: result.secure_url,
            public_id: result.public_id,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/pdfs", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM pdfs ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
