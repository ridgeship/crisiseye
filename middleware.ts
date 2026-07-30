import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

export default convexAuthNextjsMiddleware();

export const config = {
  // Run the middleware on all routes except static files, images, and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
