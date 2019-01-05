/// <reference types="Cypress" />

import omitDeep from 'omit-deep-lodash';
import Chance from 'chance';

const chance = new Chance();

describe('WebsiteForm API', function() {
  before(function() {
    cy.login();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });

  const headers = { Accept: 'application/json', 'Content-type': 'application/json' };

  const zipToPrice = {
    annual_kwh: 1600,
    zip: '82444',
    type: 'single',
  };
  it('zip to price calculation', function() {
    cy.request({
      url: `${Cypress.env('SERVER_URL')}/api/website/zip-to-price`,
      method: 'POST',
      headers,
      body: zipToPrice,
    }).then(res => {
      expect(res.status).to.eq(200);
    });
  });

  const websiteForm = {
    calculator: {
      type: 'single',
      zip: '82444',
      annual_kwh: '1600',
      customerType: 'person',
      group: 'group1',
    },
    personalInfo: {
      person: {
        prefix: 'herr',
        firstName: chance.first(),
        lastName: chance.last(),
        // do not use chance for this!!!!! Email must be completely fake.
        email: 'test@testtesttestunavail.cc',
      },
    },
    address: {
      person: {
        shippingAddress: {
          zip: '82444',
          city: chance.city(),
          street: chance.street(),
          houseNum: chance.natural(),
        },
      },
    },
    oldSupplier: {
      type: 'change',
      previousProvider: chance.word(),
      meterNumber: chance.string({ length: 20 }),
    },
    bank: {
      withoutSepa: true,
    },
    agreement: {
      buzznSupplyAgreement: true,
      generalAgreement: true,
    },
    price: {
      baseprice_cents_per_month: 1160,
      energyprice_cents_per_kilowatt_hour: 28.3,
      total_cents_per_month: 4933,
    },
  };
  it('new website form', function() {
    cy.request({
      url: `${Cypress.env('SERVER_URL')}/api/website/website-forms`,
      method: 'POST',
      headers,
      body: { form_name: 'powertaker_v1', form_content: JSON.stringify(websiteForm) },
    }).then(res => {
      expect(res.status).to.eq(201);

      const token = JSON.parse(localStorage.getItem('buzznAuthTokens')).token;
      const formId = res.body.id;
      cy.request({
        url: `${Cypress.env('SERVER_URL')}/api/website/website-forms`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(forms => {
        expect(forms.status).to.eq(200);
        expect(forms.body.array.find(f => f.id === formId).id).to.eq(formId);
      });

      cy.request({
        url: `${Cypress.env('SERVER_URL')}/api/website/website-forms/${formId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(form => {
        expect(form.status).to.eq(200);
        expect(form.body.id).to.eq(formId);
        expect(omitDeep(form.body.form_content, ['id', 'created_at', 'updated_at'])).to.deep.eq(websiteForm);
      });
    });
  });
});
