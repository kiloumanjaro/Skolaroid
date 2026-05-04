import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Client — use DIRECT_URL for seeding (bypasses connection pooler)
// ---------------------------------------------------------------------------

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Supabase Admin client — requires SERVICE_ROLE_KEY for auth.admin operations.
// For local dev, grab these from `supabase status`.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
//
// All static IDs use valid RFC 4122 v4 format:
//   xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx
// (version nibble = 4, variant nibble = 8)

// IDs follow the pattern 10000000-0000-4000-8000-XXXXXXXXXXXX (sequential).
// Coordinates sourced from landmarks.ts (UP Cebu campus).
const LOCATIONS = [
  // --- Buildings ---
  {
    id: '10000000-0000-4000-8000-000000000001',
    buildingName: 'Administration Building',
    description: 'Building',
    latitude: 10.322329,
    longitude: 123.898199,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    buildingName: 'Science Building',
    description: 'Building',
    latitude: 10.322249,
    longitude: 123.897939,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    buildingName: 'Technology Innovation Center Bldg.',
    description: 'Building',
    latitude: 10.321726,
    longitude: 123.897882,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    buildingName: 'Cafeteria',
    description: 'Building',
    latitude: 10.321814,
    longitude: 123.897946,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    buildingName: 'Clinic',
    description: 'Building',
    latitude: 10.321684,
    longitude: 123.897962,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    buildingName: 'Library Building',
    description: 'Building',
    latitude: 10.321434,
    longitude: 123.897985,
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    buildingName: 'Residence Halls',
    description: 'Building',
    latitude: 10.321825,
    longitude: 123.89759,
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    buildingName: 'Balay Varangao',
    description: 'Building',
    latitude: 10.321921,
    longitude: 123.897562,
  },
  {
    id: '10000000-0000-4000-8000-000000000009',
    buildingName: 'Lalahon Hall',
    description: 'Building',
    latitude: 10.321631,
    longitude: 123.897685,
  },
  {
    id: '10000000-0000-4000-8000-000000000010',
    buildingName: 'Liadlaw Hall',
    description: 'Building',
    latitude: 10.321638,
    longitude: 123.897555,
  },
  {
    id: '10000000-0000-4000-8000-000000000011',
    buildingName: 'Lihangin Hall',
    description: 'Building',
    latitude: 10.322135,
    longitude: 123.897523,
  },
  {
    id: '10000000-0000-4000-8000-000000000012',
    buildingName: 'School of Management',
    description: 'Building',
    latitude: 10.322611,
    longitude: 123.8978,
  },
  {
    id: '10000000-0000-4000-8000-000000000013',
    buildingName: 'Management Administration',
    description: 'Building',
    latitude: 10.32278,
    longitude: 123.897737,
  },
  {
    id: '10000000-0000-4000-8000-000000000014',
    buildingName: 'Management Bldg. 1',
    description: 'Building',
    latitude: 10.32311,
    longitude: 123.897771,
  },
  {
    id: '10000000-0000-4000-8000-000000000015',
    buildingName: 'Management Bldg. 2',
    description: 'Building',
    latitude: 10.322545,
    longitude: 123.897714,
  },
  {
    id: '10000000-0000-4000-8000-000000000016',
    buildingName: 'Undergraduate Building',
    description: 'Building',
    latitude: 10.323404,
    longitude: 123.897928,
  },
  {
    id: '10000000-0000-4000-8000-000000000017',
    buildingName: 'Arts and Design Workshop Bldg.',
    description: 'Building',
    latitude: 10.323521,
    longitude: 123.898273,
  },
  {
    id: '10000000-0000-4000-8000-000000000018',
    buildingName: 'Arts and Design Workshop Bldg. 2',
    description: 'Building',
    latitude: 10.323937,
    longitude: 123.898096,
  },
  {
    id: '10000000-0000-4000-8000-000000000019',
    buildingName: 'Arts and Science Extension Bldg. (ASX)',
    description: 'Building',
    latitude: 10.323871,
    longitude: 123.897949,
  },
  {
    id: '10000000-0000-4000-8000-000000000020',
    buildingName: 'Arts and Sciences (AS) Bldg.',
    description: 'Building',
    latitude: 10.323221,
    longitude: 123.899292,
  },
  {
    id: '10000000-0000-4000-8000-000000000021',
    buildingName: 'AS Conference Hall',
    description: 'Building',
    latitude: 10.323281,
    longitude: 123.899462,
  },
  {
    id: '10000000-0000-4000-8000-000000000022',
    buildingName: 'AS East Wing',
    description: 'Building',
    latitude: 10.323088,
    longitude: 123.89943,
  },
  {
    id: '10000000-0000-4000-8000-000000000023',
    buildingName: 'AS West Wing',
    description: 'Building',
    latitude: 10.323501,
    longitude: 123.899506,
  },
  {
    id: '10000000-0000-4000-8000-000000000024',
    buildingName: 'Union Building',
    description: 'Building',
    latitude: 10.323402,
    longitude: 123.899779,
  },
  {
    id: '10000000-0000-4000-8000-000000000025',
    buildingName: 'Cebu Cultural Center',
    description: 'Building',
    latitude: 10.322484,
    longitude: 123.899158,
  },
  {
    id: '10000000-0000-4000-8000-000000000026',
    buildingName: 'High School Area',
    description: 'Building',
    latitude: 10.321967,
    longitude: 123.899711,
  },
  // --- Activity Areas ---
  {
    id: '10000000-0000-4000-8000-000000000027',
    buildingName: 'Oblation Square',
    description: 'Activity Area',
    latitude: 10.322395,
    longitude: 123.898569,
  },
  {
    id: '10000000-0000-4000-8000-000000000028',
    buildingName: 'Admin Cottages',
    description: 'Activity Area',
    latitude: 10.321963,
    longitude: 123.89824,
  },
  {
    id: '10000000-0000-4000-8000-000000000029',
    buildingName: 'Malacañang Cottage',
    description: 'Activity Area',
    latitude: 10.321822,
    longitude: 123.898494,
  },
  {
    id: '10000000-0000-4000-8000-000000000030',
    buildingName: 'Admin Field',
    description: 'Activity Area',
    latitude: 10.321591,
    longitude: 123.898449,
  },
  {
    id: '10000000-0000-4000-8000-000000000031',
    buildingName: 'College Mini Stage',
    description: 'Activity Area',
    latitude: 10.321482,
    longitude: 123.898634,
  },
  {
    id: '10000000-0000-4000-8000-000000000032',
    buildingName: 'Undergraduate Cottages',
    description: 'Activity Area',
    latitude: 10.322744,
    longitude: 123.898161,
  },
  {
    id: '10000000-0000-4000-8000-000000000033',
    buildingName: 'SOM Basketball Court',
    description: 'Activity Area',
    latitude: 10.322698,
    longitude: 123.89792,
  },
  {
    id: '10000000-0000-4000-8000-000000000034',
    buildingName: 'Volleyball Court',
    description: 'Activity Area',
    latitude: 10.323105,
    longitude: 123.898368,
  },
  {
    id: '10000000-0000-4000-8000-000000000035',
    buildingName: 'Amphitheater/Sunset Garden',
    description: 'Activity Area',
    latitude: 10.323369,
    longitude: 123.897727,
  },
  {
    id: '10000000-0000-4000-8000-000000000036',
    buildingName: 'High School Open Field',
    description: 'Activity Area',
    latitude: 10.32205,
    longitude: 123.899085,
  },
  {
    id: '10000000-0000-4000-8000-000000000037',
    buildingName: 'High School Open Court',
    description: 'Activity Area',
    latitude: 10.321972,
    longitude: 123.899468,
  },
  {
    id: '10000000-0000-4000-8000-000000000038',
    buildingName: 'High School Covered Court',
    description: 'Activity Area',
    latitude: 10.321848,
    longitude: 123.899965,
  },
  {
    id: '10000000-0000-4000-8000-000000000039',
    buildingName: 'Soccer Field',
    description: 'Activity Area',
    latitude: 10.322717,
    longitude: 123.89982,
  },
  // --- Security / Parking ---
  {
    id: '10000000-0000-4000-8000-000000000040',
    buildingName: 'Entrance Gate Guard House',
    description: 'Security / Parking',
    latitude: 10.321827,
    longitude: 123.898713,
  },
  {
    id: '10000000-0000-4000-8000-000000000041',
    buildingName: 'Exit Gate Guard House',
    description: 'Security / Parking',
    latitude: 10.322888,
    longitude: 123.898521,
  },
  {
    id: '10000000-0000-4000-8000-000000000042',
    buildingName: 'High School Guard House',
    description: 'Security / Parking',
    latitude: 10.322043,
    longitude: 123.898842,
  },
  {
    id: '10000000-0000-4000-8000-000000000043',
    buildingName: 'AS Guard House',
    description: 'Security / Parking',
    latitude: 10.322791,
    longitude: 123.898689,
  },
  {
    id: '10000000-0000-4000-8000-000000000044',
    buildingName: 'COS Bldg. Parking',
    description: 'Security / Parking',
    latitude: 10.322275,
    longitude: 123.898083,
  },
  {
    id: '10000000-0000-4000-8000-000000000045',
    buildingName: 'Canteen Parking',
    description: 'Security / Parking',
    latitude: 10.321974,
    longitude: 123.897778,
  },
  {
    id: '10000000-0000-4000-8000-000000000046',
    buildingName: 'Library Parking',
    description: 'Security / Parking',
    latitude: 10.321456,
    longitude: 123.898128,
  },
  {
    id: '10000000-0000-4000-8000-000000000047',
    buildingName: 'Motorcycle Parking',
    description: 'Security / Parking',
    latitude: 10.322876,
    longitude: 123.898424,
  },
  {
    id: '10000000-0000-4000-8000-000000000048',
    buildingName: 'Undergraduate Bldg. Parking',
    description: 'Security / Parking',
    latitude: 10.32356,
    longitude: 123.897979,
  },
  {
    id: '10000000-0000-4000-8000-000000000049',
    buildingName: 'AS Motorcycle Parking',
    description: 'Security / Parking',
    latitude: 10.322907,
    longitude: 123.898972,
  },
  {
    id: '10000000-0000-4000-8000-000000000050',
    buildingName: 'AS Parking',
    description: 'Security / Parking',
    latitude: 10.323085,
    longitude: 123.898907,
  },
] as const;

const TAGS = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    name: 'freshman',
    slug: 'freshman',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    name: 'batch-2024',
    slug: 'batch-2024',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    name: 'tradition',
    slug: 'tradition',
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    name: 'academics',
    slug: 'academics',
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    name: 'finals',
    slug: 'finals',
  },
  { id: '20000000-0000-4000-8000-000000000006', name: 'event', slug: 'event' },
  { id: '20000000-0000-4000-8000-000000000007', name: 'music', slug: 'music' },
  {
    id: '20000000-0000-4000-8000-000000000008',
    name: 'night-event',
    slug: 'night-event',
  },
  {
    id: '20000000-0000-4000-8000-000000000009',
    name: 'activism',
    slug: 'activism',
  },
  {
    id: '20000000-0000-4000-8000-000000000010',
    name: 'batch-2025',
    slug: 'batch-2025',
  },
] as const;

// A single seed program + batch so the memory FK is satisfied.
// The ProgramBatch id matches MOCK_PROGRAM_BATCH_ID used in AddMemoryModal.
const PROGRAM_ID = '30000000-0000-4000-8000-000000000001';
const BATCH_ID = '40000000-0000-4000-8000-000000000001';
const PROGRAM_BATCH_ID = '50000000-0000-4000-8000-000000000001';
const BATCH_YEAR = 2024;

// Seed user — linked to Supabase Auth. The UUID is assigned at runtime by Supabase.
const SEED_USER = {
  studentId: '2024-00001',
  email: 'seed@skolaroid.dev',
  password: 'Password1234!',
  firstName: 'Seed',
  lastName: 'User',
} as const;

const MEMORIES = [
  // --- Oblation Square (3 memories) ---
  {
    id: '60000000-0000-4000-8000-000000000001',
    title: 'Freshman Welcome at Oblation Square',
    description:
      'The first day of classes — batch 2024 gathered at the Oblation for the traditional photo.',
    visibility: 'PUBLIC' as const,
    locationId: '10000000-0000-4000-8000-000000000027',
    programBatchId: PROGRAM_BATCH_ID,
    tagSlugs: ['freshman', 'batch-2024'],
  },
  {
    id: '60000000-0000-4000-8000-000000000002',
    title: 'Oblation Run 2024',
    description:
      'Annual tradition — the brave ones sprint across the plaza at dawn.',
    visibility: 'PUBLIC' as const,
    locationId: '10000000-0000-4000-8000-000000000027',
    programBatchId: PROGRAM_BATCH_ID,
    tagSlugs: ['tradition', 'batch-2024'],
  },
  {
    id: '60000000-0000-4000-8000-000000000003',
    title: 'Sunset at the Oblation',
    description: null,
    visibility: 'PROGRAM_ONLY' as const,
    locationId: '10000000-0000-4000-8000-000000000027',
    programBatchId: PROGRAM_BATCH_ID,
    tagSlugs: ['batch-2025'],
  },
  // --- Library Building (2 memories) ---
  {
    id: '60000000-0000-4000-8000-000000000004',
    title: 'Finals Week Study Session',
    description:
      'The library was packed during finals — every table claimed by 7 AM.',
    visibility: 'PUBLIC' as const,
    locationId: '10000000-0000-4000-8000-000000000006',
    programBatchId: PROGRAM_BATCH_ID,
    tagSlugs: ['academics', 'finals', 'batch-2024'],
  },
  {
    id: '60000000-0000-4000-8000-000000000005',
    title: 'Library Book Fair',
    description: 'Annual book fair hosted in the library lobby.',
    visibility: 'PUBLIC' as const,
    locationId: '10000000-0000-4000-8000-000000000006',
    programBatchId: PROGRAM_BATCH_ID,
    tagSlugs: ['event', 'batch-2024'],
  },
  // --- Arts and Sciences Bldg. (2 memories) ---
  {
    id: '60000000-0000-4000-8000-000000000006',
    title: 'Acoustic Night at the AS Bldg.',
    description:
      'Student bands played until midnight — one of the best nights on campus.',
    visibility: 'PUBLIC' as const,
    locationId: '10000000-0000-4000-8000-000000000020',
    programBatchId: PROGRAM_BATCH_ID,
    tagSlugs: ['music', 'night-event', 'batch-2024'],
  },
  {
    id: '60000000-0000-4000-8000-000000000007',
    title: 'Protest Rally for Academic Freedom',
    description: 'Students gathered at the AS Bldg. for a peaceful rally.',
    visibility: 'BATCH_ONLY' as const,
    locationId: '10000000-0000-4000-8000-000000000020',
    programBatchId: PROGRAM_BATCH_ID,
    tagSlugs: ['activism', 'batch-2025'],
  },
  // --- Amphitheater/Sunset Garden (1 memory) ---
  {
    id: '60000000-0000-4000-8000-000000000008',
    title: 'Lantern Parade 2024',
    description:
      'The entire garden lit up with handmade lanterns — a beautiful sight every December.',
    visibility: 'PUBLIC' as const,
    locationId: '10000000-0000-4000-8000-000000000035',
    programBatchId: PROGRAM_BATCH_ID,
    tagSlugs: ['tradition', 'event', 'batch-2024'],
  },
  // (remaining 46 locations have no seed memories — add more as needed)
] as const;

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function clearAll() {
  console.log('Clearing existing seed data...');
  // Delete in dependency order (children first)
  await prisma.memoryVote.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.programBatch.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.program.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.location.deleteMany();

  // Remove seed auth user if it exists
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  const existing = listData?.users?.find((u) => u.email === SEED_USER.email);
  if (existing) {
    await supabaseAdmin.auth.admin.deleteUser(existing.id);
    console.log('  ✓ Seed auth user removed');
  }

  console.log('  ✓ Tables cleared');
}

async function seedLocations() {
  console.log('Seeding locations...');
  await prisma.location.createMany({
    data: LOCATIONS.map(
      ({ id, buildingName, description, latitude, longitude }) => ({
        id,
        buildingName,
        description,
        latitude,
        longitude,
      })
    ),
  });
  console.log(`  ✓ ${LOCATIONS.length} locations created`);
}

async function seedTags() {
  console.log('Seeding tags...');
  await prisma.tag.createMany({
    data: TAGS.map(({ id, name, slug }) => ({ id, name, slug })),
  });
  console.log(`  ✓ ${TAGS.length} tags created`);
}

async function seedProgramBatch() {
  console.log('Seeding program / batch / programBatch...');

  await prisma.program.create({
    data: {
      id: PROGRAM_ID,
      name: 'BS Computer Science',
      description: 'Bachelor of Science in Computer Science',
    },
  });

  await prisma.batch.create({
    data: { id: BATCH_ID, year: BATCH_YEAR },
  });

  await prisma.programBatch.create({
    data: { id: PROGRAM_BATCH_ID, programId: PROGRAM_ID, batchId: BATCH_ID },
  });

  console.log('  ✓ Program, Batch, and ProgramBatch created');
}

async function ensureStorageBucket() {
  console.log('Ensuring storage bucket...');
  const { error } = await supabaseAdmin.storage.createBucket('memories', {
    public: true,
    allowedMimeTypes: ['image/*', 'video/*'],
    fileSizeLimit: 52428800, // 50 MB
  });
  // Ignore "already exists" error
  if (error && !error.message.includes('already exists')) {
    throw new Error(`Storage bucket creation failed: ${error.message}`);
  }
  console.log('  ✓ Storage bucket "memories" ready');
}

async function seedUser(): Promise<string> {
  console.log('Seeding user...');

  // Create auth user (email confirmed immediately so sign-in works without verification)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: SEED_USER.email,
    password: SEED_USER.password,
    email_confirm: true,
  });
  if (error) throw new Error(`Auth user creation failed: ${error.message}`);

  const userId = data.user.id;

  await prisma.user.create({
    data: {
      id: userId,
      studentId: SEED_USER.studentId,
      email: SEED_USER.email,
      firstName: SEED_USER.firstName,
      lastName: SEED_USER.lastName,
      programBatchId: PROGRAM_BATCH_ID,
    },
  });

  console.log(`  ✓ Seed user created: ${SEED_USER.email} (id: ${userId})`);
  return userId;
}

async function seedMemories(creatorId: string) {
  console.log('Seeding memories...');
  for (const mem of MEMORIES) {
    const { tagSlugs, ...fields } = mem;
    await prisma.memory.create({
      data: {
        ...fields,
        creatorId,
        tags:
          tagSlugs.length > 0
            ? { connect: tagSlugs.map((slug) => ({ slug })) }
            : undefined,
      },
    });
  }
  console.log(`  ✓ ${MEMORIES.length} memories created`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Starting seed...\n');
  await clearAll();
  await ensureStorageBucket();
  await seedLocations();
  await seedTags();
  await seedProgramBatch();
  const userId = await seedUser();
  await seedMemories(userId);
  console.log('\nSeed complete.');
  console.log(`\nSeed credentials:`);
  console.log(`  Email:    ${SEED_USER.email}`);
  console.log(`  Password: ${SEED_USER.password}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
