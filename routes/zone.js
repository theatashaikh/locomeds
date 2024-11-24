const router = require("express").Router();

const auth = require("../middlewares/auth");
const Zone = require("../models/zoneModel");

// Add a new zone
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Admin has the permission" });
    }

    const { state, district, city, zoneName } = req.body;

    if (!state || !district || !city || !zoneName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the zone already exists
    const existingZone = await Zone.findOne({
      state,
      district,
      city,
      zoneName,
    });
    if (existingZone) {
      return res.status(400).json({ message: "Zone already exists" });
    }

    const newZone = new Zone({ state, district, city, zoneName });
    await newZone.save();
    res.json({ message: "Zone added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all zones
router.get("/zones/all", async (req, res) => {
  try {
    const zones = await Zone.find();
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a zone by id
router.get("/:id", async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a zone
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Admin has the permission" });
    }
    const { state, district, city, zoneName } = req.body;

    if (!state || !district || !city || !zoneName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the zone already exists
    const existingZone = await Zone.findOne({
      state,
      district,
      city,
      zoneName,
    });

    if (existingZone) {
      return res.status(400).json({ message: "Zone already exists" });
    }

    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }

    zone.state = state;
    zone.district = district;
    zone.city = city;
    zone.zoneName = zoneName;

    await zone.save();
    res.json({ message: "Zone updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// delete a zone
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Admin has the permission" });
    }
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }
    res.json({ message: "Zone deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
