const express = require("express");
const router = express.Router();
const Church = require("../models/ChurchsCredential");
const multer = require("multer");
const path = require("path");

// === Multer configuration for event images ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/events");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// === Add new event ===
router.post("/church/:id/event", upload.array("images", 10), async (req, res) => {
  const { name, dates, timeFrom, timeTo, location, type } = req.body;

  if (!name || !dates || !timeFrom || !timeTo || !location || !type) {
    return res.status(400).json({ error: "Please fill all required fields including event type" });
  }

  const validTypes = ['معارض وحفلات', 'حديث روحي', 'أمسيات', 'حديث اجتماعي'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid event type. Must be one of: " + validTypes.join(', ') });
  }

  let parsedDates;
  try {
    parsedDates = JSON.parse(dates);
    if (!Array.isArray(parsedDates) || parsedDates.length === 0) {
      throw new Error("Dates must be a non-empty array");
    }
  } catch {
    return res.status(400).json({ error: "Invalid dates format. Must be JSON array" });
  }

  const images = req.files ? req.files.map(file => `/uploads/events/${file.filename}`) : [];

  try {
    const church = await Church.findById(req.params.id);
    if (!church) return res.status(404).json({ error: "Church not found" });

    const newEvent = { name, dates: parsedDates, timeFrom, timeTo, location, images, type };
    church.events.push(newEvent);
    await church.save();

    res.status(201).json({ message: "Event added successfully", event: newEvent });
  } catch (err) {
    console.error("Error adding event:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// === Delete specific event ===
router.delete("/church/:churchId/event/:eventId", async (req, res) => {
  try {
    const { churchId, eventId } = req.params;
    const church = await Church.findById(churchId);
    if (!church) return res.status(404).json({ error: "Church not found" });

    church.events = church.events.filter(ev => ev._id.toString() !== eventId);
    await church.save();

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// === Get all upcoming events ===
// router.get("/church/:id/events", async (req, res) => {
//   try {
//     const church = await Church.findById(req.params.id);
//     if (!church) return res.status(404).json({ error: "Church not found" });

//     // Remove expired events automatically
//     const now = new Date();
//     church.events = church.events.filter(ev =>
//       Array.isArray(ev.dates) &&
//       ev.dates.some(d => new Date(`${d} ${ev.timeTo || "23:59"}`) > now)
//     );
//     await church.save();

//     const formattedEvents = church.events.map(ev => ({
//       id: ev._id,
//       title: ev.name,
//       parish: church.name,
//       location: ev.location,
//       dateLabel: Array.isArray(ev.dates) ? ev.dates.join(", ") : ev.date || "",
//       timeLabel: ev.timeFrom && ev.timeTo ? `${ev.timeFrom} - ${ev.timeTo}` : ev.timeFrom || "",
//       imageUrl: ev.images?.[0] || "",
//     }));

//     res.status(200).json(formattedEvents);
//   } catch (err) {
//     console.error("Error fetching events:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

router.get("/", async (req, res) => {
  try {
    const churches = await Church.find({});
    const allEvents = [];
    const now = new Date();

    churches.forEach((church) => {
      if (Array.isArray(church.events)) {
        church.events.forEach((ev) => {
          // Filter out past dates
          const validDates = (ev.dates || []).filter((date) => {
            if (!date) return false;
            const dt = new Date(`${date}T${ev.timeFrom || "23:59"}:00`);
            return dt > now;
          });

          if (validDates.length === 0) return; // Skip event if all dates are past

          allEvents.push({
            id: ev._id,
            title: ev.name,
            parish: church.name,
            location: ev.location,
            dateLabel: validDates, // only upcoming dates
            timeLabel: ev.timeFrom && ev.timeTo ? `${ev.timeFrom} - ${ev.timeTo}` : ev.timeFrom || "",
            imageUrl: ev.image || "",
          });
        });
      }
    });

    res.status(200).json(allEvents);
  } catch (err) {
    console.error("Error fetching all events:", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;