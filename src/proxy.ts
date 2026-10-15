import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_OPTIONS } from "@/i18n/config";
import { readUtm, serializeAttribution, UTM_COOKIE, UTM_COOKIE_MAX_AGE } from "@/lib/acquisition";

export async function proxy(request: NextRequest) {
  // ?lang=ja on shared links / QR codes: remember it, and set it on the request too so this
  // very render (and link-preview crawlers) already gets that language.
  const lang = request.nextUrl.searchParams.get("lang");
  const locale = isLocale(lang) ? lang : null;
  if (locale) request.cookies.set(LOCALE_COOKIE, locale);

  // First-touch UTM: only the first tagged visit is kept
  const utm = request.cookies.has(UTM_COOKIE) ? null : readUtm(request.nextUrl);

  const response = await updateSession(request);

  if (locale) response.cookies.set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);
  if (utm) {
    response.cookies.set(UTM_COOKIE, serializeAttribution(utm), {
      path: "/",
      maxAge: UTM_COOKIE_MAX_AGE,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  return response;
}

export const config = {
  matcher: [
    // Skip static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
