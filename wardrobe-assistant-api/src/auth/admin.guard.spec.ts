import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { AdminGuard } from './admin.guard'

const contextFactory = (headers: Record<string, any>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  }) as ExecutionContext

describe('AdminGuard', () => {
  const configService = {
    get: jest.fn((key: string) => (key === 'SUPABASE_SERVICE_ROLE_KEY' ? 'secret' : undefined)),
  }
  let guard: AdminGuard

  beforeEach(() => {
    jest.clearAllMocks()
    guard = new AdminGuard(configService)
  })

  it('throws 401 when header missing', () => {
    expect(() => guard.canActivate(contextFactory({}))).toThrow(UnauthorizedException)
  })

  it('throws 403 when env not configured', () => {
    configService.get.mockReturnValueOnce(undefined)
    expect(() => guard.canActivate(contextFactory({ 'x-admin-secret': 'secret' }))).toThrow(ForbiddenException)
  })

  it('throws 403 when secret mismatches', () => {
    expect(() => guard.canActivate(contextFactory({ 'x-admin-secret': 'wrong' }))).toThrow(ForbiddenException)
  })

  it('returns true when secret matches', () => {
    expect(guard.canActivate(contextFactory({ 'x-admin-secret': 'secret' }))).toBe(true)
  })
})
