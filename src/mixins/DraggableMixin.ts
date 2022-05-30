import { Component, Vue } from 'vue-property-decorator';

function guidGenerator() {
  const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
}

@Component
export default class DraggableMixin extends Vue {
  drag = false;
  animation = 500;
  group = guidGenerator();
  disabled = false;
  ghostClass = 'ghost';
  handle = '.grip';

  get draggableOptions() {
    return {
      animation: this.animation,
      group: this.group,
      disabled: this.disabled,
      ghostClass: this.ghostClass,
      handle: this.handle
    };
  }

  get draggableEvents() {
    return {
      start: () => (this.drag = true),
      end: () => (this.drag = false)
    };
  }

  move<D>(currentIdx: number, targetIdx: number, target: D[]) {
    const data = [...target],
      item = data.splice(currentIdx, 1)[0];
    data.splice(targetIdx, 0, item);
    return data;
  }
}
