import app from '../../src/app';
import supertest from 'supertest';
import { cleanDisconectTableFactory } from '../../prisma/factories/cleanDisconectTableFactory';
import { recommendationFactory } from '../../prisma/factories/recommendationFactory';
import { Recommendation } from '@prisma/client';
import { faker } from '@faker-js/faker';

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
    it('should return status 404 if id isnt of a recommendation', async () => {
        const result = await supertest(app).get(`/recommendations/${faker.mersenne.rand()}`);

        expect(result.status).toBe(404);
    });
    it('/should return status 200 and the recommendation of the recommendation id', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        const result = await supertest(app).get(`/recommendations/${recommendation.id}`);

        expect(result.status).toBe(200);
        expect(result.body).toEqual(recommendation);
    })

})