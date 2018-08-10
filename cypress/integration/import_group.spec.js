/// <reference types="Cypress" />

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
        expect(response.body).to.deep.eq(groupData);
      });
    });
  });
});
