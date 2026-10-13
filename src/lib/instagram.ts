const USERNAME = /^[A-Za-z0-9._]{1,30}$/;

/**
 * Accepts "@name", "name" or a profile URL (instagram.com/name) and returns the bare
 * username, or null if it isn't a valid Instagram username.
 */
export function normalizeInstagram(input: string): string | null {
  let value = input.trim();
  const fromUrl = value.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i);
  if (fromUrl) value = fromUrl[1];
  value = value.replace(/^@/, "");
  return USERNAME.test(value) ? value : null;
}

export function instagramUrl(username: string) {
  return `https://www.instagram.com/${encodeURIComponent(username)}/`;
}
