import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { RESERVED_SLUGS } from '@/lib/store-slug';
import { STORE_ROOT_DOMAIN, isPlatformHost, storeSlugFromHost, storeUrl } from '@/lib/store-url';
import { customDomainForSlug, storeSlugForDomain } from '@/lib/custom-domain-lookup';

const AREA_ROLE: Record<string, string> = { admin: 'admin', seller: 'seller', supplier: 'supplier', creator: 'creator', team: 'agent' };
const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  seller: '/seller/dashboard',
  supplier: '/supplier/dashboard',
  creator: '/creator/dashboard',
  agent: '/team',
};
const ACTIVE_STATUSES = ['approved', 'active'];

function isProtectedPath(pathname: string) {
  const firstSegment = pathname.split('/')[1];
  const isPublicRolePage = /^\/(seller|supplier|creator)(\/signup)?\/?$/.test(pathname);
  const roleArea = firstSegment in AREA_ROLE && !isPublicRolePage ? firstSegment : null;
  const isLoginOnlyRoute = ['dashboard', 'settings'].includes(firstSegment);
  return { roleArea, isLoginOnlyRoute, isProtected: Boolean(roleArea || isLoginOnlyRoute) };
}

function denyProtected(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/login';
  redirectUrl.search = '';
  redirectUrl.searchParams.set('error', 'auth_unavailable');
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { roleArea, isLoginOnlyRoute, isProtected } = isProtectedPath(pathname);

  try {
    const hostname = request.headers.get('host') || '';

    const isAsset =
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/') ||
      pathname === '/sitemap.xml' ||
      pathname === '/robots.txt' ||
      /\.[a-z0-9]{2,5}$/i.test(pathname);
    const hostOnly = hostname.split(':')[0].toLowerCase();
    let storeSlug = storeSlugFromHost(hostname);
    if (storeSlug && !isAsset) {
      const customDomain = await customDomainForSlug(storeSlug);
      if (customDomain) return NextResponse.redirect(`https://${customDomain}${pathname}${request.nextUrl.search}`, 301);
    }
    if (!storeSlug && STORE_ROOT_DOMAIN && hostOnly && !isPlatformHost(hostOnly)) {
      storeSlug = await storeSlugForDomain(hostOnly.replace(/^www\./, ''));
    }
    if (storeSlug) {
      if (isAsset) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = pathname === '/' ? `/${storeSlug}` : `/${storeSlug}${pathname}`;
      return NextResponse.rewrite(url);
    }

    const host = hostname.split(':')[0].toLowerCase();
    if (STORE_ROOT_DOMAIN && (host === STORE_ROOT_DOMAIN || host === `www.${STORE_ROOT_DOMAIN}`)) {
      const first = pathname.split('/')[1] || '';
      const isStorePath =
        /^[a-z0-9]+(-[a-z0-9]+)*$/.test(first) &&
        !RESERVED_SLUGS.has(first) &&
        !/^(opengraph-image|twitter-image|icon|apple-icon|manifest)/.test(first);
      if (isStorePath) {
        return NextResponse.redirect(`${storeUrl(first, pathname.slice(first.length + 1))}${request.nextUrl.search}`, 301);
      }
    }

    const signupSubdomains: Record<string, string> = {
      creator: '/creator/signup',
      seller: '/seller/signup',
      supplier: '/supplier/signup',
    };
    const subdomain = host.split('.')[0];
    if (subdomain in signupSubdomains && pathname === '/' && !host.includes('localhost')) {
      return NextResponse.rewrite(new URL(signupSubdomains[subdomain], request.url));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return isProtected ? denyProtected(request) : NextResponse.next({ request });
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

      const isActive = Boolean(profile && ACTIVE_STATUSES.includes(profile.status ?? ''));

      if (isAuthPage) {
        if (!isActive || !profile) return supabaseResponse;
        return NextResponse.redirect(new URL(ROLE_HOME[profile.role] || '/', request.url));
      }

      if (!profile) {
        return NextResponse.redirect(new URL('/login?error=no_profile', request.url));
      }
      if (!profile.status || profile.status === 'pending' || profile.status === 'email_verified') {
        return NextResponse.redirect(new URL('/demande-en-attente', request.url));
      }
      if (!isActive) {
        return NextResponse.redirect(new URL('/login?error=account_disabled', request.url));
      }
      if (roleArea && profile.role !== AREA_ROLE[roleArea] && profile.role !== 'admin') {
        return NextResponse.redirect(new URL(ROLE_HOME[profile.role] || '/', request.url));
      }
    }

    return supabaseResponse;

  } catch (error) {
    console.error('Middleware Error:', error);
    return isProtected ? denyProtected(request) : NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
