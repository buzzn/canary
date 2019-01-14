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
      lastDate: moment()
        .add(7, 'day')
        .format('DD.MM.YYYY'),
    };
    cy.get('[data-cy="powertaker contract form"]').within($form => {
      fillForm(contractChanges);
      cy.get('[data-cy="form button save"]').click();
    });
    checkForm(contractChanges, { 'registerMeta.label': 'Consumption - Common' });

    cy.get('[data-cy="sidebar documents"]').click();
    cy.get('[data-cy="add contract CTA"]').click();
    cy.get('[data-cy="create contract modal"]').within($modal => {
      cy.get('select[name="type"]').select('contract_metering_point_operator');
      cy.get('input[name="beginDate"]').type(moment().format('DD.MM.YYYY'));
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-type-intl', 'Metering Point Operator').should('exist');

    cy.get('[data-cy="sidebar system"]').click();
    cy.contains('.cy-malo-name', contractChanges['registerMeta.name']).should('exist');
    cy.get('[data-cy="add malo CTA"]').click();
    const meterSerial = chance.natural({ min: 1000, max: 9999 });
    const productionRegister = chance.word();
    const systemRegister = chance.word();
    cy.get('[data-cy="create meter form"]').within($form => {
      cy.get('.cy-registers-0').click();
      cy.get('.cy-registers-0').within($dropdown => {
        cy.contains('.cy__option', contractChanges['registerMeta.name']).click();
      });
      cy.get('.cy-add-register').as('moarRegisters');
      cy.get('@moarRegisters').click();
      cy.get('@moarRegisters').click();
      cy.get('input[name="registers[1].name"]').type(productionRegister);
      cy.get('select[name="registers[1].label"]').select('PRODUCTION_PV');
      cy.get('input[name="registers[2].name"]').type(systemRegister);
      cy.get('select[name="registers[2].label"]').select('DEMARCATION_PV');

      cy.get('select[name="type"]').select('real');
      cy.get('input[name="productSerialnumber"]').type(meterSerial);
      cy.get('select[name="datasource"]').select('standard_profile');
      cy.get('select[name="manufacturerName"]').select('easy_meter');
      cy.get('select[name="edifactMeasurementMethod"]').select('MMR');
      cy.get('select[name="directionNumber"]').select('ZRZ');

      cy.get('[data-cy="form button save"]').click();
    });
    cy.contains('.cy-meter-serial', meterSerial).should('exist');
    cy.get('[data-cy="production tab"]').click();
    cy.contains('.cy-malo-name', productionRegister).should('exist');
    cy.contains('.cy-meter-serial', meterSerial).should('exist');
    cy.get('[data-cy="system tab"]').click();
    cy.contains('.cy-malo-name', systemRegister).should('exist');
    cy.contains('.cy-meter-serial', meterSerial).should('exist');

    cy.contains('.cy-meter-serial', meterSerial).click();
    cy.get('[data-cy="meter edit switch"]').click();
    const meterChanges = {
      manufacturerDescription: chance.sentence(),
      productName: chance.word(),
      ownership: 'CUSTOMER',
      buildYear: 2017,
      calibratedUntil: moment()
        .add(1, 'year')
        .format('DD.MM.YYYY'),
      converterConstant: chance.natural({ max: 300 }),
      locationDescription: chance.sentence(),
      directionNumber: 'ERZ',
      productSerialnumber: chance.natural({ min: 1000, max: 9999 }),
      edifactCycleInterval: 'MONTHLY',
      edifactDataLogging: 'Z04',
      edifactMeterSize: 'Z01',
      edifactMeteringType: 'AHZ',
      edifactMountingMethod: 'BKE',
      edifactTariff: 'ETZ',
      edifactVoltageLevel: 'E06',
    };
    cy.get('[data-cy="edit meter form"]').within($form => {
      fillForm(meterChanges);
      cy.get('[data-cy="form button save"]').click();
    });
    checkForm(meterChanges, { ownership: 'Customer', directionNumber: 'One-Way Meter' });

    cy.get('[data-cy="sidebar system"]').click();
    cy.contains('.cy-malo-name', contractChanges['registerMeta.name']).click();
    cy.get('[data-cy="malo edit switch"]').click();
    const maloChanges = {
      observerEnabled: true,
      observerMinThreshold: chance.natural({ max: 1000 }),
      observerMaxThreshold: chance.natural({ min: 1000, max: 2000 }),
      observerOfflineMonitoring: true,
      marketLocationId: chance.string({ length: 11 }),
    };
    cy.get('[data-cy="edit malo form"]').within($form => {
      fillForm(maloChanges);
      cy.get('[data-cy="form button save"]').click();
    });
    checkForm(maloChanges, {});

    cy.get('[data-cy="malo registers tab"]').click();
    //FIXME: get obit from obj
    cy.contains('.cy-obis', '1-1:1.8.0').click();
    cy.get('[data-cy="register readings tab"]').click();
    cy.get('[data-cy="add reading CTA"]').click();
    const newReading = {
      rawValue: chance.natural({ max: 999 }),
      value: chance.natural({ max: 999 }),
      reason: 'PMR',
      readBy: 'BN',
      quality: '220',
      source: 'MAN',
      status: 'Z83',
      date: moment().format('DD.MM.YYYY'),
    };
    cy.get('[data-cy="create reading modal"]').within($modal => {
      fillForm(newReading);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-date', newReading.date).should('exist');
    cy.contains('.cy-reason', 'Periodic meter reading').should('exist');

    cy.get('[data-cy="sidebar devices"]').click();
    cy.get('[data-cy="add device CTA"]').click();
    const newDevice = {
      primaryEnergy: 'wind',
      law: 'eeg',
      manufacturer: chance.word(),
      model: chance.word(),
      name: chance.word(),
      kwPeak: chance.natural({ max: 9999 }),
      kwhPerAnnum: chance.natural({ max: 9999 }),
      commissioning: moment()
        .add(1, 'year')
        .format('DD.MM.YYYY'),
    };
    cy.get('[data-cy="create device modal"]').within($modal => {
      fillForm(newDevice);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-name', newDevice.name).click();
    checkForm(newDevice, { primaryEnergy: 'Wind', law: 'EEG' });

    const deviceChanges = {
      primaryEnergy: 'sun',
      law: 'free',
      manufacturer: chance.word(),
      model: chance.word(),
      name: chance.word(),
      kwPeak: chance.natural({ max: 9999 }),
      kwhPerAnnum: chance.natural({ max: 9999 }),
      commissioning: moment()
        .add(2, 'year')
        .format('DD.MM.YYYY'),
    };
    cy.get('[data-cy="device edit switch"]').click();
    cy.get('[data-cy="edit device form"]').within($form => {
      fillForm(deviceChanges);
      cy.get('[data-cy="form button save"]').click();
    });
    checkForm(deviceChanges, { primaryEnergy: 'Sun', law: 'Free' });

    cy.get('[data-cy="sidebar tariffs"]').click();
    cy.get('[data-cy="add tariff CTA"]').click();
    const newTariff = {
      name: chance.word(),
      beginDate: moment()
        .subtract(1, 'week')
        .format('DD.MM.YYYY'),
      energypriceCentsPerKwh: chance.natural(),
      basepriceCentsPerMonth: chance.natural(),
    };
    cy.get('[data-cy="create tariff modal"]').within($modal => {
      fillForm(newTariff);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-name', newTariff.name).should('exist');
    cy.contains('.cy-begin-date', newTariff.beginDate).should('exist');

    cy.get('[data-cy="sidebar tariffs"]').click();
    cy.get('[data-cy="add tariff CTA"]').click();
    const newTariff2 = {
      name: chance.word(),
      beginDate: moment()
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
      energypriceCentsPerKwh: chance.natural(),
      basepriceCentsPerMonth: chance.natural(),
    };
    cy.get('[data-cy="create tariff modal"]').within($modal => {
      fillForm(newTariff2);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-name', newTariff2.name).should('exist');
    cy.contains('.cy-begin-date', newTariff2.beginDate).should('exist');

    cy.get('[data-cy="sidebar powertakers"]').click();
    cy.contains('.cy-number', '/1').click();
    cy.get('[data-cy="contract billings tab"]').click();
    cy.get('[data-cy="manage tariffs CTA"]').click();
    cy.get('select[name="select-tariff"]').select(newTariff.name);
    cy.get('.cy-add-tariff').click();
    cy.contains('.cy-name', newTariff.name).should('exist');
    cy.get('[data-cy="manage tariffs CTA"]').click();
    cy.get('select[name="select-tariff"]').select(newTariff2.name);
    cy.get('.cy-add-tariff').click();
    cy.contains('.cy-name', newTariff2.name).should('exist');
    cy.contains(
      '.cy-last-date',
      moment(newTariff2.beginDate, 'DD.MM.YYYY')
        .subtract(1, 'day')
        .format('DD.MM.YYYY'),
    ).should('exist');
    cy.get('[data-cy="add billing CTA"]').click();
    const newBilling = {
      beginDate: moment()
        .add(1, 'day')
        .format('DD.MM.YYYY'),
      lastDate: moment()
        .add(4, 'days')
        .format('DD.MM.YYYY'),
      status: 'calculated',
      invoiceNumber: chance.word(),
    };
    cy.get('[data-cy="create billing modal"]').within($modal => {
      fillForm(newBilling);
      cy.get('button[type=submit]').click();
    });
    cy.contains('.cy-invoice-number', newBilling.invoiceNumber).should('exist');
    cy.contains('.cy-begin-date', newBilling.beginDate).should('exist');
  });
});
