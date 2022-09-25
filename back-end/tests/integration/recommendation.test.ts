import app from '../../src/app';
import supertest from 'supertest';
import { cleanDisconectTableFactory } from '../../prisma/factories/cleanDisconectTableFactory';
import { recommendationFactory } from '../../prisma/factories/recommendationFactory';
import { Recommendation } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { IHashTableRecommendation } from '../../prisma/factories/recommendationFactory';

beforeEach(async () => await cleanDisconectTableFactory.truncateRecommendationTable());

afterAll(async () => {
    await cleanDisconectTableFactory.truncateRecommendationTable();
    await cleanDisconectTableFactory.disconectPrisma();
});

describe('/POST /recommendations', () => {

    it('should return status 422 if an invalid schema is passed', async () => {

        const result = await supertest(app).post('/recommendations').send({});

        expect(result.status).toBe(422);

    });

    it('should return status 201 and a the recommendation created if it is correct and was not created before', async () => {
        const recommendation = recommendationFactory.createRecommendation();

        const result = await supertest(app).post('/recommendations').send(recommendation);

        const createRecommendation = await recommendationFactory.findRecommendationByName(recommendation.name);

        expect(result.status).toBe(201);
        expect(createRecommendation).toMatchObject(expect.objectContaining({
            id: expect.any(Number),
            ...recommendation,
            score: expect.any(Number)
        }));
    });

    it('should return status 409, if the recommendation that is trying to be created has already been created', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        const result = await supertest(app).post('/recommendations').send({ name: recommendation.name, youtubeLink: recommendation.youtubeLink });

        expect(result.status).toBe(409);
    })

});

describe('/GET /recommendations', () => {
    it('should return an array with ten recommendations if there are more or equal ten recommendations in database', async () => {
        await recommendationFactory.insertRecommendation(15) as void;

        const result = await supertest(app).get('/recommendations');

        expect(result.status).toBe(200);
        expect(result.body.length).toBe(10);
        expect(result.body[0]).toMatchObject(expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            youtubeLink: expect.any(String),
            score: expect.any(Number)
        }));
    });

    it('should return the exact recommendations number, if there is less than 10 recommendations on database', async () => {
        const count = faker.mersenne.rand(1, 9);
        await recommendationFactory.insertRecommendation(count);

        const result = await supertest(app).get('/recommendations');

        expect(result.status).toBe(200);
        expect(result.body.length).toBe(count);
        expect(result.body[0]).toMatchObject(expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            youtubeLink: expect.any(String),
            score: expect.any(Number)
        }));
    });
});

describe('/GET /recommendations/:id', () => {
    it('should return status 500 if id isnt convertable to number', async () => {
        const result = await supertest(app).get(`/recommendations/${faker.random.alpha()}`);
        expect(result.status).toBe(500);
    })

    it('should return status 404 if id isnt of a recommendation', async () => {
        const result = await supertest(app).get(`/recommendations/${faker.mersenne.rand()}`);

        expect(result.status).toBe(404);
    });

    it('/should return status 200 and the recommendation of the recommendation id', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        const result = await supertest(app).get(`/recommendations/${recommendation.id}`);

        expect(result.status).toBe(200);
        expect(result.body).toEqual(recommendation);
    });

});

describe('GET /recommendations/top/:amount', () => {
    it('should return status 500 if amount cant not be converted to number', async () => {
        const result = await supertest(app).get(`/recommendations/top/${faker.random.alpha()}`);

        expect(result.status).toBe(500);
    });
    it('should return status 200, recommendations in the amount passed and in the correct order', async () => {
        const lengthRecommendations = 5;
        const amount = 10;

        await recommendationFactory.insertRecommendation(lengthRecommendations)
        await recommendationFactory.updateVote(lengthRecommendations);

        const result = await supertest(app).get(`/recommendations/top/${amount}`);

        expect(result.status).toBe(200);
        expect(result.body[0].score).toBeGreaterThanOrEqual(result.body[1].score);
        expect(result.body[1].score).toBeGreaterThanOrEqual(result.body[lengthRecommendations - 1].score);
        expect(result.body[0]).toMatchObject(expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            score: expect.any(Number),
            youtubeLink: expect.any(String)
        }));
        expect(result.body.length).toBe(lengthRecommendations);
    });
});

describe('POST /recommendations/:id/upvote', () => {
    it('should return status 500 if id isnt convertable to number', async () => {

        const result = await supertest(app).get(`/recommendations/${faker.random.alpha()}`);

        expect(result.status).toBe(500);
    })

    it('should return status 404 if id isnt of a recommendation', async () => {

        const result = await supertest(app).get(`/recommendations/${faker.mersenne.rand()}`);

        expect(result.status).toBe(404);
    });

    it('should return status 200 and increase the score of a recommendation by the id', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        const result = await supertest(app).post(`/recommendations/${recommendation.id}/upvote`);

        const recommendationUpdated = await recommendationFactory.findRecommendationByName(recommendation.name);

        expect(result.status).toBe(200);
        expect(recommendationUpdated.score).toBe(recommendation.score + 1);
    })
});

describe('/POST /recommendations/:id/downvote', () => {
    it('should return status 500 if id isnt convertable to number', async () => {

        const result = await supertest(app).get(`/recommendations/${faker.random.alpha()}`);

        expect(result.status).toBe(500);
    })

    it('should return status 404 if id isnt of a recommendation', async () => {

        const result = await supertest(app).get(`/recommendations/${faker.mersenne.rand()}`);

        expect(result.status).toBe(404);
    });

    it('should return status 200 and downvote a recommendation by its id', async () => {

        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        const result = await supertest(app).post(`/recommendations/${recommendation.id}/downvote`);

        const recommendationUpdated = await recommendationFactory.findRecommendationByName(recommendation.name);

        expect(result.status).toBe(200);
        expect(recommendationUpdated.score).toBe(recommendation.score - 1);
    });

    it('should return status 200 and exclude if the recommendation downvote to less than -5', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        await recommendationFactory.updateVote(recommendation.id, 5, 'decrement');

        const result = await supertest(app).post(`/recommendations/${recommendation.id}/downvote`);

        const excludedRecommendation = await recommendationFactory.findRecommendationByName(recommendation.name);

        expect(result.status).toBe(200);
        expect(excludedRecommendation).toBeNull();
    });

});

describe('/GET /recommendations/random', () => {
    beforeEach(async () => await cleanDisconectTableFactory.truncateRecommendationTable());
    it('should return 404 status if there is no recommendation in database', async () => {

        const result = await supertest(app).get('/recommendations/random');

        expect(result.status).toBe(404);
    });

    it('should return status 200 and random musics if all recommendations have score less or equal 10', async () => {
        const recommendationLength = 100;
        await recommendationFactory.insertRecommendation(recommendationLength);

        const hashtable: IHashTableRecommendation = {};


        for (let i = 0; i < 10; i++) {
            const result = await supertest(app).get('/recommendations/random');
            if (hashtable[result.body.id] === undefined) hashtable[result.body.id] = 1;
            hashtable[result.body.id]++;
            expect(result.status).toBe(200);
        };

        expect(Object.entries(hashtable).length).toBeGreaterThanOrEqual(5);

    });

    it('should return status 200 and random recommendations if all recommendations have score above 10', async () => {
        const recommendationLength = 20;
        await recommendationFactory.insertRecommendation(recommendationLength) as void;
        for (let i = 0; i < recommendationLength; i++) {
            const id: number = i + 1;
            await recommendationFactory.updateVote(id, 15);
        }
        const hashtable: IHashTableRecommendation = {};
        for (let i = 0; i < 10; i++) {
            const result = await supertest(app).get('/recommendations/random');
            expect(result.status).toBe(200);
            if (hashtable[result.body.id] === undefined) hashtable[result.body.id] = 1;
            hashtable[result.body.id]++;
        }

        expect(Object.entries(hashtable).length).toBeGreaterThanOrEqual(5);
    });

    it('should return status 200 and a random recommendation with a score higher than 10 in 70% of this route usage', async () => {
        const recommendationsLength = 100;

        await recommendationFactory.insertRecommendation(recommendationsLength);

        for (let i = 0; i < 10; i++) {
            const id = i + 1;
            await recommendationFactory.updateVote(id, 15);
        };

        let countRecommendationsScoreAboveTen = 0;
        for (let i = 0; i < recommendationsLength; i++) {
            const result = await supertest(app).get('/recommendations/random');
            if (result.body.score > 10) countRecommendationsScoreAboveTen++;
            expect(result.status).toBe(200);
        }
        expect(countRecommendationsScoreAboveTen).toBeGreaterThan(0.65 * recommendationsLength);
    });

    it('should return status 200 and a recommendation with score less or equal ten and greatter than -5 in 30% of the cases', async () => {
        const recommendationLength: number = 100;
        await recommendationFactory.insertRecommendation(recommendationLength);

        let countRecommendations: number = 0;

        for (let i = 0; i < 10; i++) {
            const id: number = i + 1;
            await recommendationFactory.updateVote(id, 15);
        }

        for (let i = 0; i < recommendationLength; i++) {
            const result = await supertest(app).get('/recommendations/random');
            expect(result.status).toBe(200);
            if (result.body.score > -5 && result.body.score <= 10) countRecommendations++;
        }

        expect(countRecommendations).toBeGreaterThan(0.25 * recommendationLength);
    })

});