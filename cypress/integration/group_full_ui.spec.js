/// <reference types="Cypress" />

import Chance from 'chance';
import moment from 'moment';

const chance = new Chance();

describe('Group full UI', function() {
  before(function() {
    cy.login();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });

  it('Create with basic contracts and powertaker', function() {
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
    cy.contains('.cy-group-name', groupName).click();

    cy.get('[data-cy="group owner tab"]').click();
    cy.get('[data-cy="group owner radio person"]').click();
    cy.get('[data-cy="group owner form"]').within($form => {
      const firstName = chance.first();
      const zip = chance.zip();
      cy.get('select[name="prefix"]').select('M');
      cy.get('select[name="title"]').select('Dr.');
      cy.get('input[name="firstName"]').type(firstName);
      cy.get('input[name="lastName"]').type(chance.last());
      cy.get('input[name="address.street"]').type(chance.street());
      cy.get('input[name="address.city"]').type(chance.city());
      cy.get('input[name="address.zip"]').type(zip);
      cy.get('input[name="email"]').type(chance.email());
      cy.get('[data-cy="form button save"]').click();
      cy.contains('.fieldvalue', firstName).should('exist');
      cy.contains('.fieldvalue', zip).should('exist');
    });

    cy.get('[data-cy="group settings tab"]').click();
    cy.get('[data-cy="group edit switch"]').click();
    cy.get('[data-cy="group delete button"]').should('not.to.exist');
    cy.get('[data-cy="form button cancel"]').click();

    cy.get('[data-cy="sidebar documents"]').click();
    cy.get('[data-cy="add contract CTA"]').click();
    cy.get('[data-cy="create contract modal"]').within($modal => {
      cy.get('select[name="type"]').select('contract_localpool_processing');
      cy.get('input[name="taxNumber"]').type(chance.integer({ min: 10000, max: 99999 }));
      cy.get('input[name="beginDate"]').type(moment().format('DD.MM.YYYY'));
      cy.get('button[type=submit]').click();
    });
  });
});
