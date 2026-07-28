import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
    const password = await bcrypt.hash('changeme123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@school.local' },
        update: {},
        create: {
            email: 'admin@school.local',
            fullName: 'System Admin',
            passwordHash: password,
            role: Role.ADMIN,
        },
    });
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@school.local' },
        update: {},
        create: {
            email: 'teacher@school.local',
            fullName: 'Default Teacher',
            passwordHash: password,
            role: Role.TEACHER,
        },
    });
    const categories = [
        { name: 'Academics', description: 'Subjects, homework, exams' },
        { name: 'Facilities', description: 'Classrooms, washrooms, labs, library' },
        { name: 'Transport', description: 'Bus routes, timings, safety' },
        { name: 'Discipline', description: 'Bullying, harassment, safety' },
        { name: 'Cafeteria', description: 'Food quality, hygiene, prices' },
    ];
    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat,
        });
    }
    console.log('Seeded:', { admin: admin.email, teacher: teacher.email, categories: categories.length });
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map