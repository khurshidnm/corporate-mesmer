import { webcrypto } from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import sharp from "sharp";
import connectDB from "../lib/mongodb";
import User from "../models/User";
import Avatar from "../models/Avatar";
import { storeAvatar } from "../lib/avatar";

// Node 18 lacks the Web Crypto global the mongodb driver uses (see migrate-avatars)
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

// Dev-only: fills the LOCAL database with demo employees so the directory can
// be tested at realistic size. Refuses to touch anything but localhost.
//   pnpm seed-demo            add 100 demo users
//   pnpm seed-demo --remove   delete them again
const DEMO_DOMAIN = "demo.mesmer.uz";
const COUNT = 100;
const PASSWORD = "demo1234";

const FIRST = [
  ["Азиз", "Aziz", "m"], ["Бобур", "Bobur", "m"], ["Дилноза", "Dilnoza", "f"],
  ["Жасур", "Jasur", "m"], ["Камила", "Kamila", "f"], ["Лола", "Lola", "f"],
  ["Малика", "Malika", "f"], ["Нодир", "Nodir", "m"], ["Отабек", "Otabek", "m"],
  ["Рустам", "Rustam", "m"], ["Сардор", "Sardor", "m"], ["Тимур", "Timur", "m"],
  ["Умида", "Umida", "f"], ["Фаррух", "Farrukh", "m"], ["Шахзода", "Shahzoda", "f"],
  ["Элдор", "Eldor", "m"], ["Юлдуз", "Yulduz", "f"], ["Зарина", "Zarina", "f"],
  ["Гулнора", "Gulnora", "f"], ["Жавохир", "Javohir", "m"], ["Мадина", "Madina", "f"],
  ["Санжар", "Sanjar", "m"], ["Севара", "Sevara", "f"], ["Феруза", "Feruza", "f"],
  ["Шерзод", "Sherzod", "m"], ["Азиза", "Aziza", "f"], ["Бекзод", "Bekzod", "m"],
  ["Дониёр", "Doniyor", "m"], ["Нилуфар", "Nilufar", "f"], ["Камол", "Kamol", "m"],
] as const;

const LAST = [
  ["Каримов", "Karimov"], ["Рахимов", "Rahimov"], ["Юсупов", "Yusupov"],
  ["Абдуллаев", "Abdullaev"], ["Турсунов", "Tursunov"], ["Мирзаев", "Mirzaev"],
  ["Саидов", "Saidov"], ["Назаров", "Nazarov"], ["Исмоилов", "Ismoilov"],
  ["Холматов", "Kholmatov"], ["Эргашев", "Ergashev"], ["Расулов", "Rasulov"],
  ["Хасанов", "Hasanov"], ["Умаров", "Umarov"], ["Ахмедов", "Akhmedov"],
  ["Собиров", "Sobirov"], ["Тошматов", "Toshmatov"], ["Қодиров", "Qodirov"],
] as const;

const EMPLOYEE_POSITIONS = [
  ["Менеджер по продажам", "Sales Manager"],
  ["Старший менеджер", "Senior Manager"],
  ["Бухгалтер", "Accountant"],
  ["Маркетолог", "Marketing Specialist"],
  ["HR-специалист", "HR Specialist"],
  ["Инженер", "Engineer"],
  ["Дизайнер", "Designer"],
  ["Логист", "Logistics Coordinator"],
  ["Юрист", "Lawyer"],
  ["Администратор офиса", "Office Administrator"],
  ["Аналитик", "Analyst"],
  ["Специалист поддержки", "Support Specialist"],
] as const;

const MANAGER_POSITIONS = [
  ["Руководитель отдела", "Head of Department"],
  ["Директор по развитию", "Development Director"],
  ["Финансовый директор", "Chief Financial Officer"],
  ["Операционный директор", "Chief Operating Officer"],
  ["Коммерческий директор", "Commercial Director"],
] as const;

const OBJECTS = [
  ["Отдел продаж", "Sales Department"],
  ["Отдел маркетинга", "Marketing Department"],
  ["Бухгалтерия", "Accounting"],
  ["Отдел кадров", "HR Department"],
  ["IT-отдел", "IT Department"],
  ["Юридический отдел", "Legal Department"],
  ["Логистика", "Logistics"],
  ["Головной офис", "Head Office"],
  ["Филиал Самарканд", "Samarkand Branch"],
  ["Филиал Бухара", "Bukhara Branch"],
] as const;

const AVATAR_COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#059669",
  "#0891b2", "#4f46e5", "#be123c", "#ca8a04", "#0f766e",
];

// Deterministic PRNG so re-running produces the same people
let seed = 42;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const pad = (n: number) => String(n).padStart(2, "0");

// Initials on a coloured circle, rendered through the same compression path
// as real uploads so demo users get proper /api/avatars/... URLs.
async function initialsAvatar(initials: string, color: string): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" fill="${color}"/>
    <text x="50%" y="50%" dy=".36em" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="210" font-weight="700" fill="#ffffff">${initials}</text>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

function birthdayFor(index: number): Date {
  const today = new Date();
  // A couple of birthdays today and a few this week so the bell/modal have data
  const offsetDays = index < 2 ? 0 : index < 6 ? 1 + ((index - 2) % 6) : null;
  const year = 1970 + Math.floor(rand() * 32);
  if (offsetDays !== null) {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return new Date(`${year}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return new Date(`${year}-${pad(1 + Math.floor(rand() * 12))}-${pad(1 + Math.floor(rand() * 28))}`);
}

async function main() {
  await connectDB();

  const uri = process.env.MONGODB_URI || "";
  const isLocal = /localhost|127\.0\.0\.1/.test(uri);
  if (!isLocal && !process.argv.includes("--force")) {
    console.error(`Refusing to seed a non-local database (${uri.replace(/\/\/.*@/, "//***@")}). Pass --force to override.`);
    process.exit(1);
  }

  const demoFilter = { email: { $regex: `@${DEMO_DOMAIN}$` } };

  if (process.argv.includes("--remove")) {
    const ids = (await User.find(demoFilter).select("_id").lean()).map((u: any) => u._id);
    await Avatar.deleteMany({ user: { $in: ids } });
    const { deletedCount } = await User.deleteMany(demoFilter);
    console.log(`Removed ${deletedCount} demo user(s) and their avatars.`);
    process.exit(0);
  }

  const existing = await User.countDocuments(demoFilter);
  if (existing > 0) {
    console.log(`${existing} demo user(s) already present. Run with --remove first to regenerate.`);
    process.exit(0);
  }

  const lastUser = await User.findOne().sort({ order_id: -1 }).select("order_id").lean();
  let orderId = ((lastUser as any)?.order_id ?? -1) + 1;
  const passwordHash = await bcrypt.hash(PASSWORD, 12); // hashed once; the pre-save hook skips existing hashes

  for (let i = 0; i < COUNT; i++) {
    const [firstRu, firstEn, gender] = pick(FIRST);
    const [lastRuBase, lastEnBase] = pick(LAST);
    const lastRu = gender === "f" ? `${lastRuBase}а` : lastRuBase;
    const lastEn = gender === "f" ? `${lastEnBase}a` : lastEnBase;
    const isManager = rand() < 0.15;
    const [posRu, posEn] = isManager ? pick(MANAGER_POSITIONS) : pick(EMPLOYEE_POSITIONS);
    const [objRu, objEn] = pick(OBJECTS);

    const userId = new mongoose.Types.ObjectId();
    let avatar: string | undefined;
    if (rand() < 0.8) {
      const dataUrl = await initialsAvatar(`${firstEn[0]}${lastEn[0]}`, pick(AVATAR_COLORS));
      avatar = await storeAvatar(userId.toString(), dataUrl);
    }

    await User.create({
      _id: userId,
      name: { ru: `${firstRu} ${lastRu}`, en: `${firstEn} ${lastEn}` },
      email: `${firstEn}.${lastEn}${i + 1}@${DEMO_DOMAIN}`.toLowerCase(),
      password: passwordHash,
      phone: `+99890${Math.floor(1000000 + rand() * 8999999)}`,
      position: { ru: posRu, en: posEn },
      birthday: birthdayFor(i),
      avatar: avatar ?? "/placeholder.svg?height=100&width=100",
      role: "worker",
      workerType: isManager ? "top_manager" : "employee",
      viewPermissions: "both",
      order_id: orderId++,
      object_name: { ru: objRu, en: objEn },
    });

    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${COUNT}`);
  }

  console.log(`Added ${COUNT} demo users (@${DEMO_DOMAIN}, password "${PASSWORD}"): 2 with a birthday today, 4 more this week.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
