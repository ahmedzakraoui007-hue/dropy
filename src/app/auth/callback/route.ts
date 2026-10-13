import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/login'
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/login'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
