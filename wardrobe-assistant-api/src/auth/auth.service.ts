import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import type { ProfileDTO, RegisterUserCommand, LoginUserCommand } from 'shared/src/types/dto'

function generateUsernameFromEmail(email: string): string {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
  return base.length >= 3 ? base : `${base}_user`
}

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Registers a new user and ensures a corresponding profile exists.
   * Returns the public ProfileDTO of the created user.
   */
  async signup(cmd: RegisterUserCommand): Promise<ProfileDTO> {
    const { email, password } = cmd
    if (!email || !password) {
      throw new BadRequestException('Email and password are required')
    }

    // Determine username (either provided or generated from email)
    let username = cmd.additional_metadata?.username?.trim()
    if (!username) {
      username = generateUsernameFromEmail(email)
    }

    // Ensure username is unique; if taken, add numeric suffix until available
    username = await this.ensureUniqueUsername(username)

    // Sign up user in Supabase Auth with metadata
    const { data: signUpData, error: signUpError } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })

    if (signUpError) {
      // Common cases: user already registered, weak password, etc.
      throw new BadRequestException(signUpError.message)
    }

    const user = signUpData.user
    const userId = user?.id

    if (!userId) {
      throw new InternalServerErrorException('User registration failed: missing user ID')
    }

    // Ensure a profile row exists for this user
    const profile = await this.ensureProfile(userId, username)

    return profile
  }

  /**
   * Log in with email and password.
   * Returns JWT access token and ProfileDTO.
   */
  async login(cmd: LoginUserCommand): Promise<{ access_token: string; profile: ProfileDTO }> {
    const { email, password } = cmd
    if (!email || !password) {
      throw new BadRequestException('Email and password are required')
    }

    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password })

    if (error || !data?.session?.access_token || !data.user?.id) {
      // Hide detailed reason to prevent user enumeration
      throw new UnauthorizedException('Invalid email or password')
    }

    const userId = data.user.id
    const accessToken = data.session.access_token

    // Fetch profile for the logged-in user
    const profile = await this.fetchProfile(userId)
    if (!profile) {
      // Attempt to create a minimal profile using metadata or fallback
      const fallbackUsername = generateUsernameFromEmail(email)
      const created = await this.ensureProfile(userId, fallbackUsername)
      return { access_token: accessToken, profile: created }
    }

    return { access_token: accessToken, profile }
  }

  private async ensureUniqueUsername(base: string): Promise<string> {
    let candidate = base
    let suffix = 0

    // Try current candidate
    // If exists, increment suffix and try again
    for (let i = 0; i < 50; i++) {
      const exists = await this.usernameExists(candidate)
      if (!exists) return candidate
      suffix += 1
      candidate = `${base}${suffix}`
    }

    // Safety net to avoid infinite loops
    throw new BadRequestException('Unable to generate a unique username, please try a different one')
  }

  private async usernameExists(username: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id')
      .eq('username', username)
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new InternalServerErrorException('Failed to validate username uniqueness')
    }

    return Boolean(data)
  }

  private async ensureProfile(userId: string, username: string): Promise<ProfileDTO> {
    // Try to fetch an existing profile first
    const existing = await this.fetchProfile(userId)
    if (existing) return existing

    // Insert a new profile row
    const { data, error } = await this.supabase.client
      .from('profiles')
      .insert({ id: userId, username })
      .select('id, username, created_at, updated_at')
      .maybeSingle()

    if (error || !data) {
      throw new InternalServerErrorException('Failed to create user profile')
    }

    return data as ProfileDTO
  }

  private async fetchProfile(userId: string): Promise<ProfileDTO | null> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, username, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw new InternalServerErrorException('Failed to fetch user profile')
    }

    return (data as ProfileDTO) || null
  }
}
