"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_OPTIONS } from "./config";

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);
  revalidatePath("/", "layout");
}
