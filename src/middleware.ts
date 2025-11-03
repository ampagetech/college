// C:\DevWeb\college-saas\src\middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { ROLES, PATHS, PUBLIC_PATHS, COMMON_AUTH_PATHS } from '@/lib/constants';

const BROWSER_PATHS = [
  '/.well-known/appspecific/com.chrome.devtools.json',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const consolePrefix = '[Middleware]';

  // [DEBUG] Log incoming path
  console.log(`${consolePrefix} [DEBUG] Requested path: ${pathname}`);

  // Handle browser-specific paths
  if (BROWSER_PATHS.includes(pathname)) {
    console.log(`${consolePrefix} Allowing browser-specific path: ${pathname}`);
    return NextResponse.next();
  }

  // ALLOW QURAN DATA ACCESS - Add this block here
  if (pathname.includes('/data/quran/') || 
      pathname.includes('/quran/') ||
      (pathname.includes('/data/') && pathname.endsWith('.json')) ||
      pathname.match(/\/(hafs|warsh)_\d{3}\.json$/)) {
    console.log(`${consolePrefix} Allowing Quran data access: ${pathname}`);
    return NextResponse.next();
  }

  // Allow static assets
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|webp|avif|pdf|json)$/i)) {
    console.log(`${consolePrefix} Allowing static asset: ${pathname}`);
    return NextResponse.next();
  }

  // Allow public paths
  const isPublicPath =
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/tenants/verify') ||
    (PUBLIC_PATHS as readonly string[]).includes(pathname) ||
    pathname === PATHS.UNAUTHORIZED;

  if (isPublicPath) {
    console.log(`${consolePrefix} Allowing public path: ${pathname}`);
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Redirect authenticated users away from auth pages
  if (token && (pathname === PATHS.SIGNIN || pathname === PATHS.REGISTER)) {
    console.log(`${consolePrefix} Authenticated user on auth page (${pathname}). Redirecting to ${PATHS.HOME}`);
    return NextResponse.redirect(new URL(PATHS.HOME, request.url));
  }

  // Require authentication for non-public routes
  if (!token) {
    console.log(`${consolePrefix} [DEBUG] No token found. Redirecting to signin.`);
    const signInUrl = new URL(PATHS.SIGNIN, request.url);
    signInUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  const userRole = token.role as string;
  const userEmail = token.email || token.id || '[unknown user]';

  console.log(`${consolePrefix} [DEBUG] Authenticated user: ${userEmail}, Role: ${userRole}, Path: ${pathname}`);

  if (!userRole || !Object.values(ROLES).includes(userRole as any)) {
    console.error(`${consolePrefix} Invalid or missing role: "${userRole}". Redirecting to unauthorized.`);
    return NextResponse.redirect(new URL(PATHS.UNAUTHORIZED, request.url));
  }

  // Admin Access
  if (userRole === ROLES.ADMIN) {
    console.log(`${consolePrefix} [DEBUG] Admin access granted to ${pathname}`);
    return NextResponse.next();
  }

  // Check if this is a Quran Voice-related path - Allow for ALL authorized users

const isQuranPath = (
    pathname === '/quran' ||

  
    pathname.startsWith('/api/transcribe') ||
    pathname.startsWith('/api/quran/') ||
    pathname.startsWith('/api/recitations/')
  );

  if (isQuranPath) {
    console.log(`${consolePrefix} [DEBUG] Allowing Quran access for ${userRole} to ${pathname}`);
    return NextResponse.next();
  }

  // Teacher Access
  if (userRole === ROLES.TEACHER) {
    const isAllowed = (
      pathname === PATHS.HOME ||
      pathname.startsWith('/admin') ||
      pathname === PATHS.QUIZ ||
      pathname === PATHS.QUIZ_PERFORMANCE ||
      pathname === PATHS.QUIZ_RESULTS ||
      pathname === PATHS.SCHEME ||
      pathname === PATHS.SCHEME_WORDCLOUD ||
      pathname.startsWith('/quiz/results/') ||
      pathname === PATHS.ISSUES ||
      pathname === PATHS.NATURAL_LANG_TO_SQL
    );
    console.log(`${consolePrefix} [DEBUG] Teacher access to ${pathname}? ${isAllowed}`);
    if (isAllowed) return NextResponse.next();
  }

  // Student Access
  if (userRole === ROLES.STUDENT) {
    const isAllowed = (
      pathname === PATHS.HOME ||
      pathname === PATHS.STUDENT_ADMISSIONS ||
      pathname.startsWith('/admissions/') ||
      pathname === PATHS.APPLICANT_ADMISSION_LETTER ||
      pathname === PATHS.QUIZ ||
      pathname === PATHS.QUIZ_PERFORMANCE ||
      pathname === PATHS.QUIZ_RESULTS ||
      pathname === PATHS.SCHEME ||
      pathname.startsWith('/quiz/results/')
    );
    console.log(`${consolePrefix} [DEBUG] Student access to ${pathname}? ${isAllowed}`);
    if (isAllowed) return NextResponse.next();
  }

  // Applicant Access
  if (userRole === ROLES.APPLICANT) {
    const isAllowed = (
      pathname === PATHS.HOME ||
      pathname.startsWith(PATHS.BIO_DATA) ||
      pathname === PATHS.DOCUMENTS ||
      pathname === PATHS.PAYMENTS ||
      pathname === PATHS.APPLICANT_ADMISSION_LETTER ||
      pathname.startsWith(PATHS.VIEW_ADMISSION_LETTER)
    );
    console.log(`${consolePrefix} [DEBUG] Applicant access to ${pathname}? ${isAllowed}`);
    if (isAllowed) return NextResponse.next();
  }

  // Common authenticated paths
  const isCommonAuthPath = COMMON_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  console.log(`${consolePrefix} [DEBUG] Common auth path? ${isCommonAuthPath}`);

  if (isCommonAuthPath) {
    console.log(`${consolePrefix} Allowing common authenticated path: ${pathname}`);
    return NextResponse.next();
  }

  // Allow home for all authenticated
  if (pathname === PATHS.HOME) {
    console.log(`${consolePrefix} Allowing home page access for ${userRole}`);
    return NextResponse.next();
  }

  // Access Denied
  console.warn(`${consolePrefix} [DEBUG] Access denied for ${userRole} to ${pathname}`);
  return NextResponse.redirect(new URL(PATHS.UNAUTHORIZED, request.url));
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|logo.png|.well-known/).*)',
  ],
};