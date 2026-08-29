import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function middleware(request: NextRequest) {
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, so /auth/* routes
     * (login, logout, callback, profile) and session refresh work
     * on every page.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
