import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const hostname = request.headers.get('host') || '';
    const firstSegment = pathname.split('/')[1];

    // 1. Handle Subdomain Rewrites (e.g. seller.dropy.store -> /seller/signup)
    // Only if on subdomain and path is root? Or general rewrite?
    // Current approach:
    const subdomains = {
      'creator': '/creator/signup',
      'seller': '/seller/signup',
      'supplier': '/supplier/signup',
    };
    const subdomain = hostname.split('.')[0];
    const isLocalhost = hostname.includes('localhost');
    const isMainDomain = isLocalhost ||
      hostname === 'dropy.store' ||
      hostname === 'www.dropy.store' ||
      hostname.endsWith('.vercel.app');

    if (subdomain in subdomains && pathname === '/' && !isLocalhost) {
      return NextResponse.rewrite(new URL(subdomains[subdomain as keyof typeof subdomains], request.url));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.next({ request });
    }

    // 2. Handle Supabase Session & Protected Routes
    let supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const ROLE_AREAS = ['admin', 'seller', 'supplier', 'creator'];
    const ROLE_HOME: Record<string, string> = {
      admin: '/admin',
      seller: '/seller/dashboard',
      supplier: '/supplier/dashboard',
      creator: '/creator/dashboard',
    };
    const BLOCKED_STATUSES = ['pending', 'suspended', 'rejected'];

    const isPublicRolePage = /^\/(seller|supplier|creator)(\/signup)?\/?$/.test(pathname);
    const roleArea = ROLE_AREAS.includes(firstSegment) && !isPublicRolePage ? firstSegment : null;
    const isLoginOnlyRoute = ['dashboard', 'settings'].includes(firstSegment);
    const isAuthPage = ['/login', '/inscription', '/register'].includes(pathname);

    if ((roleArea || isLoginOnlyRoute) && !user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.search = '';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (user && (roleArea || isAuthPage)) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle();

      const isActive = Boolean(profile && !BLOCKED_STATUSES.includes(profile.status ?? ''));

      if (isAuthPage) {
        if (!isActive || !profile) return supabaseResponse;
        return NextResponse.redirect(new URL(ROLE_HOME[profile.role] || '/', request.url));
      }

      if (!profile) {
        return NextResponse.redirect(new URL('/login?error=no_profile', request.url));
      }
      if (profile.status === 'pending') {
        return NextResponse.redirect(new URL('/demande-en-attente', request.url));
      }
      if (!isActive) {
        return NextResponse.redirect(new URL('/login?error=account_disabled', request.url));
      }
      if (profile.role !== roleArea && profile.role !== 'admin') {
        return NextResponse.redirect(new URL(ROLE_HOME[profile.role] || '/', request.url));
      }
    }

    return supabaseResponse;

  } catch (error) {
    console.error('Middleware Error:', error);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
