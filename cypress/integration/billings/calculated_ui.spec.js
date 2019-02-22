/// <reference types="Cypress" />

import Chance from 'chance';
import moment from 'moment';

import addGroup from './add_group_ui';

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

const groupParams = {
  tariffs: {
    tariff1: {
      name: chance.word(),
      beginDate: moment()
        .subtract(2, 'month')
        .format('DD.MM.YYYY'),
      energypriceCentsPerKwh: 20,
      basepriceCentsPerMonth: 26,
    },
  },
};

const case1 = {
  powertaker: {
    signingDate: moment()
      .subtract(1, 'month')
      .format('DD.MM.YYYY'),
    beginDate: moment()
      .subtract(1, 'month')
      .format('DD.MM.YYYY'),
    'registerMeta.name': chance.word(),
    'registerMeta.label': 'CONSUMPTION',
  },
  meter: {
    productSerialnumber: chance.natural({ min: 1000, max: 9999 }),
  },
  billing: {
    beginDate: moment()
      .subtract(18, 'days')
      .format('DD.MM.YYYY'),
    lastDate: moment()
      .subtract(10, 'days')
      .format('DD.MM.YYYY'),
  },
  readings: {
    beginReading: {
      value: 1000,
    },
    endReading: {
      value: 2000,
    },
  },
};

describe('Calculated billing tests UI', function() {
  before(function() {
    cy.login();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });

  it('Create group with basic contracts and tariffs', function() {
    cy.visit('/');
    addGroup(groupParams);
  });

  it('Case1', function() {
    cy.get('[data-cy="sidebar powertakers"]').click();
    cy.contains('.cy-number', '/1').should('not.to.exist');
    cy.get('[data-cy="add powertaker CTA"]').click();
    const newPowertaker = {
      'customer.prefix': 'M',
      'customer.title': 'Dr.',
      'customer.firstName': chance.first(),
      'customer.lastName': chance.last(),
      'customer.address.street': chance.street(),
      'customer.address.city': chance.city(),
      'customer.address.zip': chance.zip(),
      'customer.email': chance.email(),
      ...case1.powertaker,
    };
    cy.get('[data-cy="create powertaker form"]').within($form => {
      cy.get('[data-cy="powertaker radio person"]').click();
      fillForm(newPowertaker);
      cy.get('[data-cy="form button save"]').click();
    });
    cy.contains(
      '.cy-powertaker',
      `${newPowertaker['customer.lastName']} ${newPowertaker['customer.firstName']}`,
    ).should('exist');
    cy.contains('.cy-malo', newPowertaker['registerMeta.name']).should('exist');
    cy.contains('.cy-number', '/1').should('exist');

    cy.get('[data-cy="sidebar system"]').click();
    cy.contains('.cy-malo-name', newPowertaker['registerMeta.name']).should('exist');
    cy.get('[data-cy="add malo CTA"]').click();
    const newMeter = {
      type: 'real',
      datasource: 'standard_profile',
      manufacturerName: 'easy_meter',
      edifactMeasurementMethod: 'MMR',
      directionNumber: 'ZRZ',
      converterConstant: 1,
      ...case1.meter,
    };
    cy.get('[data-cy="create meter form"]').within($form => {
      cy.get('.cy-registers-0').click();
      cy.get('.cy-registers-0').within($dropdown => {
        cy.contains('.cy__option', newPowertaker['registerMeta.name']).click();
      });
      fillForm(newMeter);
      cy.get('[data-cy="form button save"]').click();
    });
    cy.contains('.cy-meter-serial', newMeter.productSerialnumber).should('exist');

    cy.get('[data-cy="sidebar powertakers"]').click();
    cy.contains('.cy-number', '/1').click();
    cy.get('[data-cy="contract billings tab"]').click();
    cy.get('[data-cy="manage tariffs CTA"]').click();
    cy.get('select[name="select-tariff"]').select(groupParams.tariffs.tariff1.name);
    cy.get('.cy-add-tariff').click();
    cy.contains('.cy-name', groupParams.tariffs.tariff1.name).should('exist');

    cy.contains('.cy-obis', '1-1:1.8.0').click();
    cy.get('[data-cy="register readings tab"]').click();
    cy.get('[data-cy="add reading CTA"]').click();
    const reading1Val = chance.natural({ max: 999 });
    const newReading = {
      rawValue: reading1Val,
      reason: 'IOM',
      readBy: 'BN',
      quality: '220',
      source: 'MAN',
      status: 'Z83',
      date: case1.powertaker.beginDate,
      comment: chance.sentence(),
    };
    cy.get('[data-cy="create reading modal"]').within($modal => {
      fillForm(newReading);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-date', newReading.date).should('exist');
    cy.contains('.cy-reason', 'Installation of meter').should('exist');

    cy.get('[data-cy="sidebar powertakers"]').click();
    cy.contains('.cy-number', '/1').click();
    cy.get('[data-cy="contract billings tab"]').click();
    cy.get('[data-cy="add billing CTA"]').click();
    cy.get('[data-cy="create billing modal"]').within($modal => {
      fillForm(case1.billing);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-begin-date', case1.billing.beginDate).should('exist');

    cy.get('[data-cy="contract payments tab"]').click({ force: true });
    cy.contains('[data-cy="total balance"]', 'Total balance: 0.00 €').should('exist');
    const addSum = 500;
    cy.get('[data-cy="account amount"]').type(addSum);
    cy.get('[data-cy="button add"]').click();
    cy.contains('.cy-account-amount', `${addSum}.00 €`).should('exist');
    cy.contains('[data-cy="total balance"]', `Total balance: ${addSum}.00 €`).should('exist');

    cy.get('[data-cy="contract billings tab"]').click();
    cy.contains('.cy-begin-date', case1.billing.beginDate).click({ force: true });
    cy.get('.cy-hw-begin-reading:contains(Add reading)').click();
    const beginReading = {
      rawValue: case1.readings.beginReading.value,
      source: 'MAN',
      comment: chance.sentence(),
    };
    cy.get('[data-cy="create reading modal"]').within($modal => {
      fillForm(beginReading);
      cy.get('button[type=submit]').click();
    });
    cy.wait(1000);
    cy.contains('.cy-begin-date', case1.billing.beginDate).click();
    cy.get('.cy-hw-end-reading:contains(Add reading)').click();
    const endReading = {
      rawValue: case1.readings.endReading.value,
      source: 'MAN',
      comment: chance.sentence(),
    };
    cy.get('[data-cy="create reading modal"]').within($modal => {
      fillForm(endReading);
      cy.get('button[type=submit]').click();
    });
    cy.wait(1000);
    cy.contains('.cy-begin-date', case1.billing.beginDate).click({ force: true });
    cy.get('[data-cy="billing edit switch"]').click();
    cy.get('select[name="status"]').select('calculated');
    cy.get('button[type=submit]').click();

    cy.get('[data-cy="contract payments tab"]').click({ force: true });
    // HACK: replace with real calculations
    cy.contains('[data-cy="total balance"]', 'Total balance: 261.92 €').should('exist');
    cy.contains('.cy-account-amount', '-238.08 €').should('exist');
  });
});
