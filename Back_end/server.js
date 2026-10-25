require('dotenv').config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
//  DB CONNECTION
// ============================================================
const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "root123",
    database: "College_fest"
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    }
    console.log("Database connected!");
});

// ============================================================
//  TEST ROUTE
// ============================================================
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

// ============================================================
//  PARTICIPANT ROUTES
// ============================================================

// Get all participants
app.get("/participants", (req, res) => {
    db.query("SELECT * FROM Participant", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get single participant by ID
app.get("/participants/:id", (req, res) => {
    db.query("SELECT * FROM Participant WHERE participant_id = ?",
        [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ message: "Participant not found" });
            res.json(results[0]);
        });
});

// Add new participant
app.post("/participants", (req, res) => {
    const { name, contact_info } = req.body;
    if (!name || !contact_info)
        return res.status(400).json({ error: "Name and contact info are required!" });
    db.query("INSERT INTO Participant (name, contact_info) VALUES (?, ?)",
        [name, contact_info], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Participant added!", id: result.insertId });
        });
});

// Update participant
app.put("/participants/:id", (req, res) => {
    const { name, contact_info } = req.body;
    db.query("UPDATE Participant SET name = ?, contact_info = ? WHERE participant_id = ?",
        [name, contact_info, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Participant updated!" });
        });
});

// Delete participant
app.delete("/participants/:id", (req, res) => {
    const pId = req.params.id;
    // Delete Certificates
    db.query("DELETE FROM Certificate WHERE participant_id = ?", [pId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Delete Payments linked to Registrations
        db.query("DELETE FROM Payment WHERE registration_id IN (SELECT registration_id FROM Registration WHERE participant_id = ?)", [pId], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Delete Registrations
            db.query("DELETE FROM Registration WHERE participant_id = ?", [pId], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                // Finally Delete Participant
                db.query("DELETE FROM Participant WHERE participant_id = ?", [pId], (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: "Participant and all related data deleted!" });
                });
            });
        });
    });
});


//  FESTEVENT ROUTES


// Get all events
app.get("/events", (req, res) => {
    db.query("SELECT * FROM FestEvent", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get single event by ID
app.get("/events/:id", (req, res) => {
    db.query("SELECT * FROM FestEvent WHERE event_id = ?",
        [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ message: "Event not found" });
            res.json(results[0]);
        });
});

// Add new event
app.post("/events", (req, res) => {
    const { event_name, event_date, event_time, venue, committee_id } = req.body;
    if (!event_name || !event_date || !event_time || !venue)
        return res.status(400).json({ error: "All event fields are required!" });
    db.query("INSERT INTO FestEvent (event_name, event_date, event_time, venue, committee_id) VALUES (?, ?, ?, ?, ?)",
        [event_name, event_date, event_time, venue, committee_id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Event added!", id: result.insertId });
        });
});

// Update event
app.put("/events/:id", (req, res) => {
    const { event_name, event_date, event_time, venue, committee_id } = req.body;
    db.query("UPDATE FestEvent SET event_name=?, event_date=?, event_time=?, venue=?, committee_id=? WHERE event_id=?",
        [event_name, event_date, event_time, venue, committee_id, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Event updated!" });
        });
});

// Delete event
app.delete("/events/:id", (req, res) => {
    db.query("DELETE FROM FestEvent WHERE event_id = ?",
        [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Event deleted!" });
        });
});

// ============================================================
//  COMMITTEE ROUTES
// ============================================================

// Get all committees
app.get("/committees", (req, res) => {
    db.query("SELECT * FROM Committee", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add new committee
app.post("/committees", (req, res) => {
    const { head_name, email, phone_number, team_dept, members_name } = req.body;
    if (!head_name || !email)
        return res.status(400).json({ error: "Head name and email are required!" });
    db.query("INSERT INTO Committee (head_name, email, phone_number, team_dept, members_name) VALUES (?, ?, ?, ?, ?)",
        [head_name, email, phone_number, team_dept, members_name], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Committee added!", id: result.insertId });
        });
});

// ============================================================
//  REGISTRATION ROUTES
// ============================================================

// Get all registrations
app.get("/registrations", (req, res) => {
    const query = `
        SELECT r.*, p.name AS participant_name, e.event_name 
        FROM Registration r
        LEFT JOIN Participant p ON r.participant_id = p.participant_id
        LEFT JOIN FestEvent e ON r.event_id = e.event_id
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get registrations by participant
app.get("/registrations/participant/:id", (req, res) => {
    db.query("SELECT * FROM Registration WHERE participant_id = ?",
        [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
});

// Add new registration
app.post("/registrations", (req, res) => {
    const { participant_id, event_id, registration_date, team_name } = req.body;
    if (!participant_id || !event_id)
        return res.status(400).json({ error: "Participant ID and Event ID are required!" });
    db.query("INSERT INTO Registration (participant_id, event_id, registration_date, registration_status, team_name) VALUES (?, ?, ?, 'Pending', ?)",
        [participant_id, event_id, registration_date, team_name], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Registered successfully!", id: result.insertId });
        });
});

// Update registration status
app.put("/registrations/:id", (req, res) => {
    const { registration_status } = req.body;
    db.query("UPDATE Registration SET registration_status = ? WHERE registration_id = ?",
        [registration_status, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Registration status updated!" });
        });
});

// Delete registration
app.delete("/registrations/:id", (req, res) => {
    const rId = req.params.id;
    // First delete associated payments
    db.query("DELETE FROM Payment WHERE registration_id = ?", [rId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Then delete the registration
        db.query("DELETE FROM Registration WHERE registration_id = ?", [rId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Registration deleted!" });
        });
    });
});

// ============================================================
//  PAYMENT ROUTES
// ============================================================

// Get all payments
app.get("/payments", (req, res) => {
    db.query("SELECT * FROM Payment", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add new payment
app.post("/payments", (req, res) => {
    const { registration_id, amount, payment_date, payment_method } = req.body;
    if (!registration_id || !amount)
        return res.status(400).json({ error: "Registration ID and amount are required!" });
    db.query("INSERT INTO Payment (registration_id, amount, payment_date, payment_status, payment_method) VALUES (?, ?, ?, 'Pending', ?)",
        [registration_id, amount, payment_date, payment_method], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Payment added!", id: result.insertId });
        });
});

// Update payment status
app.put("/payments/:id", (req, res) => {
    const { payment_status } = req.body;

    // Step 1 — Update payment status
    db.query("UPDATE Payment SET payment_status = ? WHERE payment_id = ?",
        [payment_status, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Step 2 — If Completed, auto generate certificate
            if (payment_status === 'Completed') {

                // Get registration details from this payment
                db.query(`
                SELECT r.participant_id, r.event_id 
                FROM Payment p 
                JOIN Registration r ON p.registration_id = r.registration_id 
                WHERE p.payment_id = ?`,
                    [req.params.id], (err, results) => {
                        if (err || results.length === 0) {
                            console.log("Could not find registration for payment:", req.params.id);
                            return;
                        }

                        const { participant_id, event_id } = results[0];
                        console.log("Generating certificate for participant:", participant_id, "event:", event_id);

                        // Get event name
                        db.query("SELECT event_name FROM FestEvent WHERE event_id = ?",
                            [event_id], (err, eventResults) => {
                                if (err || eventResults.length === 0) {
                                    console.log("Event not found:", event_id);
                                    return;
                                }

                                const event_name = eventResults[0].event_name;

                                // Check if certificate already exists
                                db.query("SELECT * FROM Certificate WHERE participant_id = ? AND event_id = ?",
                                    [participant_id, event_id], (err, existing) => {
                                        if (existing && existing.length > 0) {
                                            console.log("Certificate already exists!");
                                            return;
                                        }

                                        // Insert certificate
                                        db.query(`INSERT INTO Certificate (participant_id, event_id, certificate_details) 
                                  VALUES (?, ?, ?)`,
                                            [participant_id, event_id,
                                                `This certifies participation in ${event_name}`],
                                            (err) => {
                                                if (err) console.log("Certificate error:", err.message);
                                                else console.log("✅ Certificate auto generated for", event_name);
                                            });
                                    });
                            });
                    });
            }

            res.json({ message: "Payment status updated!" });
        });
});
// ============================================================
//  CERTIFICATE ROUTES
// ============================================================

// Get all certificates
app.get("/certificates", (req, res) => {
    db.query("SELECT * FROM Certificate", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get certificate by participant
app.get("/certificates/participant/:id", (req, res) => {
    db.query("SELECT * FROM Certificate WHERE participant_id = ?",
        [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
});

// Add new certificate
app.post("/certificates", (req, res) => {
    const { participant_id, event_id, certificate_details } = req.body;
    if (!participant_id || !event_id)
        return res.status(400).json({ error: "Participant ID and Event ID are required!" });
    db.query("INSERT INTO Certificate (participant_id, event_id, certificate_details) VALUES (?, ?, ?)",
        [participant_id, event_id, certificate_details], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Certificate added!", id: result.insertId });
        });
});

// ============================================================
//  JUDGE ROUTES
// ============================================================

// Get all judges
app.get("/judges", (req, res) => {
    db.query("SELECT * FROM Judge", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add new judge
app.post("/judges", (req, res) => {
    const { name, contact_info } = req.body;
    if (!name || !contact_info)
        return res.status(400).json({ error: "Name and contact info are required!" });
    db.query("INSERT INTO Judge (name, contact_info) VALUES (?, ?)",
        [name, contact_info], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Judge added!", id: result.insertId });
        });
});

// ============================================================
//  SPONSOR ROUTES
// ============================================================

// Get all sponsors
app.get("/sponsors", (req, res) => {
    db.query("SELECT * FROM Sponsor", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add new sponsor
app.post("/sponsors", (req, res) => {
    const { name, contact_info } = req.body;
    if (!name)
        return res.status(400).json({ error: "Sponsor name is required!" });
    db.query("INSERT INTO Sponsor (name, contact_info) VALUES (?, ?)",
        [name, contact_info], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Sponsor added!", id: result.insertId });
        });
});

// ============================================================
//  SERVER START  —  ALWAYS AT THE BOTTOM
// ============================================================
app.listen(5000, () => {
    console.log("Server running on port 5000");
});