describe('Taller 9', () => {
  it('Muestra la página de publicaciones', () => {
    cy.visit('/')
    cy.contains('Publicaciones')
  })
})
