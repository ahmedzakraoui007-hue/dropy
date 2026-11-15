import { describe, expect, it } from "vitest";
import { groupByHost } from "@/lib/indexnow";

describe("groupByHost", () => {
  it("groups URLs per host, drops duplicates and non-https links", () => {
    const groups = groupByHost([
      "https://lina.dropy.store/p/1",
      "https://lina.dropy.store/p/1",
      "https://lina.dropy.store/p/2",
      "https://dropy.store/blog/x",
      "http://insecure.tn/a",
      "pas une url",
    ]);
    expect([...groups.keys()]).toEqual(["lina.dropy.store", "dropy.store"]);
    expect(groups.get("lina.dropy.store")).toEqual(["https://lina.dropy.store/p/1", "https://lina.dropy.store/p/2"]);
  });
});
