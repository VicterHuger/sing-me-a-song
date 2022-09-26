import { faker } from "@faker-js/faker";

import { recommendationFactory } from "./factories/recommendationFactory";

describe("Create a recommendation", () => {
  it("should create a recommendation if the body information passed is correct", () => {
    cy.visit("http://localhost:3000/");

    const recommendation = recommendationFactory.createRecommendation();

    cy.get('[data-test-id="nameInput"]').type(recommendation.name);
    cy.get('[data-test-id="youtubeLinkInput"]').type(
      recommendation.youtubeLink
    );
    // cy.createRecommendation().then((recommendation) => {
    //   cy.get('[data-test-id="nameInput"]').type(recommendation.name);
    //   cy.get('[data-test-id="youtubeLinkInput"]').type(
    //     recommendation.youtubeLink
    //   );
    // });

    cy.intercept("POST", "/recommendations").as("createRecommendation");

    cy.get('[data-test-id="submitButton"]').click();

    cy.wait("@createRecommendation").should(({ response }) => {
      expect(response.statusCode).to.eq(201);
    });
    cy.url().should("equal", "http://localhost:3000/");
  });
});
