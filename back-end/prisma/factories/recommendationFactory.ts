import { faker } from '@faker-js/faker';
import { Recommendation } from '@prisma/client';
import { CreateRecommendationData } from '../../src/services/recommendationsService';
import { prisma } from '../../src/database';

function createRecommendation(): CreateRecommendationData {
    return {
        name: faker.music.songName(),
        youtubeLink: `https://www.youtube.com/watch?v=${faker.random.alphaNumeric(10)}`,
    };
}

async function insertRecommendation(count?: number): Promise<void | Recommendation> {
    if (count === undefined) {
        return await prisma.recommendation.create({
            data: createRecommendation(),
        });
    };

    const recommendations: CreateRecommendationData[] = Array.from({ length: count }).map(() => {
        return createRecommendation();
    });

    await prisma.recommendation.createMany({
        data: recommendations,
        skipDuplicates: true,
    });
    return;
};

async function findRecommendationByName(name: string) {
    return await prisma.recommendation.findUnique({ where: { name } });
}

async function updateUpVote(id: number) {
    return await prisma.recommendation.update({
        where: {
            id
        },
        data: {
            score: { increment: 1 }
        }
    })
}

export const recommendationFactory = {
    createRecommendation, insertRecommendation, findRecommendationByName, updateUpVote
}