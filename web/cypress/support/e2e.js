beforeEach(() => {
  cy.intercept('GET', '/api/status', {
    ok: true,
    has: {
      openai: false,
      gemini: true,
      claude: true,
      xai: false,
      xaiTeamId: false,
      perplexity: false
    }
  }).as('getStatus')
})

