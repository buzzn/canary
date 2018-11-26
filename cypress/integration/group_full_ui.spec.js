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
      // cy.screenshot('before_save');
      cy.get('button[type=submit]').click();
      // cy.screenshot('after_save_1');
    });
    // cy.screenshot('after_save_2');
    cy.visit('/');
    // cy.screenshot('group_list');
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
    cy.contains('.cy-number', '/0').should('not.to.exist');
    cy.get('[data-cy="add contract CTA"]').click();
    cy.get('[data-cy="create contract modal"]').within($modal => {
      cy.get('select[name="type"]').select('contract_localpool_processing');
      cy.get('input[name="taxNumber"]').type(chance.integer({ min: 10000, max: 99999 }));
      cy.get('input[name="beginDate"]').type(moment().format('DD.MM.YYYY'));
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-type-intl', 'Local Pool Processing').should('exist');
    cy.contains('.cy-number', '/0').should('exist');

    cy.get('[data-cy="sidebar powertakers"]').click();
    cy.contains('.cy-number', '/1').should('not.to.exist');
    cy.get('[data-cy="add powertaker CTA"]').click();
    const powertakerFName = chance.first();
    const powertakerLName = chance.last();
    const registerMetaName = chance.word();
    cy.get('[data-cy="create powertaker form"]').within($form => {
      cy.get('[data-cy="powertaker radio person"]').click();
      cy.get('select[name="customer.prefix"]').select('M');
      cy.get('select[name="customer.title"]').select('Dr.');
      cy.get('input[name="customer.firstName"]').type(powertakerFName);
      cy.get('input[name="customer.lastName"]').type(powertakerLName);
      cy.get('input[name="customer.address.street"]').type(chance.street());
      cy.get('input[name="customer.address.city"]').type(chance.city());
      cy.get('input[name="customer.address.zip"]').type(chance.zip());
      cy.get('input[name="customer.email"]').type(chance.email());

      cy.get('input[name="beginDate"]').type(moment().format('DD.MM.YYYY'));
      cy.get('input[name="registerMeta.name"]').type(registerMetaName);
      cy.get('select[name="registerMeta.label"]').select('CONSUMPTION');

      cy.get('[data-cy="form button save"]').click();
    });
    cy.contains('.cy-powertaker', `${powertakerLName} ${powertakerFName}`).should('exist');
    cy.contains('.cy-malo', registerMetaName).should('exist');
    cy.contains('.cy-number', '/1').should('exist');
  });
});
