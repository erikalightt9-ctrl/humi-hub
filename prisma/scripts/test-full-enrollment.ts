import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // First get a real courseId
    const course = await prisma.course.findFirst({ 
      where: { isActive: true }, 
      select: { id: true, title: true } 
    });
    
    if (!course) { console.log('NO ACTIVE COURSES'); return; }
    console.log('CourseId format:', course.id, '(is UUID?', course.id.includes('-'), ')');
    
    // Simulate the full processEnrollment flow
    const ip = '127.0.0.1';
    
    // 1. Record rate limit attempt
    await prisma.rateLimitAttempt.create({ data: { ip, endpoint: 'enrollment' } });
    console.log('✓ Rate limit recorded');
    
    // 2. Count enrollments by email
    const emailCount = await prisma.enrollment.count({ 
      where: { email: { equals: 'test@test.com', mode: 'insensitive' } } 
    });
    console.log('✓ Email count:', emailCount);
    
    // 3. Get tier config
    const tierConfig = await prisma.trainerTierConfig.findUnique({ where: { tier: 'BASIC' } });
    console.log('✓ Tier config:', tierConfig ? 'found' : 'null (ok)');
    
    // 4. Get course tier pricing
    const coursePricing = await prisma.course.findUnique({
      where: { id: course.id },
      select: { priceBasic: true, priceProfessional: true, priceAdvanced: true }
    });
    console.log('✓ Course pricing:', coursePricing);
    
    // 5. Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        fullName: 'Test Full Flow',
        dateOfBirth: new Date('1990-01-01'),
        email: 'fullflow-' + Date.now() + '@test.com',
        contactNumber: '+639171234567',
        address: '123 Test Street, Test City, Test Province',
        educationalBackground: 'Bachelor of Science in IT with honors',
        workExperience: 'sergsergersfgsreg',
        employmentStatus: 'EMPLOYED_PART_TIME',
        technicalSkills: ['gergwersgergser'],
        toolsFamiliarity: ['MICROSOFT_OFFICE'],
        whyEnroll: 'erthertgererthrnrtjthrtjtrjrtjyjrtherthrtyjhrtjtyjhrtyjrtjrthrtjht yhrtjytjrt eryge4hergeyhtrhergergerghre',
        courseId: course.id,
        courseTier: 'BASIC',
        ipAddress: ip,
        trainerId: null,
        baseProgramPrice: null,
        trainerTier: null,
        trainerUpgradeFee: null,
        scheduleId: null,
      }
    });
    console.log('✓ Enrollment created:', enrollment.id);
    
    // 6. Fetch course title
    const courseData = await prisma.course.findUnique({ 
      where: { id: enrollment.courseId }, 
      select: { title: true } 
    });
    console.log('✓ Course title:', courseData?.title);
    
    // Clean up
    await prisma.enrollment.delete({ where: { id: enrollment.id } });
    console.log('✓ Cleaned up');
    console.log('\n✅ ALL STEPS PASSED - enrollment flow works');
    
  } catch(e: any) {
    console.error('\n❌ FAILED AT STEP:', e.constructor.name);
    console.error('Message:', e.message);
    if (e.meta) console.error('Meta:', JSON.stringify(e.meta, null, 2));
    if (e.code) console.error('Prisma code:', e.code);
    console.error('Stack:', e.stack?.split('\n').slice(0,5).join('\n'));
  } finally {
    await prisma.$disconnect();
  }
}

main();
