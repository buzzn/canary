/// <reference types="Cypress" />

import Chance from 'chance';
import moment from 'moment';

const chance = new Chance();

const fillForm = dataObj => {
  Object.keys(dataObj).forEach(key => {
    cy.get(`*[name="${key}"]`).within($field => {
      if ($field.prop('type') === 'select-one') {
        cy.root().select(dataObj[key]);
      } else if ($field.prop('type') === 'checkbox') {
        if (dataObj[key]) {
          cy.root().check({ force: true });
        } else {
          cy.root().uncheck({ force: true });
        }
      } else {
        cy.root()
          .clear()
          .type(dataObj[key]);
      }
    });
  });
};

const checkForm = (dataObj, i18nObj) => {
  Object.keys(dataObj).forEach(key => {
    if (typeof dataObj[key] === 'boolean') {
      cy.get(`*[name="${key}"]`).should(`${dataObj[key] === true ? '' : 'not.'}be.checked`);
    } else if (Object.keys(i18nObj).includes(key)) {
      // i18n hack
      cy.contains('.fieldvalue', i18nObj[key]).should('exist');
    } else {
      cy.contains('.fieldvalue', dataObj[key]).should('exist');
    }
  });
};

export default function addGroup(groupParams) {
  const groupName = chance.name();

  cy.get('[data-cy="global CTA"]').click();
  cy.get('[data-cy="create group link"]').click();
  cy.get('[data-cy="create group modal"]').within($modal => {
    cy.get('input[name="name"]').type(groupName);
    cy.get('input[name="address.street"]').type(chance.street());
    cy.get('input[name="address.city"]').type(chance.city());
    cy.get('input[name="address.zip"]').type(chance.zip());
    cy.get('button[type=submit]').click();
  });
  cy.contains('.fieldvalue', groupName).should('exist');

  cy.get('[data-cy="home link"]').click();
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
  cy.get('input[name="startDate"]').type(
    moment()
      .subtract(1, 'year')
      .format('DD.MM.YYYY'),
  );
  cy.get('[data-cy="form button save"]').click({ force: true });

  cy.get('[data-cy="sidebar documents"]').click();
  cy.contains('.cy-number', '/0').should('not.to.exist');
  cy.get('[data-cy="add contract CTA"]').click();
  cy.get('[data-cy="create contract modal"]').within($modal => {
    cy.get('select[name="type"]').select('contract_localpool_processing');
    cy.get('input[name="taxNumber"]').type(chance.integer({ min: 10000, max: 99999 }));
    cy.get('input[name="beginDate"]').type(
      moment()
        .subtract(1, 'year')
        .add(1, 'day')
        .format('DD.MM.YYYY'),
    );
    cy.get('button[type=submit]').click();
  });
  cy.contains('.cy-type-intl', 'Local Pool Processing').should('exist');
  cy.contains('.cy-number', '/0').should('exist');

  cy.get('[data-cy="sidebar tariffs"]').click();
  Object.values(groupParams.tariffs).forEach(tFields => {
    cy.get('[data-cy="add tariff CTA"]').click();
    const newTariff = {
      energypriceCentsPerKwh: chance.natural({ min: 1, max: 500 }),
      basepriceCentsPerMonth: chance.natural({ min: 1, max: 500 }),
      ...tFields,
    };
    cy.get('[data-cy="create tariff modal"]').within($modal => {
      fillForm(newTariff);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-name', newTariff.name).should('exist');
    cy.contains('.cy-begin-date', newTariff.beginDate).should('exist');
  });
}
