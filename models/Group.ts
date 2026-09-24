import mongoose, { type Document, Schema } from "mongoose";

export interface IGroup extends Document {
  id: string;
  label: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    id: {
      type: String,
      required: [true, "Group ID is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: [true, "Group label is required"],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Group ||
  mongoose.model<IGroup>("Group", GroupSchema);
