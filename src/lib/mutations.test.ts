/**
 * Basic test to ensure mutations compile and can be imported correctly
 */

describe('Mutations', () => {
  it('should import all mutation functions without throwing', async () => {
    const mutations = await import('./mutations')
    
    expect(typeof mutations.createSession).toBe('function')
    expect(typeof mutations.setSegmentConfig).toBe('function')
    expect(typeof mutations.createDailyRoom).toBe('function')
    expect(typeof mutations.joinAsHost).toBe('function')
    expect(typeof mutations.joinAsPlayer).toBe('function')
    expect(typeof mutations.updateLobbyPresence).toBe('function')
    expect(typeof mutations.updateVideoPresence).toBe('function')
    expect(typeof mutations.updatePhase).toBe('function')
    expect(typeof mutations.updateScore).toBe('function')
    expect(typeof mutations.activatePowerup).toBe('function')
    expect(typeof mutations.endSession).toBe('function')
  })

  it('should import types correctly', async () => {
    const types = await import('./types')
    
    expect(types).toBeDefined()
  })
})
