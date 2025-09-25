describe('Multi-AI VSCode Flow', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait('@getStatus')
  })

  it('renders the about panel and sequential cards', () => {
    cy.contains('VERIFICATION Ai').should('be.visible')
    cy.contains('Gemini Yaniti').should('be.visible')
    cy.contains('Son Cevap').should('be.visible')

    cy.get('.about-panel').within(() => {
      cy.contains('Ozellikler').should('exist')
      cy.get('ul li').its('length').should('be.gte', 1)
    })
  })

  it('opens settings modal and shows key placeholders', () => {
    cy.contains('Ayarlar').click()
    cy.wait('@getStatus')

    cy.get('.modal.open').should('exist')
    cy.get('.modal.open input[type="password"]').should('have.length', 5)
    cy.get('.modal.open input[type="password"]').each($input => {
      expect($input.attr('placeholder')).to.equal('Key giriniz...')
    })
  })
})
