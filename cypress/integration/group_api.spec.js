/// <reference types="Cypress" />

import Chance from 'chance';

const chance = new Chance();

describe('Group API', function() {
  before(function() {
    cy.login();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });

  it('new person through organization owner PATCH', function() {
    const token = JSON.parse(localStorage.getItem('buzznAuthTokens')).token;
    cy.request({
      url: `${Cypress.env('SERVER_URL')}/api/admin/localpools`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        name: chance.name(),
        address: {
          city: chance.city(),
          country: 'DE',
          street: chance.street(),
          zip: chance.zip(),
        },
      },
    }).then(newGroup => {
      expect(newGroup.status).to.eq(201);
      const groupId = newGroup.body.id;

      cy.request({
        url: `${Cypress.env('SERVER_URL')}/api/admin/persons`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(allUsers => {
        expect(allUsers.status).to.eq(200);
        const users = allUsers.body.array;
        const { id, updated_at, ...newContact } = users[0];
        delete newContact['fax'];

        cy.request({
          url: `${Cypress.env('SERVER_URL')}/api/admin/localpools/${groupId}/organization-owner`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            name: chance.name(),
            address: {
              city: chance.city(),
              country: 'DE',
              street: chance.street(),
              zip: chance.zip(),
            },
            contact: { id: users[0].id },
            legalRepresentation: { id: users[1].id },
          },
        }).then(ownerAttach => {
          expect(ownerAttach.status).to.eql(201);

          cy.request({
            url: `${Cypress.env('SERVER_URL')}/api/admin/localpools/${groupId}/organization-owner`,
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: {
              updated_at: ownerAttach.body.updated_at,
              contact: newContact,
            },
          }).then(ownerUpdate => {
            expect(ownerUpdate.status).to.eql(200);
          });
        });
      });
    });
  });
});
