import { describe, expect, it } from "vitest";
import { pickLocale } from "../src/lib/i18n";

describe("pickLocale", () => {
  it("defaults to French", () => {
    expect(pickLocale({})).toBe("fr");
    expect(pickLocale({ acceptLanguage: "de-DE,de;q=0.9" })).toBe("fr");
  });

  it("follows the phone's language", () => {
    expect(pickLocale({ acceptLanguage: "en-GB,en;q=0.9,fr;q=0.8" })).toBe("en");
    expect(pickLocale({ acceptLanguage: "de;q=1,fr;q=0.5,en;q=0.7" })).toBe("en");
  });

  it("lets an explicit choice win", () => {
    expect(pickLocale({ cookie: "fr", acceptLanguage: "en" })).toBe("fr");
    expect(pickLocale({ query: "en", cookie: "fr" })).toBe("en");
    expect(pickLocale({ query: "xx", cookie: "en" })).toBe("en");
  });
});
