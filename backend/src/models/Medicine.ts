import mongoose, { Document, Schema } from "mongoose";

export interface IDose {
  scheduledTime: Date;
  takenAt?: Date;
  taken: boolean;
}

export interface IMedicine extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  image?: string; // Base64 encoded image (blob)
  imageContentType?: string;
  frequency: number; // Hours between doses
  durationDays: number; // Number of days to take the medicine
  startTime: Date; // When the first dose was/should be taken
  doses: IDose[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doseSchema = new Schema<IDose>({
  scheduledTime: {
    type: Date,
    required: true,
  },
  takenAt: {
    type: Date,
  },
  taken: {
    type: Boolean,
    default: false,
  },
});

const medicineSchema = new Schema<IMedicine>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String, // Base64 string for blob storage
  },
  imageContentType: {
    type: String,
  },
  frequency: {
    type: Number,
    required: true,
    min: 1, // Minimum 1 hour
  },
  durationDays: {
    type: Number,
    required: true,
    default: 30,
    min: 1,
  },
  startTime: {
    type: Date,
    required: true,
  },
  doses: [doseSchema],
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
medicineSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Calculate next dose time
medicineSchema.methods.getNextDoseTime = function (): Date {
  const now = new Date();
  const startTime = new Date(this.startTime);
  const frequencyMs = this.frequency * 60 * 60 * 1000;

  let nextDose = new Date(startTime);
  while (nextDose <= now) {
    nextDose = new Date(nextDose.getTime() + frequencyMs);
  }

  return nextDose;
};

export default mongoose.model<IMedicine>("Medicine", medicineSchema);
