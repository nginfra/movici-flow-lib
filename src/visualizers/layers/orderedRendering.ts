import { CompositeLayer, LayerExtension } from '@deck.gl/core';
import { DataFilterExtension } from '@deck.gl/extensions';
import { LayerConstructor } from '@movici-flow-common/types';
import { LayerProps } from '@deck.gl/core/lib/layer';
import { CompositeLayerProps } from '@deck.gl/core/lib/composite-layer';

/**
 * Wrap a deckcgl layer class into an OrderedRendering variant, a CompositeLayer which takes a
 * `filterRanges` prop to separate the data to render into n different layers
 * (n === filterRanges.length), so that certain objects can be rendered consistently on top of
 * other objects, for example to make sure certain colors are always rendered on top of other
 * colors.
 *
 * This layer makes use of DataFilterExtension to filter out which sublayer should (not) render
 * which objects. The filterRanges prop is an array of [min, max) tuples per sub layer indicating
 * the bounds for which this sublayer should render objects (including min, excluding max). The
 * value to test for is provided through the getOrderingValue accessor
 *
 * The layer may provide an additional filterRange and getFilterValue (as per the
 * DataFilterExtension api). However, these accessors must be of filterSize 1, meaning they are
 * for single values only. Also, as per the DataFilterExtension api, the filteRange is [min, max]
 * both including min and max
 */
export default function orderedRendering<D, P extends LayerProps<D>>(
  LayerType: LayerConstructor<D, P>
) {
  class OrderedRenderingLayer<D> extends CompositeLayer<
    D,
    P & OrderedLayerProps<D> & CompositeLayerProps<D>
  > {
    renderLayers() {
      // Here we destructure some props that we want to use/modify, the rest goes in ...props.
      // However, data is not an enumerable property of this.props, but only available as a getter,
      // so we cant destructure it into `...props` and have to take it out explicitly
      const {
        filterRange: originalFilterRange,
        filterRanges,
        getOrderingValue,
        getFilterValue,
        updateTriggers,
        data,
        ...props
      } = this.props;

      const extensions: LayerExtension[] = props.extensions ?? [];
      if (!extensions.filter(e => e instanceof DataFilterExtension).length) {
        extensions.push(new DataFilterExtension({ filterSize: 1 }));
      }

      updateTriggers.getFilterValue = [
        ...(updateTriggers.getFilterValue ?? []),
        ...(updateTriggers.getOrderingValue ?? []),
        filterRanges
      ];
      return filterRanges.map((filterRange, idx) => {
        return new LayerType({
          // ugh, can't figure out how to type this correctly
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...this.getSubLayerProps<D, any>({
            ...props,
            data,
            id: String(idx),
            extensions,
            filterRange: [0.1, 1],

            updateTriggers
          }),
          getFilterValue: this.combineFilter({
            getFilterValue,
            originalFilterRange,
            getOrderingValue,
            filterRange,
            idx
          })
        });
      });
    }
    /**
     * Combines the original data filter and the ordering filter into a single data filter. The
     * resulting value is a (numberic) boolean
     */
    combineFilter({
      getFilterValue,
      originalFilterRange,
      getOrderingValue,
      filterRange
    }: {
      getFilterValue?: (obj: D) => number;
      originalFilterRange?: [number, number];
      getOrderingValue: (obj: D) => number;
      filterRange: [number, number];
      idx: number;
    }): (obj: D, idx: number) => number {
      return (obj: D) => {
        if (getFilterValue && originalFilterRange) {
          const val = getFilterValue(obj);
          if (val < originalFilterRange[0] || val > originalFilterRange[1]) return 0;
        }
        const ord = getOrderingValue(obj);
        return ord >= filterRange[0] && ord < filterRange[1] ? 1 : 0;
      };
    }
  }

  OrderedRenderingLayer.layerName = LayerType.layerName;

  OrderedRenderingLayer.defaultProps = {
    ...LayerType.defaultProps,
    filterRanges: [[Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]],
    getFilterValue: {
      type: 'accessor',
      value: () => 1
    }
  };
  return OrderedRenderingLayer;
}

interface OrderedLayerProps<D> {
  filterRanges: [number, number][];
  getOrderingValue: (obj: D) => number;
  filterRange?: [number, number];
  getFilterValue?: (obj: D) => number;
}
