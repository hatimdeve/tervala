import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

export default async function middleware(req: Request) {
  const session = await clerk.sessions.getSession(req.headers.get('session-token') || '');
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  return new Response(null, {
    status: 200,
    headers: {
      'x-user-id': session.userId,
    },
  });
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 