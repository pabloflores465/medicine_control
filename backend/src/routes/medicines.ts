import { Router, Response } from "express";
import Medicine from "../models/Medicine";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all medicines for user
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const medicines = await Medicine.find({
      userId: req.userId,
      active: true,
    }).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single medicine
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!medicine) {
      res.status(404).json({ message: "Medicine not found" });
      return;
    }
    res.json(medicine);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create medicine
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      image,
      imageContentType,
      frequency,
      startTime,
      durationDays,
    } = req.body;

    if (!name || !frequency || !startTime) {
      res
        .status(400)
        .json({ message: "Name, frequency, and start time are required" });
      return;
    }

    const duration = durationDays || 30;

    const medicine = new Medicine({
      userId: req.userId,
      name,
      description,
      image,
      imageContentType,
      frequency,
      durationDays: duration,
      startTime: new Date(startTime),
      doses: [],
    });

    // Generate initial doses for the specified duration
    const startDate = new Date(startTime);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    let currentDose = new Date(startDate);
    const frequencyMs = frequency * 60 * 60 * 1000;

    while (currentDose <= endDate) {
      medicine.doses.push({
        scheduledTime: new Date(currentDose),
        taken: false,
      });
      currentDose = new Date(currentDose.getTime() + frequencyMs);
    }

    await medicine.save();
    res.status(201).json(medicine);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update medicine
router.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      image,
      imageContentType,
      frequency,
      durationDays,
      startTime,
      active,
      regenerateDoses,
    } = req.body;

    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!medicine) {
      res.status(404).json({ message: "Medicine not found" });
      return;
    }

    if (name) medicine.name = name;
    if (description !== undefined) medicine.description = description;
    if (image !== undefined) medicine.image = image;
    if (imageContentType !== undefined)
      medicine.imageContentType = imageContentType;
    if (frequency) medicine.frequency = frequency;
    if (durationDays) medicine.durationDays = durationDays;
    if (startTime) medicine.startTime = new Date(startTime);
    if (active !== undefined) medicine.active = active;

    // Regenerate doses if requested or if frequency/startTime/durationDays changed
    if (regenerateDoses) {
      // Keep only taken doses
      const takenDoses = medicine.doses.filter((d) => d.taken);

      // Generate new doses from now
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (medicine.durationDays || 30));

      const frequencyMs = medicine.frequency * 60 * 60 * 1000;
      let nextDoseTime = new Date(now.getTime() + frequencyMs);

      const newDoses: { scheduledTime: Date; taken: boolean }[] = [];
      while (nextDoseTime <= endDate) {
        newDoses.push({
          scheduledTime: new Date(nextDoseTime),
          taken: false,
        });
        nextDoseTime = new Date(nextDoseTime.getTime() + frequencyMs);
      }

      medicine.doses = [...takenDoses, ...newDoses];
      medicine.doses.sort(
        (a, b) =>
          new Date(a.scheduledTime).getTime() -
          new Date(b.scheduledTime).getTime()
      );
    }

    await medicine.save();
    res.json(medicine);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Mark dose as taken and recalculate future doses
router.post(
  "/:id/take",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const medicine = await Medicine.findOne({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!medicine) {
        res.status(404).json({ message: "Medicine not found" });
        return;
      }

      const now = new Date();

      // Mark ALL pending/past doses as taken (not just one)
      const pendingDoses = medicine.doses.filter(
        (d) => !d.taken && new Date(d.scheduledTime) <= now
      );

      if (pendingDoses.length > 0) {
        // Mark all pending doses as taken
        pendingDoses.forEach((dose) => {
          dose.taken = true;
          dose.takenAt = now;
        });
      } else {
        // If no pending dose, mark the next future dose as taken
        const nextDose = medicine.doses.find(
          (d) => !d.taken && new Date(d.scheduledTime) > now
        );
        if (nextDose) {
          nextDose.taken = true;
          nextDose.takenAt = now;
        }
      }

      // Recalculate future doses based on current time
      // Remove all future untaken doses
      medicine.doses = medicine.doses.filter(
        (d) => d.taken || new Date(d.scheduledTime) <= now
      );

      // Generate new doses starting from now + frequency
      const frequencyMs = medicine.frequency * 60 * 60 * 1000;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      let nextDoseTime = new Date(now.getTime() + frequencyMs);

      while (nextDoseTime <= endDate) {
        medicine.doses.push({
          scheduledTime: new Date(nextDoseTime),
          taken: false,
        });
        nextDoseTime = new Date(nextDoseTime.getTime() + frequencyMs);
      }

      // Sort doses by scheduled time
      medicine.doses.sort(
        (a, b) =>
          new Date(a.scheduledTime).getTime() -
          new Date(b.scheduledTime).getTime()
      );

      await medicine.save();
      res.json(medicine);
    } catch (error: any) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Get calendar data
router.get(
  "/calendar/data",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { month, year } = req.query;

      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

      const medicines = await Medicine.find({
        userId: req.userId,
        active: true,
      });

      const calendarData: any[] = [];

      medicines.forEach((medicine) => {
        medicine.doses.forEach((dose) => {
          const doseDate = new Date(dose.scheduledTime);
          if (doseDate >= startDate && doseDate <= endDate) {
            calendarData.push({
              medicineId: medicine._id,
              medicineName: medicine.name,
              medicineImage: medicine.image,
              scheduledTime: dose.scheduledTime,
              taken: dose.taken,
              takenAt: dose.takenAt,
            });
          }
        });
      });

      res.json(calendarData);
    } catch (error: any) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Delete medicine (soft delete)
router.delete(
  "/:id",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const medicine = await Medicine.findOne({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!medicine) {
        res.status(404).json({ message: "Medicine not found" });
        return;
      }

      medicine.active = false;
      await medicine.save();
      res.json({ message: "Medicine deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

export default router;
