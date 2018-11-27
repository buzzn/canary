/// <reference types="Cypress" />

import Chance from 'chance';

const chance = new Chance();

describe('Group UI', function() {
  before(function() {
    cy.login();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });

  it('Create and delete', function() {
    const groupName = chance.name();

    cy.visit('/');
    cy.get('[data-cy="global CTA"]').click();
    cy.get('[data-cy="create group link"]').click();
    cy.get('[data-cy="create group modal"]').within($modal => {
      cy.get('input[name="name"]').type(groupName);
      cy.get('input[name="address.street"]').type(chance.street());
      cy.get('input[name="address.city"]').type(chance.city());
      cy.get('input[name="address.zip"]').type(chance.zip());
      cy.get('button[type=submit]').click();
    });
    cy.visit('/');
    cy.get('.cy-groups-list').should('be.visible');
    cy.contains('.cy-group-name', groupName).click();
    cy.get('[data-cy="group edit switch"]').click();
    cy.get('[data-cy="group delete button"]').click();
    // FIXME: replace with proper data-cy !!!!!
    cy.get('.react-confirm-alert-button-group').within($buttons => {
      cy.get('button')
        .contains('Delete')
        .click();
    });
    cy.visit('/');
    cy.get('.cy-groups-list').should('be.visible');
    cy.contains('.cy-group-name', groupName).should('not.to.exist');
  });
});
