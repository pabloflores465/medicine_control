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
    const { name, description, image, imageContentType, frequency, startTime } =
      req.body;

    if (!name || !frequency || !startTime) {
      res
        .status(400)
        .json({ message: "Name, frequency, and start time are required" });
      return;
    }

    const medicine = new Medicine({
      userId: req.userId,
      name,
      description,
      image,
      imageContentType,
      frequency,
      startTime: new Date(startTime),
      doses: [],
    });

    // Generate initial doses for the next 30 days
    const startDate = new Date(startTime);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

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
      startTime,
      active,
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
    if (image) medicine.image = image;
    if (imageContentType) medicine.imageContentType = imageContentType;
    if (frequency) medicine.frequency = frequency;
    if (startTime) medicine.startTime = new Date(startTime);
    if (active !== undefined) medicine.active = active;

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
      const { doseIndex } = req.body;

      const medicine = await Medicine.findOne({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!medicine) {
        res.status(404).json({ message: "Medicine not found" });
        return;
      }

      const now = new Date();
      let takenTime = now;

      if (doseIndex !== undefined && medicine.doses[doseIndex]) {
        medicine.doses[doseIndex].taken = true;
        medicine.doses[doseIndex].takenAt = now;
        takenTime = now;
      } else {
        // Find the next pending dose and mark it as taken
        const pendingDose = medicine.doses.find(
          (d) => !d.taken && new Date(d.scheduledTime) <= now
        );
        if (pendingDose) {
          pendingDose.taken = true;
          pendingDose.takenAt = now;
          takenTime = now;
        } else {
          // If no pending dose, mark the next future dose as taken
          const nextDose = medicine.doses.find(
            (d) => !d.taken && new Date(d.scheduledTime) > now
          );
          if (nextDose) {
            nextDose.taken = true;
            nextDose.takenAt = now;
            takenTime = now;
          }
        }
      }

      // Recalculate future doses based on when the dose was taken
      // Remove all future untaken doses
      medicine.doses = medicine.doses.filter(
        (d) => d.taken || new Date(d.scheduledTime) <= now
      );

      // Generate new doses starting from takenTime + frequency
      const frequencyMs = medicine.frequency * 60 * 60 * 1000;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      let nextDoseTime = new Date(takenTime.getTime() + frequencyMs);

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
