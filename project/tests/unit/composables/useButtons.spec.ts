import { describe, expect, it } from "vitest";
import { useButtons as useButtons_ } from "@movici-flow-common/composables/useButtons";
import { nextTick, reactive, ref } from "vue";

function useButtons(disabled?: Parameters<typeof useButtons_>[0]) {
  return useButtons_(disabled);
}

describe("useButtons", () => {
  it("creates an enabled button by default", () => {
    const { save } = useButtons();
    expect(save.isDisabled).toBeFalsy();
  });

  it("creates a statically disabled button", () => {
    const { save } = useButtons({ save: true });
    expect(save.isDisabled).toBeTruthy();
  });

  it("creates a reactive disabled button based on a reactive object", async () => {
    const disabled = reactive({ save: false });
    const { save } = useButtons(disabled);
    expect(save.isDisabled).toBeFalsy();
    disabled.save = true;
    await nextTick();
    expect(save.isDisabled).toBeTruthy();
  });

  it("creates a reactive disabled button based on a ref", async () => {
    const disabled = ref({ save: false });
    const { save } = useButtons(disabled);
    expect(save.isDisabled).toBeFalsy();
    disabled.value = { save: true };
    await nextTick();
    expect(save.isDisabled).toBeTruthy();
  });

  it("creates a reactive disabled button based on mutating a ref", async () => {
    const disabled = ref({ save: false });
    const { save } = useButtons(disabled);
    expect(save.isDisabled).toBeFalsy();
    disabled.value = { save: true };
    await nextTick();
    expect(save.isDisabled).toBeTruthy();
  });
});
