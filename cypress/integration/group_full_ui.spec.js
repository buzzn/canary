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
    cy.get('.cy-groups-list').should('be.visible');
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

    cy.contains('.cy-number', '/1').click();
    cy.get('[data-cy="contract edit switch"]').click();
    const contractChanges = {
      forecastKwhPa: chance.natural({ max: 200000 }),
      originalSigningUser: chance.name(),
      mandateReference: chance.word(),
      confirmPricingModel: true,
      powerOfAttorney: true,
      otherContract: true,
      moveIn: true,
      authorization: true,
      meteringPointOperatorName: chance.word(),
      oldSupplierName: chance.word(),
      oldCustomerNumber: `${chance.word()}-${chance.natural({ max: 200000 })}`,
      oldAccountNumber: `${chance.word()}-${chance.natural({ max: 200000 })}`,
      thirdPartyBillingNumber: `${chance.word()}-${chance.natural({ max: 200000 })}`,
      thirdPartyRenterNumber: `${chance.word()}-${chance.natural({ max: 200000 })}`,
      shareRegisterWithGroup: true,
      shareRegisterPublicly: true,
      'registerMeta.name': chance.word(),
      'registerMeta.label': 'CONSUMPTION_COMMON',
      signingDate: moment()
        .add(3, 'day')
        .format('DD.MM.YYYY'),
      beginDate: moment()
        .add(1, 'day')
        .format('DD.MM.YYYY'),
      terminationDate: moment()
        .add(5, 'day')
        .format('DD.MM.YYYY'),
      endDate: moment()
        .add(7, 'day')
        .format('DD.MM.YYYY'),
    };
    cy.get('[data-cy="powertaker contract form"]').within($form => {
      Object.keys(contractChanges).forEach(key => {
        cy.get(`*[name="${key}"]`).within($field => {
          if ($field.prop('type') === 'select-one') {
            cy.root().select(contractChanges[key]);
          } else if ($field.prop('type') === 'checkbox') {
            if (contractChanges[key]) {
              cy.root().check({ force: true });
            } else {
              cy.root().uncheck({ force: true });
            }
          } else {
            cy.root()
              .clear()
              .type(contractChanges[key]);
          }
        });
      });
      cy.get('[data-cy="form button save"]').click();
    });
    Object.keys(contractChanges).forEach(key => {
      if (typeof contractChanges[key] === 'boolean') {
        cy.get(`*[name="${key}"]`).should(`${contractChanges[key] === true ? '' : 'not.'}be.checked`);
      } else if (key === 'registerMeta.label') {
        // i18n hack
        cy.contains('.fieldvalue', 'Consumption common').should('exist');
      } else {
        cy.contains('.fieldvalue', contractChanges[key]).should('exist');
      }
    });
  });
});
