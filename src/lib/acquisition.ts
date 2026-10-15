/**
 * First-touch acquisition tracking: UTM parameters from the first visit are kept in a cookie
 * (set in proxy.ts) and recorded to `signup_attributions` when the user finishes onboarding.
 */

export const UTM_COOKIE = "sm_utm";
export const UTM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Attribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  landing: string;
  at: string; // ISO timestamp of the first visit
};

// Channel codes only: letters, numbers, "_", "-", "." (e.g. instagram, hostel_hongdae)
const VALUE = /^[\w.-]{1,100}$/;
const PATH = /^\/[\w\-/]{0,200}$/;

function clean(value: string | null): string | null {
  return value && VALUE.test(value) ? value.toLowerCase() : null;
}

/** Reads utm_source/medium/campaign from a URL. Returns null when there is no utm_source. */
export function readUtm(url: URL): Attribution | null {
  const source = clean(url.searchParams.get("utm_source"));
  if (!source) return null;
  return {
    source,
    medium: clean(url.searchParams.get("utm_medium")),
    campaign: clean(url.searchParams.get("utm_campaign")),
    landing: PATH.test(url.pathname) ? url.pathname : "/",
    at: new Date().toISOString(),
  };
}

export function serializeAttribution(a: Attribution): string {
  const params = new URLSearchParams({ source: a.source ?? "", landing: a.landing, at: a.at });
  if (a.medium) params.set("medium", a.medium);
  if (a.campaign) params.set("campaign", a.campaign);
  return params.toString();
}

export function parseAttribution(raw: string | undefined): Attribution | null {
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const source = clean(params.get("source"));
  // First visit must be within the cookie lifetime and not in the future
  const time = Date.parse(params.get("at") ?? "");
  const now = Date.now();
  if (!source || Number.isNaN(time) || time > now || time < now - UTM_COOKIE_MAX_AGE * 1000) {
    return null;
  }
  const landing = params.get("landing") ?? "/";
  return {
    source,
    medium: clean(params.get("medium")),
    campaign: clean(params.get("campaign")),
    landing: PATH.test(landing) ? landing : "/",
    at: new Date(time).toISOString(),
  };
}
