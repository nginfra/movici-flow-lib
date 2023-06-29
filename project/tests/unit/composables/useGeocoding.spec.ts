import { useGeocoding } from "@movici-flow-lib/composables/useGeocoding";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useFakeBackend } from "../backend";

const backend = useFakeBackend();

describe("useGeocoding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    backend.geocode.upstreamEPSG.mockResolvedValue(28992);
  });

  it("retrieves upstream epsg code once", async () => {
    const { updateSuggestions, upstreamEPSG } = useGeocoding(backend);
    await updateSuggestions({ query: "some-query" });
    await updateSuggestions({ query: "some-other-query" });

    expect(backend.geocode.upstreamEPSG).toHaveBeenCalledOnce();
    expect(upstreamEPSG.value).toStrictEqual(28992);
  });

  it("updates suggestions", async () => {
    const result = [Symbol("suggestions")];
    const getSuggestions = backend.geocode.getSuggestions;

    getSuggestions.mockResolvedValue(result);
    const { suggestions, updateSuggestions } = useGeocoding(backend);
    await updateSuggestions({ query: "some-query" });
    expect(getSuggestions).toHaveBeenCalledWith({ query: "some-query", epsg_code: 28992 });
    expect(suggestions.value).toStrictEqual(result);
  });

  it("uses locale to query in specific language", async () => {
    const locale = ref("ja");
    const { getFirstResult } = useGeocoding(backend, locale);

    await getFirstResult({ query: "some-text" });
    expect(backend.geocode.getResults).toHaveBeenCalledWith(
      expect.objectContaining({ language: "ja" })
    );
  });

  it("resets suggestions on empty query", async () => {
    const { suggestions, updateSuggestions } = useGeocoding(backend);
    suggestions.value = [{ text: "some-text", result_uuid: "some-uuid" }];

    await updateSuggestions(null);
    expect(backend.geocode.getSuggestions).not.toHaveBeenCalled();
    expect(suggestions.value).toStrictEqual([]);
  });

  it("calls backend to resolve suggestion", async () => {
    const { resolveSuggestion } = useGeocoding(backend);
    await resolveSuggestion({ result_uuid: "some-uuid", text: "some-text" });
    expect(backend.geocode.resolveSuggestion).toHaveBeenCalled();
  });

  it("calls backend to get first result", async () => {
    const { getFirstResult } = useGeocoding(backend);
    await getFirstResult({ query: "some-text" });
    expect(backend.geocode.getResults).toHaveBeenCalled();
  });
});
