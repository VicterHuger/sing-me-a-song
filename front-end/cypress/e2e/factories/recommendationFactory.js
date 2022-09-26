import { faker } from "@faker-js/faker";

function generateYoutubeLink() {
    return `https://www.youtube.com/watch?v=${faker.random.alphaNumeric(10)}`;
}

function createRecommendation() {
    return {
        name: faker.music.songName(),
        youtubeLink: recommendationFactory.generateYoutubeLink(),
    };
}

export const recommendationFactory = {
    generateYoutubeLink,
    createRecommendation,
};
