import mongoose, { type Document, Schema } from "mongoose"

export interface IRole extends Document {
  name: string
  permissions: string[]
  description: string
  createdAt: Date
  updatedAt: Date
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
    },
    permissions: [
      {
        type: String,
        required: true,
      },
    ],
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema)
