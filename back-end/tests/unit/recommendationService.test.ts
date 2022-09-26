import { recommendationFactory } from "../../prisma/factories/recommendationFactory";
import { cleanDisconectTableFactory } from "../../prisma/factories/cleanDisconectTableFactory";
import { recommendationRepository } from "../../src/repositories/recommendationRepository";
import { recommendationService } from "../../src/services/recommendationsService";
import { conflictError, notFoundError } from "../../src/utils/errorUtils";
import { jest } from '@jest/globals';
import { Recommendation } from "@prisma/client";
import { faker } from "@faker-js/faker";

beforeEach(async () => {
    await cleanDisconectTableFactory.truncateRecommendationTable();
    // jest.resetAllMocks();
    jest.clearAllMocks();
});

afterAll(async () => {
    await cleanDisconectTableFactory.truncateRecommendationTable();
    await cleanDisconectTableFactory.disconectPrisma();
});

describe('insert', () => {

    it('should return "Recommendations names must be unique" mesage and do not create a recommendation if it is trying to create a recommendation that already exist', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        jest.spyOn(recommendationRepository, "findByName").mockResolvedValueOnce(recommendation);
        jest.spyOn(recommendationRepository, "create").mockImplementationOnce((): any => { });

        const promise = recommendationService.insert({ name: recommendation.name, youtubeLink: recommendation.youtubeLink });

        expect(promise).rejects.toEqual(conflictError("Recommendations names must be unique"));
        expect(recommendationRepository.create).not.toBeCalled();
        expect(recommendationRepository.findByName).toBeCalledWith(recommendation.name);

    });

    it('should create the recommendation on database if the recommendation passed is correct', async () => {
        const recommendation = recommendationFactory.createRecommendation();

        jest.spyOn(recommendationRepository, 'findByName').mockImplementationOnce((): any => { });
        jest.spyOn(recommendationRepository, 'create').mockImplementationOnce((): any => { });

        const result = await recommendationService.insert(recommendation);

        expect(recommendationRepository.findByName).toBeCalledWith(recommendation.name);
        expect(recommendationRepository.create).toBeCalledWith(recommendation);
        expect(result).toBeFalsy();

    });
});

describe('upvote', () => {

    it('should return not found error message if the id of the recommendation passed doesnt exist', async () => {
        const id = faker.mersenne.rand();

        jest.spyOn(recommendationRepository, 'find').mockImplementationOnce((): any => { });
        jest.spyOn(recommendationRepository, 'updateScore').mockImplementationOnce((): any => { });

        const promise = recommendationService.upvote(id);

        expect(promise).rejects.toEqual(notFoundError());
        expect(recommendationRepository.updateScore).not.toBeCalled();
        expect(recommendationRepository.find).toBeCalledWith(id);

    });
    it('should increase the vote of a recommendation by one', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(recommendation);
        jest.spyOn(recommendationRepository, 'updateScore').mockResolvedValueOnce({ ...recommendation, score: recommendation.score++ });
        const result = await recommendationService.upvote(recommendation.id);

        expect(recommendationRepository.updateScore).toBeCalledWith(recommendation.id, 'increment');
        expect(result).toBeFalsy();
        expect(recommendationRepository.find).toBeCalledWith(recommendation.id);
    })
});

describe('downvote', () => {
    beforeEach(async () => {
        await cleanDisconectTableFactory.truncateRecommendationTable();
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    it('should return not found message if the id passed is not of recommendation', async () => {
        const id = faker.mersenne.rand();

        jest.spyOn(recommendationRepository, 'find').mockImplementationOnce((): any => { });
        jest.spyOn(recommendationRepository, 'updateScore').mockImplementationOnce((): any => { });
        const promise = recommendationService.downvote(id);

        expect(promise).rejects.toEqual(notFoundError());
        expect(recommendationRepository.updateScore).not.toBeCalled();
        expect(recommendationRepository.find).toBeCalledWith(id);

    });

    it('should downvote a registered recommendation and return void', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(recommendation);
        jest.spyOn(recommendationRepository, 'updateScore').mockResolvedValueOnce({ ...recommendation, score: recommendation.score-- });
        jest.spyOn(recommendationRepository, 'remove').mockResolvedValueOnce(null);
        const result = await recommendationService.downvote(recommendation.id);

        expect(recommendationRepository.find).toBeCalledWith(recommendation.id);
        expect(recommendationRepository.updateScore).toBeCalledWith(recommendation.id, 'decrement');
        expect(recommendationRepository.remove).not.toBeCalled();
        expect(result).toBeFalsy();
    });

    it('should downvote a recommendation and remove the recommendation if its score get lower than -5', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;
        const updatedRecommendation = await recommendationFactory.updateVote(recommendation.id, -5);
        const removedRecommendation = await recommendationFactory.updateVote(updatedRecommendation.id, -1);

        console.log(updatedRecommendation);

        jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(recommendation);
        jest.spyOn(recommendationRepository, 'updateScore').mockResolvedValueOnce(removedRecommendation);
        jest.spyOn(recommendationRepository, 'remove').mockResolvedValue(null);
        const result = await recommendationService.downvote(updatedRecommendation.id);

        expect(result).toBeFalsy();
        expect(recommendationRepository.find).toBeCalledWith(recommendation.id);
        expect(recommendationRepository.updateScore).toBeCalledWith(recommendation.id, "decrement");
        expect(recommendationRepository.remove).toBeCalledWith(recommendation.id);
    });
});

describe('getByIdOrFail', () => {

    it('should return not found error message if it is passed an invalid id', async () => {
        const id = faker.mersenne.rand();

        jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(null);
        const promise = recommendationService.getById(id);

        expect(promise).rejects.toEqual(notFoundError());
        expect(recommendationRepository.find).toBeCalledWith(id);
    });
    it('should return the recommendation registered by a valid id passed', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(recommendation);

        const result = await recommendationService.getById(recommendation.id);

        expect(result).toEqual(recommendation);
        expect(recommendationRepository.find).toBeCalledWith(recommendation.id);
    });
});

describe('get', () => {

    it('should return an array of recommendations', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce([recommendation]);
        const result = await recommendationService.get();

        expect(result[0]).toBe(recommendation);
        expect(recommendationRepository.findAll).toBeCalled();

    });
});

describe('getTop', () => {

    it('should return an array of recommendations ordered by score with a length passed as an param', async () => {
        const amount = 10;
        await recommendationFactory.insertRecommendation(amount);
        const updatedRecommendation = await recommendationFactory.updateVote(amount);

        jest.spyOn(recommendationRepository, 'getAmountByScore').mockResolvedValueOnce([updatedRecommendation]);
        const result = await recommendationService.getTop(amount);

        expect(result).toEqual(expect.arrayContaining([updatedRecommendation]));
        expect(recommendationRepository.getAmountByScore).toBeCalledWith(amount);
    });
});

describe('getRandom', () => {


    it('should return not found if there is no recommendation in database', async () => {
        const random = 0.5;

        jest.spyOn(Math, 'random').mockReturnValueOnce(random);
        jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce([]).mockResolvedValueOnce([]);
        const promise = recommendationService.getRandom();

        expect(promise).rejects.toEqual(notFoundError());
        expect(Math.random).toBeCalled();
        expect(recommendationRepository.findAll).toHaveBeenNthCalledWith(1, { score: 10, scoreFilter: 'gt' });
        // expect(recommendationRepository.findAll).toHaveBeenCalledTimes(2);
        // expect(recommendationRepository.findAll).toBeCalledTimes(2);
    })

    it('should return a random recommendation with score more than 10 in 70% of the times', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;
        const recommendationOther = await recommendationFactory.insertRecommendation() as Recommendation;
        const updatedRecommendation = await recommendationFactory.updateVote(recommendation.id, 11);

        jest.spyOn(Math, 'random').mockReturnValueOnce(0.5);
        jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce([updatedRecommendation]);
        jest.spyOn(Math, 'floor').mockReturnValueOnce(0);

        const result = await recommendationService.getRandom();

        expect(result).toBe(updatedRecommendation);
        expect(result).not.toBe(recommendationOther);
        expect(recommendationRepository.findAll).toBeCalledWith({ score: 10, scoreFilter: 'gt' });
        expect(Math.random).toBeCalled();
        expect(Math.floor).toBeCalled();

    });

    it('should return a recommendation with a score less than 10 in 30% of times', async () => {
        const recommendationWithHighScore = await recommendationFactory.insertRecommendation() as Recommendation;
        const targetRecommendaton = await recommendationFactory.insertRecommendation() as Recommendation;
        const updatedRecommendation = await recommendationFactory.updateVote(recommendationWithHighScore.id, 11);

        jest.spyOn(Math, 'random').mockReturnValueOnce(0.75);
        jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce([targetRecommendaton]);
        jest.spyOn(Math, 'floor').mockReturnValueOnce(0);

        const result = await recommendationService.getRandom();

        expect(result).toBe(targetRecommendaton);
        expect(result).not.toBe(updatedRecommendation);
        expect(Math.random).toBeCalled();
        expect(recommendationRepository.findAll).toBeCalledWith({ score: 10, scoreFilter: 'lte' });
        expect(Math.floor).toBeCalled();
    });

    it('should return any recommendation with all recommendations are scored less than 10', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;

        jest.spyOn(Math, 'random').mockReturnValueOnce(0.5);
        jest.spyOn(Math, 'floor').mockReturnValueOnce(0);
        jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce([recommendation]);
        const result = await recommendationService.getRandom();

        expect(result).toBe(recommendation);
        expect(Math.random).toBeCalled();
        expect(Math.floor).toBeCalled();
        expect(recommendationRepository.findAll).toBeCalledWith({ score: 10, scoreFilter: 'gt' });

    });

    it('should return any recommendation with all recommendations are scored more than 10', async () => {
        const recommendation = await recommendationFactory.insertRecommendation() as Recommendation;
        const updatedRecommendation = await recommendationFactory.updateVote(recommendation.id, 11);

        jest.spyOn(Math, 'random').mockReturnValueOnce(0.5);
        jest.spyOn(Math, 'floor').mockReturnValueOnce(0);
        jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce([updatedRecommendation]);
        const result = await recommendationService.getRandom();

        expect(result).toBe(updatedRecommendation);
        expect(Math.random).toBeCalled();
        expect(Math.floor).toBeCalled();
        expect(recommendationRepository.findAll).toBeCalledWith({ score: 10, scoreFilter: 'gt' });

    });
})


