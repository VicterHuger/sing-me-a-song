import { prisma } from '../../src/database';

async function truncateRecommendationTable() {
    await prisma.$executeRaw`TRUNCATE TABLE recommendations RESTART IDENTITY`;
}

async function disconectPrisma() {
    await prisma.$disconnect();
}

export const cleanDisconectTableFactory = {
    truncateRecommendationTable, disconectPrisma
}