import mongoose, { type Document, Schema } from "mongoose";

export interface IAvatar extends Document {
  user: mongoose.Types.ObjectId;
  data: Buffer;
  contentType: string;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}

// Avatar bytes live in their own collection so that user list queries stay
// small. User.avatar only holds the versioned URL that points here.
const AvatarSchema = new Schema<IAvatar>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    // Short content hash; used as the URL version and ETag so browsers can
    // cache the image forever and still pick up replacements.
    hash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Avatar ||
  mongoose.model<IAvatar>("Avatar", AvatarSchema);
