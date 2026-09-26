import { webcrypto } from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import sharp from "sharp";
import connectDB from "../lib/mongodb";
import User from "../models/User";
import Avatar from "../models/Avatar";
import { storeAvatar } from "../lib/avatar";

if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

const PASSWORD = "worker123";

// Uzbek / Central Asian first names
const FIRST_MALE = [
  ["Сардор", "Sardor"], ["Жасур", "Jasur"], ["Бобур", "Bobur"], ["Тимур", "Timur"],
  ["Азиз", "Aziz"], ["Рустам", "Rustam"], ["Нодир", "Nodir"], ["Отабек", "Otabek"],
  ["Фаррух", "Farrukh"], ["Элдор", "Eldor"], ["Санжар", "Sanjar"], ["Шерзод", "Sherzod"],
  ["Бекзод", "Bekzod"], ["Дониёр", "Doniyor"], ["Камол", "Kamol"], ["Жавохир", "Javohir"],
  ["Шухрат", "Shukhrat"], ["Анвар", "Anvar"], ["Дилшод", "Dilshod"], ["Улугбек", "Ulugbek"],
  ["Фарход", "Farkhod"], ["Илхом", "Ilkhom"], ["Алишер", "Alisher"], ["Хуршид", "Khurshid"],
  ["Бахтиёр", "Bakhtiyor"], ["Ойбек", "Oybek"], ["Мирзо", "Mirzo"], ["Равшан", "Ravshan"],
  ["Сухроб", "Sukhrob"], ["Акмал", "Akmal"], ["Аброр", "Abror"], ["Жамшид", "Jamshid"],
  ["Искандар", "Iskandar"], ["Сарвар", "Sarvar"], ["Музаффар", "Muzaffar"], ["Асадбек", "Asadbek"],
] as const;

const FIRST_FEMALE = [
  ["Камила", "Kamila"], ["Малика", "Malika"], ["Лола", "Lola"], ["Дилноза", "Dilnoza"],
  ["Шахзода", "Shahzoda"], ["Юлдуз", "Yulduz"], ["Зарина", "Zarina"], ["Гулнора", "Gulnora"],
  ["Мадина", "Madina"], ["Севара", "Sevara"], ["Феруза", "Feruza"], ["Азиза", "Aziza"],
  ["Нилуфар", "Nilufar"], ["Умида", "Umida"], ["Наргиза", "Nargiza"], ["Райхон", "Rayhon"],
  ["Гули", "Guli"], ["Зиёда", "Ziyoda"], ["Шохида", "Shohida"], ["Диёра", "Diyora"],
  ["Муниса", "Munisa"], ["Шахноза", "Shahnoza"], ["Нозима", "Nozima"], ["Дилором", "Dilorom"],
  ["Гульчехра", "Gulchehra"], ["Хуснора", "Husnora"], ["Ирода", "Iroda"], ["Сайёра", "Sayyora"],
] as const;

// Surnames
const LAST_NAMES = [
  ["Каримов", "Karimov"], ["Рахимов", "Rahimov"], ["Юсупов", "Yusupov"],
  ["Абдуллаев", "Abdullaev"], ["Турсунов", "Tursunov"], ["Мирзаев", "Mirzaev"],
  ["Саидов", "Saidov"], ["Назаров", "Nazarov"], ["Исмоилов", "Ismoilov"],
  ["Холматов", "Kholmatov"], ["Эргашев", "Ergashev"], ["Расулов", "Rasulov"],
  ["Хасанов", "Hasanov"], ["Умаров", "Umarov"], ["Ахмедов", "Akhmedov"],
  ["Собиров", "Sobirov"], ["Тошматов", "Toshmatov"], ["Қодиров", "Qodirov"],
  ["Махмудов", "Makhmudov"], ["Олимов", "Olimov"], ["Шарипов", "Sharipov"],
  ["Султонов", "Sultonov"], ["Норматов", "Normatov"], ["Алимов", "Alimov"],
  ["Азимов", "Azimov"], ["Жураев", "Juraev"], ["Бозоров", "Bozorov"],
  ["Хошимов", "Khoshimov"], ["Рузиев", "Ruziev"], ["Иброхимов", "Ibrokhimov"],
  ["Мамадалиев", "Mamadaliev"], ["Хайдаров", "Khaydarov"], ["Темиров", "Temirov"],
] as const;

const AVATAR_COLORS = [
  "#0284c7", "#f97316", "#0d9488", "#8b5cf6", "#ec4899",
  "#2563eb", "#059669", "#d97706", "#dc2626", "#4f46e5",
];

// Deterministic PRNG
let seed = 12345;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const pad = (n: number) => String(n).padStart(2, "0");

async function initialsAvatar(initials: string, color: string): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" rx="256" fill="${color}"/>
    <text x="50%" y="50%" dy=".36em" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="200" font-weight="700" fill="#ffffff">${initials}</text>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

function randomBirthday(): Date {
  const year = 1978 + Math.floor(rand() * 24);
  const month = 1 + Math.floor(rand() * 12);
  const day = 1 + Math.floor(rand() * 28);
  return new Date(`${year}-${pad(month)}-${pad(day)}`);
}

async function main() {
  await connectDB();
  console.log("Connected to MongoDB");

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // 1. Setup or update CEO: Khurshid Normurodov
  let ceo = await User.findOne({ email: "normurodov.khur.uzb@gmail.com" });
  if (!ceo) {
    ceo = await User.findOne({ role: "admin" });
  }

  if (ceo) {
    ceo.name = { ru: "Khurshid Normurodov", en: "Khurshid Normurodov" };
    ceo.position = { ru: "Генеральный директор (CEO)", en: "General Director (CEO)" };
    ceo.workerType = "top_manager";
    ceo.role = "admin";
    ceo.viewPermissions = "both";
    ceo.groups = ["mesmer"];
    ceo.reportsTo = null;
    ceo.object_name = { ru: "MESMER Group", en: "MESMER Group" };
    await ceo.save();
    console.log(`CEO configured: ${ceo.name.en} (${ceo._id})`);
  } else {
    const ceoId = new mongoose.Types.ObjectId();
    const avatarData = await initialsAvatar("KN", "#0f172a");
    const avatarUrl = await storeAvatar(ceoId.toString(), avatarData);
    ceo = await User.create({
      _id: ceoId,
      name: { ru: "Khurshid Normurodov", en: "Khurshid Normurodov" },
      email: "normurodov.khur.uzb@gmail.com",
      password: passwordHash,
      phone: "+998901234500",
      position: { ru: "Генеральный директор (CEO)", en: "General Director (CEO)" },
      birthday: new Date("1985-05-15"),
      avatar: avatarUrl,
      role: "admin",
      workerType: "top_manager",
      viewPermissions: "both",
      order_id: 1,
      groups: ["mesmer"],
      reportsTo: null,
      object_name: { ru: "MESMER Group", en: "MESMER Group" },
    });
    console.log(`Created new CEO: ${ceo.name.en}`);
  }

  // Update admin user to report to CEO
  await User.updateOne(
    { email: "admin@mesmer.uz" },
    {
      $set: {
        reportsTo: ceo._id,
        workerType: "top_manager",
        viewPermissions: "both",
        object_name: { ru: "MESMER Group", en: "MESMER Group" },
      },
    }
  );

  let nextOrderId = 10;
  const lastUser = await User.findOne().sort({ order_id: -1 }).select("order_id").lean();
  if (lastUser && (lastUser as any).order_id) {
    nextOrderId = (lastUser as any).order_id + 1;
  }

  // -------------------------------------------------------------
  // DIVISION 1: MESMER Engineering (internal ID: mesmer)
  // Target: > 150 employees (160 total)
  // -------------------------------------------------------------
  console.log("\n--- Setting up Division 1: MESMER Engineering ---");
  
  // Director of MESMER Engineering
  let mesmerDirector = await User.findOne({
    groups: "mesmer",
    email: "sardor.alimov@mesmer.uz",
  });
  if (!mesmerDirector) {
    const dirId = new mongoose.Types.ObjectId();
    const avatarData = await initialsAvatar("SA", "#0284c7");
    const avatarUrl = await storeAvatar(dirId.toString(), avatarData);
    mesmerDirector = await User.create({
      _id: dirId,
      name: { ru: "Сардор Алимов", en: "Sardor Alimov" },
      email: "sardor.alimov@mesmer.uz",
      password: passwordHash,
      phone: "+998901112233",
      position: { ru: "Директор MESMER Engineering", en: "Director of MESMER Engineering" },
      birthday: new Date("1982-04-12"),
      avatar: avatarUrl,
      role: "worker",
      workerType: "top_manager",
      viewPermissions: "both",
      order_id: nextOrderId++,
      groups: ["mesmer"],
      reportsTo: ceo._id,
      object_name: { ru: "MESMER Engineering", en: "MESMER Engineering" },
    });
  } else {
    mesmerDirector.reportsTo = ceo._id;
    mesmerDirector.workerType = "top_manager";
    await mesmerDirector.save();
  }

  // 8 Department Managers in MESMER Engineering
  const MESMER_MANAGERS_DATA = [
    { ru: "Главный инженер", en: "Chief Engineer", nameRu: "Жасур Рахимов", nameEn: "Jasur Rahimov", initials: "JR" },
    { ru: "Руководитель отдела АСУ ТП", en: "Head of Automation Systems", nameRu: "Бобур Каримов", nameEn: "Bobur Karimov", initials: "BK" },
    { ru: "Руководитель отдела продаж", en: "Head of Sales & Tenders", nameRu: "Тимур Юсупов", nameEn: "Timur Yusupov", initials: "TY" },
    { ru: "Руководитель проектов (PMO)", en: "Head of Project Management", nameRu: "Азиз Абдуллаев", nameEn: "Aziz Abdullaev", initials: "AA" },
    { ru: "Руководитель электротехнического отдела", en: "Head of Electrical Engineering", nameRu: "Рустам Турсунов", nameEn: "Rustam Tursunov", initials: "RT" },
    { ru: "Руководитель сервисной службы", en: "Head of Service & Maintenance", nameRu: "Нодир Мирзаев", nameEn: "Nodir Mirzaev", initials: "NM" },
    { ru: "Руководитель отдела снабжения", en: "Head of Supply Chain & Procurement", nameRu: "Камила Саидова", nameEn: "Kamila Saidova", initials: "KS" },
    { ru: "Главный конструктор CAD/R&D", en: "Chief Mechanical & CAD Designer", nameRu: "Отабек Назаров", nameEn: "Otabek Nazarov", initials: "ON" },
  ];

  const mesmerManagerIds: mongoose.Types.ObjectId[] = [];
  for (let mIdx = 0; mIdx < MESMER_MANAGERS_DATA.length; mIdx++) {
    const mData = MESMER_MANAGERS_DATA[mIdx];
    const email = `mgr.mesmer${mIdx + 1}@mesmer.uz`;
    let mgr = await User.findOne({ email });
    if (!mgr) {
      const mId = new mongoose.Types.ObjectId();
      const avatarData = await initialsAvatar(mData.initials, pick(AVATAR_COLORS));
      const avatarUrl = await storeAvatar(mId.toString(), avatarData);
      mgr = await User.create({
        _id: mId,
        name: { ru: mData.nameRu, en: mData.nameEn },
        email,
        password: passwordHash,
        phone: `+99890${Math.floor(2000000 + rand() * 7999999)}`,
        position: { ru: mData.ru, en: mData.en },
        birthday: randomBirthday(),
        avatar: avatarUrl,
        role: "worker",
        workerType: "top_manager",
        viewPermissions: "both",
        order_id: nextOrderId++,
        groups: ["mesmer"],
        reportsTo: mesmerDirector._id,
        object_name: { ru: "MESMER Engineering", en: "MESMER Engineering" },
      });
    } else {
      mgr.reportsTo = mesmerDirector._id;
      mgr.workerType = "top_manager";
      await mgr.save();
    }
    mesmerManagerIds.push(mgr._id);
  }

  // Count existing employees in mesmer (excluding CEO, Director, and Managers)
  const currentMesmerCount = await User.countDocuments({ groups: "mesmer" });
  console.log(`Current MESMER count: ${currentMesmerCount}`);

  // We want at least 160 employees in MESMER total
  const targetMesmerTotal = 160;
  const mesmerPositions = [
    ["Инженер АСУ ТП", "Automation Engineer"],
    ["Инженер-электрик", "Electrical Engineer"],
    ["Инженер-механик", "Mechanical Engineer"],
    ["Разработчик SCADA-систем", "SCADA Developer"],
    ["Инженер пусконаладочных работ", "Commissioning Engineer"],
    ["Инженер проектов", "Project Engineer"],
    ["Инженер по продажам", "Sales Engineer"],
    ["Инженер-сметчик", "Technical Estimator"],
    ["Инженер по качеству (QA)", "Quality Assurance Engineer"],
    ["Специалист по снабжению", "Procurement Specialist"],
    ["Инженер-конструктор CAD", "CAD Design Engineer"],
    ["Сервисный техник", "Service Technician"],
    ["Инженер энергосистем", "Power Systems Engineer"],
    ["Специалист по логистике", "Logistics Specialist"],
    ["Менеджер проектов", "Project Manager"],
    ["Программист ПЛК", "PLC Programmer"],
  ] as const;

  const mesmerNeeded = Math.max(0, targetMesmerTotal - currentMesmerCount);
  console.log(`Adding ${mesmerNeeded} team members to MESMER Engineering...`);

  for (let i = 0; i < mesmerNeeded; i++) {
    const isFemale = rand() < 0.35;
    const [firstRu, firstEn] = isFemale ? pick(FIRST_FEMALE) : pick(FIRST_MALE);
    const [lastRuBase, lastEnBase] = pick(LAST_NAMES);
    const lastRu = isFemale ? `${lastRuBase}а` : lastRuBase;
    const lastEn = isFemale ? `${lastEnBase}a` : lastEnBase;

    const [posRu, posEn] = pick(mesmerPositions);
    const assignedManagerId = mesmerManagerIds[i % mesmerManagerIds.length];

    const uId = new mongoose.Types.ObjectId();
    const avatarData = await initialsAvatar(`${firstEn[0]}${lastEn[0]}`, pick(AVATAR_COLORS));
    const avatarUrl = await storeAvatar(uId.toString(), avatarData);

    await User.create({
      _id: uId,
      name: { ru: `${firstRu} ${lastRu}`, en: `${firstEn} ${lastEn}` },
      email: `${firstEn.toLowerCase()}.${lastEnBase.toLowerCase()}${i + 1}@mesmer.uz`,
      password: passwordHash,
      phone: `+99890${Math.floor(2000000 + rand() * 7999999)}`,
      position: { ru: posRu, en: posEn },
      birthday: randomBirthday(),
      avatar: avatarUrl,
      role: "worker",
      workerType: "employee",
      viewPermissions: "employees",
      order_id: nextOrderId++,
      groups: ["mesmer"],
      reportsTo: assignedManagerId,
      object_name: { ru: "MESMER Engineering", en: "MESMER Engineering" },
    });

    if ((i + 1) % 25 === 0) console.log(`  MESMER: ${i + 1}/${mesmerNeeded}`);
  }

  // -------------------------------------------------------------
  // DIVISION 2: MESAL Water Technologies (internal ID: mesal)
  // Target: > 50 employees (55 total)
  // -------------------------------------------------------------
  console.log("\n--- Setting up Division 2: MESAL Water Technologies ---");

  // Director: Ulugbek Mirzarakhmanov
  let mesalDirector = await User.findOne({ email: "ulugbek@mesmer.uz" });
  if (mesalDirector) {
    mesalDirector.position = { ru: "Директор MESAL Water Technologies", en: "Director of MESAL Water Technologies" };
    mesalDirector.workerType = "top_manager";
    mesalDirector.reportsTo = ceo._id;
    mesalDirector.groups = ["mesal"];
    mesalDirector.object_name = { ru: "MESAL Water Technologies", en: "MESAL Water Technologies" };
    await mesalDirector.save();
  } else {
    const dirId = new mongoose.Types.ObjectId();
    const avatarData = await initialsAvatar("UM", "#f97316");
    const avatarUrl = await storeAvatar(dirId.toString(), avatarData);
    mesalDirector = await User.create({
      _id: dirId,
      name: { ru: "Улугбек Мирзарахманов", en: "Ulugbek Mirzarakhmanov" },
      email: "ulugbek@mesmer.uz",
      password: passwordHash,
      phone: "+998901234569",
      position: { ru: "Директор MESAL Water Technologies", en: "Director of MESAL Water Technologies" },
      birthday: new Date("1988-07-22"),
      avatar: avatarUrl,
      role: "worker",
      workerType: "top_manager",
      viewPermissions: "both",
      order_id: nextOrderId++,
      groups: ["mesal"],
      reportsTo: ceo._id,
      object_name: { ru: "MESAL Water Technologies", en: "MESAL Water Technologies" },
    });
  }

  // 4 Department Managers in MESAL
  const MESAL_MANAGERS_DATA = [
    { ru: "Руководитель систем водоочистки", en: "Head of Water Purification Systems", nameRu: "Фаррух Исмоилов", nameEn: "Farrukh Ismoilov", initials: "FI" },
    { ru: "Руководитель мембранных технологий (RO)", en: "Head of Reverse Osmosis Systems", nameRu: "Малика Холматова", nameEn: "Malika Kholmatova", initials: "MK" },
    { ru: "Руководитель химико-технологического отдела", en: "Head of Chemical Water Preparation", nameRu: "Элдор Эргашев", nameEn: "Eldor Ergashev", initials: "EE" },
    { ru: "Руководитель монтажно-сервисной службы", en: "Head of Water Equipment Installation & Service", nameRu: "Санжар Расулов", nameEn: "Sanjar Rasulov", initials: "SR" },
  ];

  const mesalManagerIds: mongoose.Types.ObjectId[] = [];
  for (let mIdx = 0; mIdx < MESAL_MANAGERS_DATA.length; mIdx++) {
    const mData = MESAL_MANAGERS_DATA[mIdx];
    const email = `mgr.mesal${mIdx + 1}@mesmer.uz`;
    let mgr = await User.findOne({ email });
    if (!mgr) {
      const mId = new mongoose.Types.ObjectId();
      const avatarData = await initialsAvatar(mData.initials, pick(AVATAR_COLORS));
      const avatarUrl = await storeAvatar(mId.toString(), avatarData);
      mgr = await User.create({
        _id: mId,
        name: { ru: mData.nameRu, en: mData.nameEn },
        email,
        password: passwordHash,
        phone: `+99893${Math.floor(2000000 + rand() * 7999999)}`,
        position: { ru: mData.ru, en: mData.en },
        birthday: randomBirthday(),
        avatar: avatarUrl,
        role: "worker",
        workerType: "top_manager",
        viewPermissions: "both",
        order_id: nextOrderId++,
        groups: ["mesal"],
        reportsTo: mesalDirector._id,
        object_name: { ru: "MESAL Water Technologies", en: "MESAL Water Technologies" },
      });
    } else {
      mgr.reportsTo = mesalDirector._id;
      mgr.workerType = "top_manager";
      await mgr.save();
    }
    mesalManagerIds.push(mgr._id);
  }

  // Update Farkhod Karimov in mesal
  await User.updateOne(
    { email: "farkhod@mesmer.uz" },
    {
      $set: {
        reportsTo: mesalManagerIds[0],
        groups: ["mesal"],
        object_name: { ru: "MESAL Water Technologies", en: "MESAL Water Technologies" },
      },
    }
  );

  const mesalPositions = [
    ["Инженер водоочистки", "Water Treatment Engineer"],
    ["Специалист обратного осмоса", "Reverse Osmosis Specialist"],
    ["Инженер-химик", "Chemical Process Engineer"],
    ["Техник фильтрационных станций", "Filtration Plant Technician"],
    ["Аналитик качества воды", "Water Quality Analyst"],
    ["Специалист промышленной водоподготовки", "Industrial Water Specialist"],
    ["Инженер монтажных работ", "Installation Engineer"],
    ["Техник сервисного обслуживания", "Service Maintenance Technician"],
    ["Лаборант химического анализа", "Laboratory Analyst"],
    ["Инженер по водоотведению", "Wastewater Treatment Engineer"],
  ] as const;

  const currentMesalCount = await User.countDocuments({ groups: "mesal" });
  const mesalNeeded = Math.max(0, 55 - currentMesalCount);
  console.log(`Adding ${mesalNeeded} team members to MESAL...`);

  for (let i = 0; i < mesalNeeded; i++) {
    const isFemale = rand() < 0.4;
    const [firstRu, firstEn] = isFemale ? pick(FIRST_FEMALE) : pick(FIRST_MALE);
    const [lastRuBase, lastEnBase] = pick(LAST_NAMES);
    const lastRu = isFemale ? `${lastRuBase}а` : lastRuBase;
    const lastEn = isFemale ? `${lastEnBase}a` : lastEnBase;

    const [posRu, posEn] = pick(mesalPositions);
    const assignedManagerId = mesalManagerIds[i % mesalManagerIds.length];

    const uId = new mongoose.Types.ObjectId();
    const avatarData = await initialsAvatar(`${firstEn[0]}${lastEn[0]}`, pick(AVATAR_COLORS));
    const avatarUrl = await storeAvatar(uId.toString(), avatarData);

    await User.create({
      _id: uId,
      name: { ru: `${firstRu} ${lastRu}`, en: `${firstEn} ${lastEn}` },
      email: `${firstEn.toLowerCase()}.${lastEnBase.toLowerCase()}.w${i + 1}@mesmer.uz`,
      password: passwordHash,
      phone: `+99893${Math.floor(2000000 + rand() * 7999999)}`,
      position: { ru: posRu, en: posEn },
      birthday: randomBirthday(),
      avatar: avatarUrl,
      role: "worker",
      workerType: "employee",
      viewPermissions: "employees",
      order_id: nextOrderId++,
      groups: ["mesal"],
      reportsTo: assignedManagerId,
      object_name: { ru: "MESAL Water Technologies", en: "MESAL Water Technologies" },
    });
  }

  // -------------------------------------------------------------
  // DIVISION 3: Maxsus Suv Qurilish Invest (internal ID: maxsus)
  // Target: > 50 employees (55 total)
  // -------------------------------------------------------------
  console.log("\n--- Setting up Division 3: Maxsus Suv Qurilish Invest ---");

  let maxsusDirector = await User.findOne({ email: "bobur.kadyrov@mesmer.uz" });
  if (!maxsusDirector) {
    const dirId = new mongoose.Types.ObjectId();
    const avatarData = await initialsAvatar("BK", "#0d9488");
    const avatarUrl = await storeAvatar(dirId.toString(), avatarData);
    maxsusDirector = await User.create({
      _id: dirId,
      name: { ru: "Бобур Кодиров", en: "Bobur Kadyrov" },
      email: "bobur.kadyrov@mesmer.uz",
      password: passwordHash,
      phone: "+998941234567",
      position: { ru: "Директор Maxsus Suv Qurilish Invest", en: "Director of Maxsus Suv Qurilish Invest" },
      birthday: new Date("1980-09-18"),
      avatar: avatarUrl,
      role: "worker",
      workerType: "top_manager",
      viewPermissions: "both",
      order_id: nextOrderId++,
      groups: ["maxsus"],
      reportsTo: ceo._id,
      object_name: { ru: "Maxsus Suv Qurilish Invest", en: "Maxsus Suv Qurilish Invest" },
    });
  } else {
    maxsusDirector.reportsTo = ceo._id;
    maxsusDirector.workerType = "top_manager";
    await maxsusDirector.save();
  }

  // 4 Department Managers in Maxsus
  const MAXSUS_MANAGERS_DATA = [
    { ru: "Руководитель гидротехнического строительства", en: "Head of Hydraulic Construction", nameRu: "Шахзод Хасанов", nameEn: "Shahzod Hasanov", initials: "SH" },
    { ru: "Руководитель ирригационных систем и сетей", en: "Head of Irrigation & Pipelines", nameRu: "Бекзод Умаров", nameEn: "Bekzod Umarov", initials: "BU" },
    { ru: "Руководитель парка тяжелой спецтехники", en: "Head of Heavy Machinery & Fleet", nameRu: "Дониёр Ахмедов", nameEn: "Doniyor Akhmedov", initials: "DA" },
    { ru: "Руководитель технического надзора и ПТО", en: "Head of Technical Supervision & PTO", nameRu: "Нигора Рахимова", nameEn: "Nigora Rakhimova", initials: "NR" },
  ];

  const maxsusManagerIds: mongoose.Types.ObjectId[] = [];
  // Update Nigora Rakhimova if exists
  let nigoraUser = await User.findOne({ email: "nigora@mesmer.uz" });
  if (nigoraUser) {
    nigoraUser.position = { ru: "Руководитель технического надзора и ПТО", en: "Head of Technical Supervision & PTO" };
    nigoraUser.workerType = "top_manager";
    nigoraUser.reportsTo = maxsusDirector._id;
    nigoraUser.groups = ["maxsus"];
    nigoraUser.object_name = { ru: "Maxsus Suv Qurilish Invest", en: "Maxsus Suv Qurilish Invest" };
    await nigoraUser.save();
  }

  for (let mIdx = 0; mIdx < MAXSUS_MANAGERS_DATA.length; mIdx++) {
    const mData = MAXSUS_MANAGERS_DATA[mIdx];
    if (mIdx === 3 && nigoraUser) {
      maxsusManagerIds.push(nigoraUser._id);
      continue;
    }
    const email = `mgr.maxsus${mIdx + 1}@mesmer.uz`;
    let mgr = await User.findOne({ email });
    if (!mgr) {
      const mId = new mongoose.Types.ObjectId();
      const avatarData = await initialsAvatar(mData.initials, pick(AVATAR_COLORS));
      const avatarUrl = await storeAvatar(mId.toString(), avatarData);
      mgr = await User.create({
        _id: mId,
        name: { ru: mData.nameRu, en: mData.nameEn },
        email,
        password: passwordHash,
        phone: `+99894${Math.floor(2000000 + rand() * 7999999)}`,
        position: { ru: mData.ru, en: mData.en },
        birthday: randomBirthday(),
        avatar: avatarUrl,
        role: "worker",
        workerType: "top_manager",
        viewPermissions: "both",
        order_id: nextOrderId++,
        groups: ["maxsus"],
        reportsTo: maxsusDirector._id,
        object_name: { ru: "Maxsus Suv Qurilish Invest", en: "Maxsus Suv Qurilish Invest" },
      });
    } else {
      mgr.reportsTo = maxsusDirector._id;
      mgr.workerType = "top_manager";
      await mgr.save();
    }
    maxsusManagerIds.push(mgr._id);
  }

  const maxsusPositions = [
    ["Инженер-гидротехник", "Hydraulic Engineer"],
    ["Инженер-строитель", "Civil Construction Engineer"],
    ["Специалист магистральных трубопроводов", "Pipeline Specialist"],
    ["Инженер-геодезист", "Geodetic Surveyor"],
    ["Оператор тяжелой спецтехники", "Heavy Machinery Operator"],
    ["Прораб строительного участка", "Construction Site Supervisor"],
    ["Инженер технадзора", "Technical Supervision Engineer"],
    ["Техник гидротехнических сооружений", "Hydraulic Works Technician"],
    ["Инженер по охране труда и ТБ", "Safety & Health Engineer"],
    ["Инженер ПТО / Сметчик", "Cost & Estimation Engineer"],
  ] as const;

  const currentMaxsusCount = await User.countDocuments({ groups: "maxsus" });
  const maxsusNeeded = Math.max(0, 55 - currentMaxsusCount);
  console.log(`Adding ${maxsusNeeded} team members to Maxsus...`);

  for (let i = 0; i < maxsusNeeded; i++) {
    const isFemale = rand() < 0.25;
    const [firstRu, firstEn] = isFemale ? pick(FIRST_FEMALE) : pick(FIRST_MALE);
    const [lastRuBase, lastEnBase] = pick(LAST_NAMES);
    const lastRu = isFemale ? `${lastRuBase}а` : lastRuBase;
    const lastEn = isFemale ? `${lastEnBase}a` : lastEnBase;

    const [posRu, posEn] = pick(maxsusPositions);
    const assignedManagerId = maxsusManagerIds[i % maxsusManagerIds.length];

    const uId = new mongoose.Types.ObjectId();
    const avatarData = await initialsAvatar(`${firstEn[0]}${lastEn[0]}`, pick(AVATAR_COLORS));
    const avatarUrl = await storeAvatar(uId.toString(), avatarData);

    await User.create({
      _id: uId,
      name: { ru: `${firstRu} ${lastRu}`, en: `${firstEn} ${lastEn}` },
      email: `${firstEn.toLowerCase()}.${lastEnBase.toLowerCase()}.m${i + 1}@mesmer.uz`,
      password: passwordHash,
      phone: `+99894${Math.floor(2000000 + rand() * 7999999)}`,
      position: { ru: posRu, en: posEn },
      birthday: randomBirthday(),
      avatar: avatarUrl,
      role: "worker",
      workerType: "employee",
      viewPermissions: "employees",
      order_id: nextOrderId++,
      groups: ["maxsus"],
      reportsTo: assignedManagerId,
      object_name: { ru: "Maxsus Suv Qurilish Invest", en: "Maxsus Suv Qurilish Invest" },
    });
  }

  // -------------------------------------------------------------
  // DIVISION 4: Prestige Proekt (internal ID: prestige_proekt)
  // Target: > 50 employees (55 total)
  // -------------------------------------------------------------
  console.log("\n--- Setting up Division 4: Prestige Proekt ---");

  let prestigeDirector = await User.findOne({ email: "azamat@mesmer.uz" });
  if (prestigeDirector) {
    prestigeDirector.position = { ru: "Директор Prestige Proekt", en: "Director of Prestige Proekt" };
    prestigeDirector.workerType = "top_manager";
    prestigeDirector.reportsTo = ceo._id;
    prestigeDirector.groups = ["prestige_proekt"];
    prestigeDirector.object_name = { ru: "Prestige Proekt", en: "Prestige Proekt" };
    await prestigeDirector.save();
  } else {
    const dirId = new mongoose.Types.ObjectId();
    const avatarData = await initialsAvatar("AT", "#8b5cf6");
    const avatarUrl = await storeAvatar(dirId.toString(), avatarData);
    prestigeDirector = await User.create({
      _id: dirId,
      name: { ru: "Азамат Турсунбоев", en: "Azamat Tursunboyev" },
      email: "azamat@mesmer.uz",
      password: passwordHash,
      phone: "+998901234568",
      position: { ru: "Директор Prestige Proekt", en: "Director of Prestige Proekt" },
      birthday: new Date("1985-03-15"),
      avatar: avatarUrl,
      role: "worker",
      workerType: "top_manager",
      viewPermissions: "both",
      order_id: nextOrderId++,
      groups: ["prestige_proekt"],
      reportsTo: ceo._id,
      object_name: { ru: "Prestige Proekt", en: "Prestige Proekt" },
    });
  }

  // 4 Department Managers in Prestige Proekt
  const PRESTIGE_MANAGERS_DATA = [
    { ru: "Главный архитектор проектов (ГАП)", en: "Chief Project Architect", nameRu: "Камол Собиров", nameEn: "Kamol Sobirov", initials: "KS" },
    { ru: "Главный инженер проектов (ГИП)", en: "Chief Project Engineer", nameRu: "Жавохир Тошматов", nameEn: "Javohir Toshmatov", initials: "JT" },
    { ru: "Руководитель отдела BIM-моделирования", en: "Head of BIM & Digital Design", nameRu: "Шахзода Махмудова", nameEn: "Shahzoda Makhmudova", initials: "SM" },
    { ru: "Руководитель инженерных сетей (MEP)", en: "Head of Engineering Systems (MEP)", nameRu: "Шухрат Олимов", nameEn: "Shukhrat Olimov", initials: "SO" },
  ];

  const prestigeManagerIds: mongoose.Types.ObjectId[] = [];
  for (let mIdx = 0; mIdx < PRESTIGE_MANAGERS_DATA.length; mIdx++) {
    const mData = PRESTIGE_MANAGERS_DATA[mIdx];
    const email = `mgr.prestige${mIdx + 1}@mesmer.uz`;
    let mgr = await User.findOne({ email });
    if (!mgr) {
      const mId = new mongoose.Types.ObjectId();
      const avatarData = await initialsAvatar(mData.initials, pick(AVATAR_COLORS));
      const avatarUrl = await storeAvatar(mId.toString(), avatarData);
      mgr = await User.create({
        _id: mId,
        name: { ru: mData.nameRu, en: mData.nameEn },
        email,
        password: passwordHash,
        phone: `+99897${Math.floor(2000000 + rand() * 7999999)}`,
        position: { ru: mData.ru, en: mData.en },
        birthday: randomBirthday(),
        avatar: avatarUrl,
        role: "worker",
        workerType: "top_manager",
        viewPermissions: "both",
        order_id: nextOrderId++,
        groups: ["prestige_proekt"],
        reportsTo: prestigeDirector._id,
        object_name: { ru: "Prestige Proekt", en: "Prestige Proekt" },
      });
    } else {
      mgr.reportsTo = prestigeDirector._id;
      mgr.workerType = "top_manager";
      await mgr.save();
    }
    prestigeManagerIds.push(mgr._id);
  }

  const prestigePositions = [
    ["Ведущий архитектор", "Lead Architect"],
    ["BIM-координатор", "BIM Coordinator"],
    ["BIM-моделист", "BIM Modeler"],
    ["Инженер-конструктор (КЖ/КМ)", "Structural Engineer"],
    ["Архитектурный 3D-визуализатор", "3D Architectural Visualizer"],
    ["Инженер ОВВК (отопление, вентиляция)", "HVAC Design Engineer"],
    ["Проектировщик электроснабжения (ЭОМ)", "Electrical Systems Designer"],
    ["Проектировщик водоснабжения (ВК)", "Plumbing & Drainage Designer"],
    ["Архитектор генплана", "Master Plan Architect"],
    ["Концепт-дизайнер фасадов", "Facade Concept Designer"],
  ] as const;

  const currentPrestigeCount = await User.countDocuments({ groups: "prestige_proekt" });
  const prestigeNeeded = Math.max(0, 55 - currentPrestigeCount);
  console.log(`Adding ${prestigeNeeded} team members to Prestige Proekt...`);

  for (let i = 0; i < prestigeNeeded; i++) {
    const isFemale = rand() < 0.45;
    const [firstRu, firstEn] = isFemale ? pick(FIRST_FEMALE) : pick(FIRST_MALE);
    const [lastRuBase, lastEnBase] = pick(LAST_NAMES);
    const lastRu = isFemale ? `${lastRuBase}а` : lastRuBase;
    const lastEn = isFemale ? `${lastEnBase}a` : lastEnBase;

    const [posRu, posEn] = pick(prestigePositions);
    const assignedManagerId = prestigeManagerIds[i % prestigeManagerIds.length];

    const uId = new mongoose.Types.ObjectId();
    const avatarData = await initialsAvatar(`${firstEn[0]}${lastEn[0]}`, pick(AVATAR_COLORS));
    const avatarUrl = await storeAvatar(uId.toString(), avatarData);

    await User.create({
      _id: uId,
      name: { ru: `${firstRu} ${lastRu}`, en: `${firstEn} ${lastEn}` },
      email: `${firstEn.toLowerCase()}.${lastEnBase.toLowerCase()}.p${i + 1}@mesmer.uz`,
      password: passwordHash,
      phone: `+99897${Math.floor(2000000 + rand() * 7999999)}`,
      position: { ru: posRu, en: posEn },
      birthday: randomBirthday(),
      avatar: avatarUrl,
      role: "worker",
      workerType: "employee",
      viewPermissions: "employees",
      order_id: nextOrderId++,
      groups: ["prestige_proekt"],
      reportsTo: assignedManagerId,
      object_name: { ru: "Prestige Proekt", en: "Prestige Proekt" },
    });
  }

  // -------------------------------------------------------------
  // Verify final counts
  // -------------------------------------------------------------
  const total = await User.countDocuments();
  const mesmerFinal = await User.countDocuments({ groups: "mesmer" });
  const mesalFinal = await User.countDocuments({ groups: "mesal" });
  const maxsusFinal = await User.countDocuments({ groups: "maxsus" });
  const prestigeFinal = await User.countDocuments({ groups: "prestige_proekt" });
  const topMgrsFinal = await User.countDocuments({ workerType: "top_manager" });

  console.log("\n==========================================");
  console.log(`Population completed successfully!`);
  console.log(`Total users in system: ${total}`);
  console.log(`MESMER Engineering: ${mesmerFinal} (Target > 150)`);
  console.log(`MESAL Water Technologies: ${mesalFinal} (Target > 50)`);
  console.log(`Maxsus Suv Qurilish Invest: ${maxsusFinal} (Target > 50)`);
  console.log(`Prestige Proekt: ${prestigeFinal} (Target > 50)`);
  console.log(`Management (Top Managers): ${topMgrsFinal}`);
  console.log("==========================================");

  process.exit(0);
}

main().catch((err) => {
  console.error("Error executing populate script:", err);
  process.exit(1);
});
