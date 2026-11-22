import bcrypt from 'bcrypt';
import { prisma } from '../src/config/database.js';

async function main() {
  console.log('[SEED] Starting database seeding process...');

  // 1. Clean existing records (child to parent order)
  await prisma.cashbookRefund.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.pretestAi.deleteMany();
  await prisma.student.deleteMany();
  await prisma.programClass.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password 'haoxing2026'
  const hashedPassword = await bcrypt.hash('haoxing2026', 10);

  // 3. Seed Users (Admin & Owner)
  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Administrator Haoxing',
      email: 'admin@haoxing.id',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Pemilik Haoxing',
      email: 'pemilik@haoxing.id',
      passwordHash: hashedPassword,
      role: 'pemilik',
    },
  });

  console.log('[SEED] Admin and Owner accounts created successfully.');

  // 4. Seed Program Classes Catalog
  const classes = [
    {
      classId: 'PRG-01',
      programCode: 'REG-OFF-HSK1',
      programName: 'Reguler Offline HSK 1',
      category: 'offline' as const,
      hskLevel: 'HSK 1',
      priceIdr: 1500000,
      teacherLaoshi: 'Wang Laoshi',
      scheduleSlot: 'Sen-Jum 08:00',
      startDayRule: 10,
      quotaMax: 15,
    },
    {
      classId: 'PRG-02',
      programCode: 'REG-OFF-HSK2',
      programName: 'Reguler Offline HSK 2',
      category: 'offline' as const,
      hskLevel: 'HSK 2',
      priceIdr: 1750000,
      teacherLaoshi: 'Li Laoshi',
      scheduleSlot: 'Sen-Jum 10:00',
      startDayRule: 10,
      quotaMax: 15,
    },
    {
      classId: 'PRG-03',
      programCode: 'REG-ONL-HSK1',
      programName: 'Reguler Online HSK 1',
      category: 'online' as const,
      hskLevel: 'HSK 1',
      priceIdr: 1200000,
      teacherLaoshi: 'Chen Laoshi',
      scheduleSlot: 'Sen-Kam 19:00',
      startDayRule: 12,
      quotaMax: 20,
    },
    {
      classId: 'PRG-04',
      programCode: 'REG-ONL-HSK2',
      programName: 'Reguler Online HSK 2',
      category: 'online' as const,
      hskLevel: 'HSK 2',
      priceIdr: 1400000,
      teacherLaoshi: 'Zhang Laoshi',
      scheduleSlot: 'Sen-Kam 20:30',
      startDayRule: 12,
      quotaMax: 20,
    },
    {
      classId: 'PRG-05',
      programCode: 'PKT-INT-HSK3',
      programName: 'Paket Intensif HSK 3',
      category: 'paket' as const,
      hskLevel: 'HSK 3',
      priceIdr: 3500000,
      teacherLaoshi: 'Liu Laoshi',
      scheduleSlot: 'Sab-Min 09:00',
      startDayRule: 10,
      quotaMax: 12,
    },
    {
      classId: 'PRG-06',
      programCode: 'PKT-INT-HSK4',
      programName: 'Paket Intensif HSK 4',
      category: 'paket' as const,
      hskLevel: 'HSK 4',
      priceIdr: 4200000,
      teacherLaoshi: 'Huang Laoshi',
      scheduleSlot: 'Sab-Min 13:00',
      startDayRule: 10,
      quotaMax: 12,
    },
  ];

  for (const item of classes) {
    await prisma.programClass.create({ data: item });
  }

  console.log('[SEED] 6 program classes created successfully.');

  // 5. Seed Initial Students (HX-26101 to HX-26106)
  const students = [
    {
      studentId: 'HX-26101',
      fullName: 'Nadia Putri Maharani',
      phone: '0812-3456-7810',
      status: 'calon' as const,
      hasPretest: false,
      recommendedHsk: 'Belum ditentukan (Wajib Pre-Test)',
      managedById: adminUser.userId,
    },
    {
      studentId: 'HX-26102',
      fullName: 'Budi Santoso',
      phone: '0812-3456-7811',
      status: 'terdaftar' as const,
      hasPretest: true,
      recommendedHsk: 'HSK 2',
      managedById: adminUser.userId,
    },
    {
      studentId: 'HX-26103',
      fullName: 'Siti Rahmawati',
      phone: '0812-3456-7812',
      status: 'aktif' as const,
      hasPretest: true,
      recommendedHsk: 'HSK 1',
      managedById: adminUser.userId,
    },
    {
      studentId: 'HX-26104',
      fullName: 'Kevin Wijaya',
      phone: '0812-3456-7813',
      status: 'aktif' as const,
      hasPretest: true,
      recommendedHsk: 'HSK 3',
      managedById: adminUser.userId,
    },
    {
      studentId: 'HX-26105',
      fullName: 'Ahmad Fauzi',
      phone: '0812-3456-7814',
      status: 'calon' as const,
      hasPretest: false,
      recommendedHsk: 'Belum ditentukan (Wajib Pre-Test)',
      managedById: adminUser.userId,
    },
    {
      studentId: 'HX-26106',
      fullName: 'Dewi Lestari',
      phone: '0812-3456-7815',
      status: 'batal' as const,
      hasPretest: false,
      recommendedHsk: 'Belum ditentukan (Wajib Pre-Test)',
      managedById: adminUser.userId,
    },
  ];

  for (const item of students) {
    await prisma.student.create({ data: item });
  }

  console.log('[SEED] 6 initial students created successfully.');
  console.log('[SEED] Database seeding completed successfully.');
}

main().catch((e) => {
  console.error('[ERROR] Database seeding failed:', e);
  process.exit(1);
});
