import { Component, Vue } from 'vue-property-decorator';
import { generalStore } from '@/store/store-accessor';
import { MovActionType } from '@movici-flow-common/types';
import { upperFirst } from 'lodash';

function getDefaultDeleteMessage(length: number, term: string) {
  const deleteOneMessage = `Are you sure you want to <b>delete</b> this ${term}? This action cannot be undone.`,
    deleteMultipleMessage = `Are you sure you want to <b>delete</b> ${length} ${term}s? This action cannot be undone.`,
    deleteTitle = `Delete ${term}(s)`;

  return {
    message: length > 1 ? deleteMultipleMessage : deleteOneMessage,
    title: deleteTitle
  };
}

@Component
export default class ResourceListConsumer<T> extends Vue {
  items: T[] = [];
  checkedRows: T[] = [];
  editPage = '';
  resourceTerm = 'resource';
  singleRowActions: MovActionType[] = [MovActionType.EDIT, MovActionType.DELETE];
  checkedRowActions: MovActionType[] = [MovActionType.EDIT, MovActionType.DELETE];

  async getAll(): Promise<T[]> {
    return [];
  }

  async deleteItems(items: T[]) {
    const deleteRequests = this.getDeleteItemRequests(items);
    await Promise.all(deleteRequests);
    await this.resetList();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDeleteItemRequests(items: T[]): Promise<unknown>[] {
    return [];
  }

  async getDeleteMessage(deleteItems: T[]) {
    return getDefaultDeleteMessage(deleteItems.length, this.resourceTerm);
  }

  async confirmDelete(deleteItems: T[]) {
    this.$buefy.dialog.confirm({
      ...(await this.getDeleteMessage(deleteItems)),
      confirmText: 'Delete',
      type: 'is-danger',
      hasIcon: true,
      onConfirm: () =>
        this.deleteItems(deleteItems).then(() =>
          this.$flow.snackbar.successMessage(
            `${upperFirst(this.resourceTerm)}(s) successfully removed.`
          )
        )
    });
  }

  checkedRowEnabledActions(checkedRows: T[]) {
    switch (checkedRows.length) {
      case 0:
        return [];
      case 1:
        return this.singleRowActions;
      default:
        return [MovActionType.DELETE];
    }
  }

  onEdit(uuid: string) {
    this.$router.push({
      name: this.editPage,
      params: { uuid }
    });
  }

  async resetList() {
    this.checkedRows = [];
    this.items = await this.getAll();
  }

  async mounted() {
    const term = this.resourceTerm || 'resource';
    generalStore.setLoading({ value: true, msg: `Loading ${term}s...` });
    await this.resetList();
    generalStore.setLoading({ value: false });
    this.afterMounted();
  }

  afterMounted() {}
}
