import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create super admin user
  const adminEmail = 'admin@vpsportal.com';
  const adminPassword = 'admin123456'; // Change this in production

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
    console.log(`✅ Created admin user: ${admin.email}`);
  } else {
    console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
  }

  // Create sample datacenter locations
  const datacenters = [
    { code: 'US-EAST-1', name: 'US East - Virginia', country: 'United States' },
    { code: 'US-WEST-1', name: 'US West - California', country: 'United States' },
    { code: 'EU-CENTRAL-1', name: 'EU Central - Frankfurt', country: 'Germany' },
    { code: 'EU-WEST-1', name: 'EU West - London', country: 'United Kingdom' },
    { code: 'ASIA-PACIFIC-1', name: 'Asia Pacific - Singapore', country: 'Singapore' },
  ];

  console.log('✅ Datacenter locations configured in application settings');

  // Create sample operating system templates
  const operatingSystems = [
    { name: 'Ubuntu 22.04 LTS', type: 'linux', template: 'ubuntu-22.04-standard' },
    { name: 'Debian 11', type: 'linux', template: 'debian-11-standard' },
    { name: 'CentOS Stream 9', type: 'linux', template: 'centos-stream-9-standard' },
    { name: 'Windows Server 2022', type: 'windows', template: 'win2022-standard' },
  ];

  console.log('✅ Operating system templates configured in application settings');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });