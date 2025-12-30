import { Router, Request, Response } from "express";
import User from "../models/User";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// Register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }

    const user = new User({ email, password, name });
    await user.save();

    const token = generateToken((user._id as unknown as string).toString());

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken((user._id as unknown as string).toString());

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get current user
router.get(
  "/me",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.userId).select("-password");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

export default router;
