import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/ciclo/(.*)",
  "/api/webhooks/(.*)",
]);

const isMentorRoute = createRouteMatcher(["/mentor(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId: clerkId } = await auth.protect();

  if (isMentorRoute(req)) {
    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user || (user.role !== "MENTOR" && user.role !== "ADMIN")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
