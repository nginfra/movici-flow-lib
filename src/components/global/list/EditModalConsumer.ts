import { Field } from '@/types';
import { upperFirst } from 'lodash';
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class EditModalConsumer<T> extends Vue {
  resourceTerm = 'resource';
  showEditModal = false;
  currentItem: T | null = null;
  mode: 'add' | 'edit' = 'add';
  fields: Field<T>[] = [];

  openModal(item: T) {
    this.mode = 'edit';
    this.currentItem = item;
    this.showEditModal = true;
  }

  startCreating() {
    this.mode = 'add';
    this.currentItem = this.getEmptyItem();
    this.showEditModal = true;
  }

  getEmptyItem(): T {
    return {} as unknown as T;
  }

  async saveItem(item: T & { uuid?: string }) {
    this.currentItem = item;

    if (this.mode === 'edit') {
      if (item.uuid) {
        if (await this.updateItem(item)) {
          this.$flow.snackbar.successMessage(
            ` ${upperFirst(this.resourceTerm)} was successfully updated`
          );
        }
      }
    } else if (this.mode === 'add') {
      if (await this.addItem(item)) {
        this.$flow.snackbar.successMessage(
          ` ${upperFirst(this.resourceTerm)} was successfully created`
        );
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addItem(item: T): Promise<boolean> {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateItem(item: T): Promise<boolean> {
    return true;
  }
}
