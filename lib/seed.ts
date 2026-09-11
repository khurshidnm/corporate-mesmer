import connectDB from "./mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  try {
    await connectDB();

    // Only bootstrap default accounts on a truly empty database, otherwise
    // deleting a seeded user from the panel would recreate it on next login.
    const totalUsers = await User.countDocuments({});
    if (totalUsers === 0) {
      await bootstrapDefaultUsers();
    }

    await migrateUserFields();

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

async function bootstrapDefaultUsers() {
  // Check if admin already exists
  const existingAdmin = await User.findOne({ email: "admin@mesmer.uz" });

  if (!existingAdmin) {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 12);

      await User.create({
        name: {
          ru: "Администратор",
          en: "Administrator",
        },
        email: "admin@mesmer.uz",
        password: hashedPassword,
        phone: "+998901234567",
        position: {
          ru: "Системный администратор",
          en: "System Administrator",
        },
        birthday: new Date("1990-01-01"),
        avatar: "/placeholder.svg?height=100&width=100",
        role: "admin",
        viewPermissions: "both",
        order_id: 0,
        object_name: {
          ru: "Главный офис",
          en: "Main Office",
        },
      });

      console.log("Admin user created successfully");
    }

    // Create sample worker users
    const sampleUsers = [
      {
        name: {
          ru: "Азамат Турсунбоев",
          en: "Azamat Tursunboyev",
        },
        email: "azamat@mesmer.uz",
        password: await bcrypt.hash("worker123", 12),
        phone: "+998901234568",
        position: {
          ru: "Топ менеджер",
          en: "Top Manager",
        },
        birthday: new Date("1985-03-15"),
        role: "worker",
        workerType: "top_manager",
        viewPermissions: "both",
        order_id: 1,
        object_name: {
          ru: "Отдел продаж",
          en: "Sales Department",
        },
      },
      {
        name: {
          ru: "Улугбек Мирзарахманов",
          en: "Ulugbek Mirzarakhmanov",
        },
        email: "ulugbek@mesmer.uz",
        password: await bcrypt.hash("worker123", 12),
        phone: "+998901234569",
        position: {
          ru: "Старший менеджер",
          en: "Senior Manager",
        },
        birthday: new Date("1988-07-22"),
        role: "worker",
        workerType: "top_manager",
        viewPermissions: "both",
        order_id: 2,
        object_name: {
          ru: "Отдел маркетинга",
          en: "Marketing Department",
        },
      },
      {
        name: {
          ru: "Фарход Каримов",
          en: "Farkhod Karimov",
        },
        email: "farkhod@mesmer.uz",
        password: await bcrypt.hash("worker123", 12),
        phone: "+998901234570",
        position: {
          ru: "Сотрудник",
          en: "Employee",
        },
        birthday: new Date("1992-11-08"),
        role: "worker",
        workerType: "employee",
        viewPermissions: "employees",
        order_id: 3,
        object_name: {
          ru: "Отдел разработки",
          en: "Development Department",
        },
      },
      {
        name: {
          ru: "Нигора Рахимова",
          en: "Nigora Rakhimova",
        },
        email: "nigora@mesmer.uz",
        password: await bcrypt.hash("worker123", 12),
        phone: "+998901234571",
        position: {
          ru: "Специалист",
          en: "Specialist",
        },
        birthday: new Date("1994-05-18"),
        role: "worker",
        workerType: "employee",
        viewPermissions: "employees",
        order_id: 4,
        object_name: {
          ru: "Отдел поддержки",
          en: "Support Department",
        },
      },
    ];

  // Create sample users if they don't exist
  for (const userData of sampleUsers) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      await User.create(userData);
      console.log(`User ${userData.email} created successfully`);
    }
  }
}

async function migrateUserFields() {
  // Cheap check first: skip the full scan entirely once data is migrated,
  // this ran a find({}) + N sequential updates on every single login before.
  const needsMigrationCount = await User.countDocuments({
    $or: [
      { name: { $type: "string" } },
      { position: { $type: "string" } },
      { object_name: { $type: "string" } },
      { viewPermissions: { $in: [null, undefined] } },
      { order_id: { $in: [null, undefined] } },
    ],
  });

  if (needsMigrationCount === 0) {
    return;
  }

  const existingUsers = await User.find({}).lean();
  const bulkOps: any[] = [];

  for (const user of existingUsers) {
      let needsUpdate = false;
      const updateData: any = {};

      // Check if name is still a string
      if (typeof user.name === "string") {
        updateData.name = {
          ru: user.name,
          en: user.name,
        };
        needsUpdate = true;
      }

      // Check if position is still a string
      if (typeof user.position === "string") {
        updateData.position = {
          ru: user.position,
          en: user.position,
        };
        needsUpdate = true;
      }

      // Check if object_name is still a string
      if (typeof user.object_name === "string") {
        updateData.object_name = {
          ru: user.object_name,
          en: user.object_name,
        };
        needsUpdate = true;
      }

      // Add missing fields
      if (!user.viewPermissions) {
        updateData.viewPermissions = "both";
        needsUpdate = true;
      }

      if (user.order_id === undefined || user.order_id === null) {
        updateData.order_id = 0;
        needsUpdate = true;
      }

    if (needsUpdate) {
      bulkOps.push({
        updateOne: {
          filter: { _id: user._id },
          update: { $set: updateData },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps);
    console.log(`Migrated ${bulkOps.length} user(s) with missing fields`);
  }
}
