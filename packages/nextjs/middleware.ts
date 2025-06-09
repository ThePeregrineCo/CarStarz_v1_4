import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Only initialize Supabase if the environment variables are available
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createMiddlewareClient({ req, res })
      
      // Refresh session if expired - required for Server Components
      const {
        data: { session },
      } = await supabase.auth.getSession()
      
      // Get wallet address from headers if available (set by frontend)
      const rawWalletAddress = req.headers.get('x-wallet-address')
      // Convert wallet address to lowercase for consistent authentication
      const walletAddress = rawWalletAddress ? rawWalletAddress.toLowerCase() : null
      
      // If there's no session and the user is trying to access a protected route
      // We allow access to the profile page even if not authenticated so users can create a profile
      if (!session && !walletAddress) {
        // For API routes that require authentication, return a 401 Unauthorized response
        if (req.nextUrl.pathname.startsWith('/api/') &&
            !req.nextUrl.pathname.startsWith('/api/user-profiles') &&
            !req.nextUrl.pathname.startsWith('/api/setup-identity-registry')) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        // For protected page routes (except profile), redirect to connect wallet
        if (req.nextUrl.pathname.startsWith('/dashboard') ||
            req.nextUrl.pathname.startsWith('/admin')) {
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = '/'
          redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }
      }
      
      // If we have a wallet address but no session, try to link them
      if (walletAddress && !session) {
        // Pass the wallet address to the API routes via headers
        res.headers.set('x-wallet-address', walletAddress)
      }
    } catch (error) {
      console.error('Error in middleware:', error)
      // Continue with the request even if there's an error with Supabase
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
