// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
import { faker } from "@faker-js/faker";

import { recommendationFactory } from "../e2e/factories/recommendationFactory";

Cypress.Commands.add("createRecommendation", () => {
    const recommendation = {
        name: faker.music.songName(),
        youtubeLink: recommendationFactory.generateYoutubeLink(),
    };
    cy.request("POST", "/recommendations", recommendation).then((data) => {
        return cy.wrap(JSON.parse(data.requestBody));
    });
});
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
