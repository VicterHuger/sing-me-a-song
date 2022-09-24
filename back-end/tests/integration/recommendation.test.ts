import app from '../../src/app';
import supertest from 'supertest';
import { cleanDisconectTableFactory } from '../factories/cleanDisconectTableFactory';
import { recommendationFactory } from '../factories/recommendationFactory';

beforeEach(async () => await cleanDisconectTableFactory.truncateRecommendationTable());


describe('/POST /recommendations', () => {

    afterAll(async () => {
        await cleanDisconectTableFactory.truncateRecommendationTable();
        await cleanDisconectTableFactory.disconectPrisma();
    });

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
        const recommendation = await recommendationFactory.insertRecommendation();

        const result = await supertest(app).post('/recommendations').send({ name: recommendation.name, youtubeLink: recommendation.youtubeLink });

        expect(result.status).toBe(409);
    })

})