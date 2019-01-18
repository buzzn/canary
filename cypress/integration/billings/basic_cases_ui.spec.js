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
  meters: {
    meter1: {
      productSerialnumber: chance.natural({ min: 1000, max: 9999 }),
    },
    meter1: {
      productSerialnumber: chance.natural({ min: 1000, max: 9999 }),
    },
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

const case3 = {
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

    cy.get('[data-cy="sidebar tariffs"]').click();
    Object.values(groupParams.tariffs).forEach(tFields => {
      cy.get('[data-cy="add tariff CTA"]').click();
      const newTariff = {
        energypriceCentsPerKwh: chance.natural({ max: 500 }),
        basepriceCentsPerMonth: chance.natural({ max: 500 }),
        ...tFields,
      };
      cy.get('[data-cy="create tariff modal"]').within($modal => {
        fillForm(newTariff);
        cy.get('button[type=submit]').click();
      });
      cy.contains('.cy-name', newTariff.name).should('exist');
      cy.contains('.cy-begin-date', newTariff.beginDate).should('exist');
    });
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
    cy.get('.cy-item-details').should('have.length', 2);
    cy.contains('.cy-item-tariff-name', groupParams.tariffs.tariff1.name).should('exist');
    cy.contains('.cy-item-tariff-name', groupParams.tariffs.tariff2.name).should('exist');
    // billing 1
    cy.contains('.cy-item-begin-date', case1.billings.billing1.beginDate).should('exist');
    cy.contains(
      '.cy-item-last-date',
      moment(case1.billings.billing1.lastDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');
    cy.contains('.cy-item-begin-date', groupParams.tariffs.tariff2.beginDate).should('exist');
    cy.contains(
      '.cy-item-last-date',
      moment(groupParams.tariffs.tariff2.beginDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');
    // billing 2
    cy.contains('.cy-begin-date', case1.billings.billing2.beginDate).click();
    cy.get('.cy-item-details').should('have.length', 2);
    cy.contains('.cy-item-tariff-name', groupParams.tariffs.tariff1.name).should('exist');
    cy.contains('.cy-item-tariff-name', groupParams.tariffs.tariff2.name).should('exist');
    cy.contains('.cy-item-begin-date', case1.billings.billing2.beginDate).should('exist');
    cy.contains(
      '.cy-item-last-date',
      moment(case1.billings.billing2.lastDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');
    cy.contains('.cy-item-begin-date', case1.billings.billing1.lastDate).should('exist');
    cy.contains(
      '.cy-item-last-date',
      moment(case1.billings.billing1.beginDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');
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
      ...case2.meters.meter1,
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

    cy.get('[data-cy="add billing CTA"]').click();
    const newBilling = { ...case2.billings.billing1 };
    cy.get('[data-cy="create billing modal"]').within($modal => {
      fillForm(newBilling);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-begin-date', newBilling.beginDate).should('exist');
    cy.contains('.cy-begin-date', case2.billings.billing1.beginDate).click();
    cy.get('.cy-item-details').should('have.length', 2);
    cy.contains('.cy-item-tariff-name', groupParams.tariffs.tariff1.name).should('exist');
    cy.contains('.cy-item-tariff-name', groupParams.tariffs.tariff2.name).should('exist');
    // billing 1
    cy.contains('.cy-item-begin-date', case2.billings.billing1.beginDate).should('exist');
    cy.contains(
      '.cy-item-last-date',
      moment(case2.billings.billing1.lastDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');
    cy.contains('.cy-item-begin-date', groupParams.tariffs.tariff2.beginDate).should('exist');
    cy.contains(
      '.cy-item-last-date',
      moment(groupParams.tariffs.tariff2.beginDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');

    cy.get('[data-cy="sidebar system"]').click();
    cy.get('[data-cy="add malo CTA"]').click();
    const newMeter2 = {
      type: 'real',
      datasource: 'standard_profile',
      manufacturerName: 'easy_meter',
      edifactMeasurementMethod: 'MMR',
      directionNumber: 'ZRZ',
      ...case2.meters.meter2,
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
    cy.get('[data-cy="add billing CTA"]').click();
    const newBilling2 = { ...case2.billings.billing2 };
    cy.get('[data-cy="create billing modal"]').within($modal => {
      fillForm(newBilling2);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-begin-date', newBilling2.beginDate).should('exist');
    // billing 2
    cy.contains('.cy-begin-date', case2.billings.billing2.beginDate).click();
    cy.get('.cy-item-details').should('have.length', 2);
    cy.contains('.cy-item-tariff-name', groupParams.tariffs.tariff1.name).should('exist');
    cy.contains('.cy-item-tariff-name', groupParams.tariffs.tariff2.name).should('exist');
    cy.contains('.cy-item-begin-date', case2.billings.billing2.beginDate).should('exist');
    cy.contains(
      '.cy-item-last-date',
      moment(case2.billings.billing2.lastDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');
    cy.contains('.cy-item-begin-date', case2.billings.billing1.lastDate).should('exist');
    cy.contains(
      '.cy-item-last-date',
      moment(case2.billings.billing1.beginDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');
  });

  it('Case3', function() {
    cy.get('[data-cy="sidebar powertakers"]').click();
    cy.contains('.cy-number', '/3').should('not.to.exist');
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
      ...case3.powertaker,
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
    cy.contains('.cy-number', '/3').should('exist');

    cy.get('[data-cy="sidebar system"]').click();
    cy.contains('.cy-malo-name', newPowertaker['registerMeta.name']).should('exist');
    cy.get('[data-cy="add malo CTA"]').click();
    const newMeter = {
      type: 'real',
      datasource: 'standard_profile',
      manufacturerName: 'easy_meter',
      edifactMeasurementMethod: 'MMR',
      directionNumber: 'ZRZ',
      ...case3.meter,
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
    cy.contains('.cy-number', '/3').click();
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

    Object.values(case3.billings).forEach(bFields => {
      cy.get('[data-cy="add billing CTA"]').click();
      const newBilling = { ...bFields };
      cy.get('[data-cy="create billing modal"]').within($modal => {
        fillForm(newBilling);
        cy.get('button[type=submit]').click();
      });
      cy.contains('.cy-begin-date', newBilling.beginDate).should('exist');
    });
    cy.contains('.cy-begin-date', case3.billings.billing1.beginDate).click();
    cy.get('.cy-item-details').should('have.length', 1);
    cy.contains('.cy-item-tariff-name', groupParams.tariffs.tariff1.name).should('exist');
    // billing 1
    cy.contains('.cy-item-begin-date', case3.billings.billing1.beginDate).should('exist');
    cy.contains(
      '.cy-item-last-date',
      moment(case3.billings.billing1.lastDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');
    // billing 2
    cy.contains('.cy-begin-date', case3.billings.billing2.beginDate).click();
    cy.get('.cy-item-details').should('have.length', 1);
    cy.contains('.cy-item-tariff-name', groupParams.tariffs.tariff2.name).should('exist');
    cy.contains('.cy-item-begin-date', case3.billings.billing2.beginDate).should('exist');
    cy.contains(
      '.cy-item-last-date',
      moment(case3.billings.billing2.lastDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');
  });
});
