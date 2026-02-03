<script setup lang="ts">
import type { Layer } from "@deck.gl/core";
import type { DeckEvent, DeckEventCallback } from "@movici-flow-lib/types";
import type { ComposableVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import { watch } from "vue";

const props = withDefaults(
  defineProps<{
    on: (event: DeckEvent, callbacks: Record<string, DeckEventCallback>) => void;
    layerInfos?: ComposableVisualizerInfo[];
  }>(),
  {
    layerInfos: () => [],
  },
);

function setError({ error, layer }: { error: Error; layer: Layer }) {
  for (const info of props.layerInfos) {
    if (layer.id.startsWith(info.id)) {
      info.setError("deck", error.message);
      break;
    }
  }
}

watch(
  () => props.on,
  (on) => {
    on("error", {
      mapVis: ({ error, layer }) => {
        if (error && layer) {
          setError({ error, layer });
        }
      },
    });
  },
  {
    immediate: true,
  },
);
</script>
