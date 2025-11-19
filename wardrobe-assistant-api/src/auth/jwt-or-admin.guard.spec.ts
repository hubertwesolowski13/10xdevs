import { UnauthorizedException } from '@nestjs/common'
import { JwtOrAdminGuard } from './jwt-or-admin.guard'

const contextFactory = (headers: Record<string, any>) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  }) as any

describe('JwtOrAdminGuard', () => {
  let guard: JwtOrAdminGuard
  let config: any
  let jwtGuard: any

  beforeEach(() => {
    config = { get: jest.fn((k: string) => (k === 'SUPABASE_SERVICE_ROLE_KEY' ? 'secret' : undefined)) }
    jwtGuard = { canActivate: jest.fn() }
    guard = new JwtOrAdminGuard(config, jwtGuard)
  })

  it('allows when valid admin secret provided', async () => {
    const res = await guard.canActivate(contextFactory({ 'x-admin-secret': 'secret' }))
    expect(res).toBe(true)
    expect(jwtGuard.canActivate).not.toHaveBeenCalled()
  })

  it('falls back to jwt guard when no admin header', async () => {
    jwtGuard.canActivate.mockResolvedValueOnce(true)
    await expect(guard.canActivate(contextFactory({ authorization: 'Bearer token' }))).resolves.toBe(true)
  })

  it('throws Unauthorized when neither admin nor jwt valid', async () => {
    jwtGuard.canActivate.mockRejectedValueOnce(new UnauthorizedException('invalid'))
    await expect(guard.canActivate(contextFactory({}))).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
