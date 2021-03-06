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
    },
    tariff2: {
      name: chance.word(),
      beginDate: moment()
        .subtract(15, 'days')
        .format('DD.MM.YYYY'),
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
  billings: {
    billing1: {
      beginDate: moment()
        .subtract(18, 'days')
        .format('DD.MM.YYYY'),
      lastDate: moment()
        .subtract(10, 'days')
        .format('DD.MM.YYYY'),
    },
    billing2: {
      beginDate: moment()
        .subtract(1, 'month')
        .format('DD.MM.YYYY'),
      lastDate: moment().format('DD.MM.YYYY'),
    },
  },
};

const case2 = {
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
  billings: {
    billing1: {
      beginDate: moment()
        .subtract(1, 'month')
        .format('DD.MM.YYYY'),
      lastDate: groupParams.tariffs.tariff2.beginDate,
      // lastDate: moment(groupParams.tariffs.tariff2.beginDate, 'DD.MM.YYYY')
      //   .subtract(1, 'day')
      //   .format('DD.MM.YYYY'),
    },
    billing2: {
      beginDate: groupParams.tariffs.tariff2.beginDate,
      lastDate: moment().format('DD.MM.YYYY'),
    },
  },
};

describe('Basic billing mess tests UI', function() {
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
    Object.values(groupParams.tariffs).forEach(tFields => {
      cy.get('[data-cy="manage tariffs CTA"]').click();
      cy.get('select[name="select-tariff"]').select(tFields.name);
      cy.get('.cy-add-tariff').click();
      cy.contains('.cy-name', tFields.name).should('exist');
    });
    cy.contains(
      '.cy-last-date',
      moment(groupParams.tariffs.tariff2.beginDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');

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
    Object.values(case1.billings).forEach(bFields => {
      cy.get('[data-cy="add billing CTA"]').click();
      const newBilling = { ...bFields };
      cy.get('[data-cy="create billing modal"]').within($modal => {
        fillForm(newBilling);
        cy.get('button[type=submit]').click();
      });
      cy.contains('.cy-begin-date', newBilling.beginDate).should('exist');
    });
    cy.contains('.cy-begin-date', case1.billings.billing1.beginDate).click();
    cy.get('.cy-hw-meter-serial').should('have.length', 2);
    cy.contains('.cy-item-tariff', groupParams.tariffs.tariff1.name).should('exist');
    cy.contains('.cy-item-tariff', groupParams.tariffs.tariff2.name).should('exist');
    // billing 1
    cy.get('.cy-hw-begin-reading:contains(Add reading)').should('have.length', 2);
    cy.get('.cy-hw-end-reading:contains(Add reading)').should('have.length', 2);
    cy.contains(
      '.cy-hw-dates',
      `${case1.billings.billing1.beginDate} - ${groupParams.tariffs.tariff2.beginDate}`,
    ).should('exist');
    cy.contains(
      '.cy-hw-dates',
      `${groupParams.tariffs.tariff2.beginDate} - ${case1.billings.billing1.lastDate}`,
    ).should('exist');

    // billing 2
    cy.contains('.cy-begin-date', case1.billings.billing2.beginDate).click();
    cy.get('.cy-hw-meter-serial').should('have.length', 2);
    cy.contains('.cy-item-tariff', groupParams.tariffs.tariff1.name).should('exist');
    cy.contains('.cy-item-tariff', groupParams.tariffs.tariff2.name).should('exist');
    cy.get('.cy-hw-begin-reading:contains(Add reading)').should('have.length', 1);
    cy.get('.cy-hw-end-reading:contains(Add reading)').should('have.length', 2);
    cy.contains('.cy-hw-dates', `${case1.billings.billing2.beginDate} - ${case1.billings.billing1.beginDate}`).should(
      'exist',
    );
    cy.contains('.cy-hw-dates', `${case1.billings.billing1.lastDate} - ${case1.billings.billing2.lastDate}`).should(
      'exist',
    );
  });

  it('Case2', function() {
    cy.get('[data-cy="sidebar powertakers"]').click();
    cy.contains('.cy-number', '/2').should('not.to.exist');
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
      ...case2.powertaker,
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
    cy.contains('.cy-number', '/2').should('exist');

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
      ...case2.meter,
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
    cy.contains('.cy-number', '/2').click();
    cy.get('[data-cy="contract billings tab"]').click();
    Object.values(groupParams.tariffs).forEach(tFields => {
      cy.get('[data-cy="manage tariffs CTA"]').click();
      cy.get('select[name="select-tariff"]').select(tFields.name);
      cy.get('.cy-add-tariff').click();
      cy.contains('.cy-name', tFields.name).should('exist');
    });
    cy.contains(
      '.cy-last-date',
      moment(groupParams.tariffs.tariff2.beginDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');

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
      date: case2.powertaker.beginDate,
      comment: chance.sentence(),
    };
    cy.get('[data-cy="create reading modal"]').within($modal => {
      fillForm(newReading);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-date', newReading.date).should('exist');
    cy.contains('.cy-reason', 'Installation of meter').should('exist');

    cy.get('[data-cy="sidebar powertakers"]').click();
    cy.contains('.cy-number', '/2').click();
    cy.get('[data-cy="contract billings tab"]').click();
    Object.values(case2.billings).forEach(bFields => {
      cy.get('[data-cy="add billing CTA"]').click();
      const newBilling = { ...bFields };
      cy.get('[data-cy="create billing modal"]').within($modal => {
        fillForm(newBilling);
        cy.get('button[type=submit]').click();
      });
      cy.contains('.cy-begin-date', newBilling.beginDate).should('exist');
    });
    // HACK
    cy.wait(1000);
    // HACK_END
    cy.contains('.cy-begin-date', case2.billings.billing1.beginDate).click();
    cy.get('.cy-hw-meter-serial').should('have.length', 1);
    cy.contains('.cy-item-tariff', groupParams.tariffs.tariff1.name).should('exist');
    // billing 1
    cy.get('.cy-hw-begin-reading:contains(Add reading)').should('not.exist');
    cy.get('.cy-hw-end-reading:contains(Add reading)').should('exist');
    cy.contains(
      '.cy-hw-dates',
      `${case2.billings.billing1.beginDate} - ${groupParams.tariffs.tariff2.beginDate}`,
    ).should('exist');
    // billing 2
    // HACK
    cy.contains('.cy-begin-date', case2.billings.billing2.beginDate)
      .parent('.rt-tr')
      .get('.rt-expandable')
      .first()
      .click({ force: true });
    // HACK_END
    cy.get('.cy-hw-meter-serial').should('have.length', 1);
    cy.contains('.cy-item-tariff', groupParams.tariffs.tariff2.name).should('exist');
    cy.contains(
      '.cy-hw-dates',
      `${groupParams.tariffs.tariff2.beginDate} - ${case2.billings.billing2.lastDate}`,
    ).should('exist');
  });
});
