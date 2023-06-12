import { reactive, ref, type Ref } from "vue";

export function useDraggable<T>(items: Ref<T[]>, group = "draggable") {
  const dragging = ref(false);
  const draggableOptions = reactive({
    group,
    animation: 500,
    disabled: false,
    ghostClass: "ghost",
    handle: ".grip",
  });

  const draggableEvents = {
    start: () => {
      dragging.value = true;
    },
    end: () => (dragging.value = false),
  };

  function move<D>(currentIdx: number, targetIdx: number, target: D[]) {
    const rv = [...target],
      item = rv.splice(currentIdx, 1)[0];
    rv.splice(targetIdx, 0, item);
    return rv;
  }
  return {
    dragging,
    draggableOptions,
    draggableEvents,
    move,
    draggableChange(event: { moved: { oldIndex: number; newIndex: number } }) {
      items.value = move(event.moved.oldIndex, event.moved.newIndex, items.value);
    },
  };
}
