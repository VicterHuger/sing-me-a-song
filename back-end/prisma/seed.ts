import { PrismaClient } from '@prisma/client';
import { CreateRecommendationData } from '../src/services/recommendationsService';
import { faker } from '@faker-js/faker'

// import { recommendationFactory } from './factories/recommendationFactory';

const prisma = new PrismaClient();

async function main() {
    // return await recommendationFactory.insertRecommendation();
    const count = 10;
    const recommendations: CreateRecommendationData[] = Array.from({ length: count }).map(() => {
        return {
            name: faker.music.songName(),
            youtubeLink: `https://www.youtube.com/watch?v=${faker.random.alphaNumeric(10)}`,
        }
    });

    await prisma.recommendation.createMany({
        data: recommendations,
        skipDuplicates: true,
    });
};

main().catch(err => {
    console.log(err);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});