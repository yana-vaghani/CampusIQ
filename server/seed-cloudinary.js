require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cloudinary = require('./config/cloudinary');
const db = require('./db/pool');

// Create a dummy PDF locally
const dummyPdfPath = path.join(__dirname, 'dummy.pdf');
fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n% Dummy PDF for testing Cloudinary upload.\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n195\n%%EOF');

// Create a dummy video locally (very small text file, cloudinary will handle it if we specify resource_type)
// Wait, a fake video might fail if Cloudinary validates the format. Let's just upload the PDF, and maybe a real small image as a "document".
// But we can just use the PDF for now, and insert dummy data with external links for videos if needed, or just insert the uploaded PDF multiple times.

async function seedCloudinary() {
    try {
        console.log("🚀 Uploading dummy PDF to Cloudinary...");
        
        // Upload PDF to Cloudinary as "raw" to prevent 401 Unauthorized errors
        const resultPdf = await cloudinary.uploader.upload(dummyPdfPath, {
            resource_type: "raw", 
            folder: "lms_content",
            public_id: "dummy_lecture_notes.pdf"
        });
        console.log("✅ Dummy PDF Uploaded! URL:", resultPdf.secure_url);

        // Upload another PDF
        const resultDoc = await cloudinary.uploader.upload(dummyPdfPath, {
            resource_type: "raw",
            folder: "lms_content",
            public_id: "dummy_assignment_doc.pdf"
        });
        console.log("✅ Dummy Doc Uploaded! URL:", resultDoc.secure_url);

        console.log("🚀 Inserting data into database...");
        
        // Let's make sure lms_content table is ready
        // First, check if there's a subject. If not, insert a dummy subject.
        const subjectRes = await db.query("SELECT id FROM subjects LIMIT 1");
        let subjectId;
        if (subjectRes.rows.length === 0) {
            console.log("No subjects found. Creating a dummy subject...");
            // Needs a teacher_id (user)
            const userRes = await db.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Dummy Teacher', 'teacher@test.com', 'hash', 'teacher') RETURNING id");
            const userId = userRes.rows[0].id;
            const newSubRes = await db.query("INSERT INTO subjects (name, code, teacher_id) VALUES ('Dummy Subject', 'DUM101', $1) RETURNING id", [userId]);
            subjectId = newSubRes.rows[0].id;
        } else {
            subjectId = subjectRes.rows[0].id;
        }

        // We will insert 3 dummy LMS records
        // 1. A PDF
        await db.query(`
            INSERT INTO lms_content (subject_id, title, file_url, original_filename, type) 
            VALUES ($1, $2, $3, $4, $5)
        `, [subjectId, "Introduction Lecture Notes", resultPdf.secure_url, "intro_notes.pdf", "pdf"]);

        // 2. A Docx (we use the same URL for simplicity, but type is docx)
        await db.query(`
            INSERT INTO lms_content (subject_id, title, file_url, original_filename, type) 
            VALUES ($1, $2, $3, $4, $5)
        `, [subjectId, "Project Guidelines", resultDoc.secure_url, "project_guidelines.pdf", "docx"]);

        // 3. A dummy video (using a public video URL since we can't easily generate a valid video file in code)
        await db.query(`
            INSERT INTO lms_content (subject_id, title, file_url, original_filename, type) 
            VALUES ($1, $2, $3, $4, $5)
        `, [subjectId, "Database Systems Basics", "https://res.cloudinary.com/demo/video/upload/v1684481358/docs/getting_started_cloudinary.mp4", "db_basics.mp4", "video"]);

        // Create pdfs table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS pdfs (
                id SERIAL PRIMARY KEY,
                url VARCHAR(500) NOT NULL,
                public_id VARCHAR(255) NOT NULL,
                user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert into pdfs table for ViewPdfs.jsx route
        await db.query(`
            INSERT INTO pdfs (url, public_id, user_id) 
            VALUES ($1, $2, $3)
        `, [resultPdf.secure_url, "dummy_lecture_notes", subjectId]);

        await db.query(`
            INSERT INTO pdfs (url, public_id, user_id) 
            VALUES ($1, $2, $3)
        `, [resultDoc.secure_url, "dummy_assignment_doc", subjectId]);

        console.log("🎉 Successfully seeded LMS Content and pdfs tables with Cloudinary URLs!");
        
        // Clean up the local dummy file
        fs.unlinkSync(dummyPdfPath);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding data:", error);
        process.exit(1);
    }
}

seedCloudinary();
