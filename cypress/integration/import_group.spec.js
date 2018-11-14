/// <reference types="Cypress" />

import omitDeep from 'omit-deep-lodash';

describe('Import group', function() {
  before(function() {
    cy.login();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });

  it('canary group', function() {
    cy.fixture(`import_group_${Cypress.env('MODE')}`).then(groupData => {
      const token = JSON.parse(localStorage.getItem('buzznAuthTokens')).token;
      cy.request({
        url: `${Cypress.env('SERVER_URL')}/api/admin/localpools/${
          groupData.id
        }?include=tariffs,address,distribution_system_operator,transmission_system_operator,electricity_supplier,owner:[bank_accounts,address,legal_representation,contact:[bank_accounts,address]],gap_contract_customer:[address,bank_accounts,contact:[address]]`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(response => {
        if (Cypress.env('MODE') === 'dev') {
          expect(
            omitDeep(response.body, ['created_at', 'updated_at', 'phone', 'bank_name', 'city', 'street', 'zip']),
          ).to.deep.eq(groupData);
        } else {
          expect(omitDeep(response.body, ['created_at', 'updated_at'])).to.deep.eq(groupData);
        }
      });
    });
  });
});
