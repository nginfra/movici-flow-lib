<template>
  <div class="data-content">
    <div class="header align-items-center is-flex mb-1">
      <label class="label is-size-6 is-flex-grow-1 mr-1" :title="titleTooltip">
        {{ title }}
      </label>
      <template v-if="closable">
        <span
          class="pin is-clickable"
          :title="pinProps.title"
          @click.stop="$emit('togglePosition')"
        >
          <o-icon :pack="pinProps.iconClass" icon="thumbtack" />
        </span>
        <span class="close is-clickable" :title="$t('actions.close')" @click.stop="$emit('close')">
          <o-icon pack="far" icon="times" />
        </span>
      </template>
    </div>
    <table class="attributes" v-if="contentItems.length">
      <tr class="is-size-7" v-for="(item, idx) in contentItems" :key="idx">
        <td class="name">
          {{ item.name }}<span class="unit"> ({{ item.attribute.unit || "-" }})</span>:
        </td>
        <td class="value has-text-weight-bold">
          <span>{{ formatValue(item) }}</span>
        </td>
      </tr>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { AttributeType, PopupContent } from "@movici-flow-lib/types";
import { formatValueByDataType, type Formatter } from "@movici-flow-lib/utils/format";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
interface DataViewItem {
  name: string;
  value: unknown;
  attribute: AttributeType;
  enum?: string[];
}

const props = defineProps<{
  modelValue?: PopupContent;
  timestamp?: number;
  closable?: boolean;
  floating?: boolean;
}>();

const items = computed(() => {
  if (!props.modelValue) {
    return [];
  }

  const index = props.modelValue.entityIndex;
  return props.modelValue.items.map((item) => {
    if (props.timestamp != undefined) {
      item.tapefile.moveTo(props.timestamp);
    }

    return {
      name: item.name,
      attribute: item.attribute,
      value: item?.tapefile.data[index],
      enum: item.enum,
    };
  });
});

const contentItems = computed(() => {
  if (props.modelValue?.dynamicTitle) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, ...rest] = items.value;
    return rest;
  }
  return items.value;
});
const title = computed(() => {
  if (props.modelValue?.dynamicTitle) {
    const { value, attribute } = items.value[0];
    return formatValue({ value, attribute });
  }
  return props.modelValue?.title;
});

const titleTooltip = computed(() => {
  return props.modelValue?.dynamicTitle ? items.value[0].name : props.modelValue?.title;
});

function formatValue(item: Omit<DataViewItem, "name">) {
  const { value, attribute, enum: enums } = item;

  const formatters: Record<string, Formatter> = {
    NULL: () => "N/A",
    BOOLEAN: (val: unknown) => String(val ? t("misc.yes") : t("misc.no")),
  };
  if (enums) {
    formatters.ENUM = (val: unknown) => enums[Number(val)] ?? `N/A (${val})`;
  }
  return formatValueByDataType(value, attribute.data_type, formatters);
}

const pinProps = computed(() => {
  if (props.floating) {
    return {
      title: t("flow.visualization.popup.pinToRight"),
      iconClass: "far",
    };
  }
  return {
    title: t("flow.visualization.popup.pinToMap"),
    iconClass: "fas",
  };
});
</script>

<style scoped lang="scss">
.data-content {
  max-width: 500px;
  width: 100%;

  .header {
    min-height: 1.5rem;
    .label {
      margin: 0;
    }
  }
  .attributes {
    width: 100%;
    color: $black;
    .name {
      text-align: left;
    }
    .value {
      padding-left: 0.75em;
      text-align: right;
      span {
        white-space: break-spaces;
      }
    }
  }
  .close,
  .pin {
    width: 24px;
    height: 24px;
    &:hover {
      background: $white-ter;
    }
  }
  .close {
    margin-right: -4px;
  }
  .pin {
    .icon {
      transform: rotate(45deg);
    }
  }
}
</style>
