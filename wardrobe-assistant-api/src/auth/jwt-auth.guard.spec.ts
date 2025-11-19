import { UnauthorizedException } from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'

const contextFactory = (headers: Record<string, any>, container: any) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers, ...container }) }),
  }) as any

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard
  let supabaseService: any

  beforeEach(() => {
    const client = {
      auth: {
        getUser: jest.fn(),
      },
    }
    supabaseService = { client }
    guard = new JwtAuthGuard(supabaseService)
  })

  it('throws when Authorization header missing', async () => {
    await expect(guard.canActivate(contextFactory({}, {}))).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('throws when Authorization scheme invalid', async () => {
    await expect(guard.canActivate(contextFactory({ authorization: 'Token abc' }, {}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })

  it('throws when token invalid', async () => {
    supabaseService.client.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'x' } })
    await expect(guard.canActivate(contextFactory({ authorization: 'Bearer invalid' }, {}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })

  it('attaches user and returns true on success', async () => {
    const user = { id: 'user-1' }
    supabaseService.client.auth.getUser.mockResolvedValueOnce({ data: { user }, error: null })
    const container: any = {}
    const ok = await guard.canActivate(contextFactory({ authorization: 'Bearer valid' }, container))
    expect(ok).toBe(true)
    expect(container.user).toEqual(user)
  })
})
