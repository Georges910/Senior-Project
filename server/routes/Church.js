const express = require("express");
const router = express.Router();
const Church = require("../models/ChurchsCredential");
const multer = require("multer");
const path = require("path");

// === Multer configuration for church images ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/churches");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// === Helper to clean expired schedules ===
function cleanPastPrayers(church) {
  const now = new Date();
  church.schedules = church.schedules.filter((sch) => {
    if (!sch.date || !sch.time) return true;
    const dt = new Date(`${sch.date}T${sch.time}:00`);
    return dt > now;
  });
}

// === Add / update church info ===
router.post("/add", upload.array("images", 10), async (req, res) => {
  const { name, location, about, admins } = req.body;
  const images = req.files ? req.files.map((file) => `/uploads/churches/${file.filename}`) : [];

  try {
    let church = await Church.findOne({ name });
    if (church) {
      church.location = location || church.location;
      church.about = about || church.about;
      church.admins = Array.isArray(admins) ? admins : []; // <-- fix here
      church.images = images.length > 0 ? images : church.images;
      await church.save();
      return res.status(200).json({ message: "Church updated", church });
    } else {
      church = new Church({
        name,
        location,
        about,
        admins: Array.isArray(admins) ? admins : [], // <-- fix here
        images,
      });
      await church.save();
      return res.status(201).json({ message: "Church added", church });
    }
  } catch (err) {
    console.error("Error adding/updating church:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// === GET assigned churches by admin name ===
router.get("/assigned/:admin", async (req, res) => {
  try {
    const adminName = decodeURIComponent(req.params.admin).trim();

    // Find churches assigned to this admin (case-insensitive)
    const churches = await Church.find({
      admins: { $regex: new RegExp(adminName, "i") },
    });

    if (!churches.length) {
      return res.status(404).json({ message: "No church assigned to this admin." });
    }

    // Clean old schedules
    const now = new Date();
    churches.forEach((church) => {
      church.schedules = (church.schedules || []).filter((sch) => {
        if (!sch.date || !sch.time) return true;
        const dt = new Date(`${sch.date}T${sch.time}:00`);
        return dt > now;
      });
    });

    res.status(200).json({ churches });
  } catch (err) {
    console.error("Error fetching assigned churches:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// === Get schedule of a specific church ===
router.get("/:churchId/schedule", async (req, res) => {
  try {
    const { churchId } = req.params;
    const church = await Church.findOne({ name: churchId });

    if (!church) {
      return res.status(404).json({ error: "Church not found" });
    }

    // Clean old schedules
    const now = new Date();
    const validSchedules = (church.schedules || []).filter((sch) => {
      if (!sch.date || !sch.time) return true;
      const dt = new Date(`${sch.date}T${sch.time}:00`);
      return dt > now;
    });

    res.status(200).json({
      churchName: church.name,
      schedules: validSchedules,
    });
  } catch (err) {
    console.error("Error fetching church schedule:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// === PATCH church info (update schedules, events, images, location, about) ===
router.patch("/ekklesia/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // schedules, events, images, location, about

    const church = await Church.findById(id);
    if (!church) return res.status(404).json({ error: "Church not found" });

    if (updateData.schedules) church.schedules = updateData.schedules;
    if (updateData.events) church.events = updateData.events;
    if (updateData.images) church.images = updateData.images;
    if (updateData.location) church.location = updateData.location;
    if (updateData.about) church.about = updateData.about;

    await church.save();
    res.status(200).json({ message: "Church updated successfully", church });
  } catch (err) {
    console.error("Error patching church:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all churches
router.get("/churches", async (req, res) => {
  try {
    const churches = await Church.find({});
    res.status(200).json({ churches });
  } catch (err) {
    console.error("Error fetching churches:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// === Delete specific church image ===
router.delete("/:id/image", async (req, res) => {
  try {
    const { imagePath } = req.body;
    const church = await Church.findById(req.params.id);
    if (!church) return res.status(404).json({ error: "Church not found" });

    church.images = church.images.filter((img) => img !== imagePath);
    await church.save();

    res.status(200).json({ message: "Image deleted successfully", images: church.images });
  } catch (err) {
    console.error("Error deleting church image:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

