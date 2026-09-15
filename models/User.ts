import mongoose, { type Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: {
    ru: string;
    en: string;
  };
  email: string;
  password: string;
  phone: string;
  position: {
    ru: string;
    en: string;
  };
  birthday: Date;
  avatar: string;
  role: "admin" | "worker";
  workerType?: "employee" | "top_manager";
  viewPermissions: "top_managers" | "employees" | "both";
  order_id: number;
  object_name: {
    ru: string;
    en: string;
  };
  hidden?: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      ru: {
        type: String,
        required: [true, "Russian name is required"],
        trim: true,
      },
      en: {
        type: String,
        required: [true, "English name is required"],
        trim: true,
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    position: {
      ru: {
        type: String,
        required: [true, "Russian position is required"],
        trim: true,
      },
      en: {
        type: String,
        required: [true, "English position is required"],
        trim: true,
      },
    },
    birthday: {
      type: Date,
      required: [true, "Birthday is required"],
    },
    avatar: {
      type: String,
      default: "/placeholder.svg?height=100&width=100",
      // Defense in depth: compressed avatars are ~50-100KB; this just blocks
      // anything that somehow bypassed the compression step from being stored.
      maxlength: 2_000_000,
    },
    role: {
      type: String,
      enum: ["admin", "worker"],
      default: "worker",
    },
    workerType: {
      type: String,
      enum: ["employee", "top_manager"],
      required: function (this: IUser) {
        return this.role === "worker";
      },
    },
    viewPermissions: {
      type: String,
      enum: ["top_managers", "employees", "both"],
      default: "both",
    },
    order_id: {
      type: Number,
      default: 0,
    },

    object_name: {
      ru: {
        type: String,
        required: [true, "Russian object name is required"],
        trim: true,
      },
      en: {
        type: String,
        required: [true, "English object name is required"],
        trim: true,
      },
    },
    hidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving - only if password is modified and not already hashed
UserSchema.pre("save", async function () {
  // Skip if password is not modified or if it's already a hash
  if (!this.isModified("password") || this.password.match(/^\$2[aby]\$/)) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
