import { faker } from '@faker-js/faker';
import { Recommendation } from '@prisma/client';
import { prisma } from '../../src/database';

function createRecommendation() {
    return {
        name: faker.music.songName(),
        youtubeLink: `https://www.youtube.com/watch?v=MPGmsRgqUVQ`,
    };
}

async function insertRecommendation() {
    const recommendation = {
        name: faker.music.songName(),
        youtubeLink: `https://www.youtube.com/watch?v=MPGmsRgqUVQ`,
    }
    return await prisma.recommendation.create({
        data: recommendation
    })
};

async function findRecommendationByName(name: string) {
    return await prisma.recommendation.findUnique({ where: { name } });
}

export const recommendationFactory = {
    createRecommendation, insertRecommendation, findRecommendationByName
}