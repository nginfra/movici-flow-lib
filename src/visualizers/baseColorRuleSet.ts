import { ColorRuleSet } from '@/flow/src/types';

/**
 * This is the default ColorRuleSet that will always be used. This ruleset can be augmented by other
 * rule sets, for example, the default hosted ruleset `public/static/settings/color_rule_set.json`
 */
export default {
  colors: {
    purple: '#A258DC',
    green: '#1AB67E',
    orange: '#F18759',
    red: '#E54B4B',
    blue: '#5571F2',
    yellow: '#E8B53E',
    pink: '#F98BA6',
    brown: '#BA763D',
    white: '#F1F1F1',
    light_grey: '#777777',
    dark_grey: '#333333',
    very_dark_grey: '#202020',
    black: '#000000'
  },
  rules: [
    {
      priority: 900,
      selector: {
        data_type: 'BOOLEAN'
      },
      settings: {
        colors: [
          [0, 'red'],
          [1, 'green']
        ],
        baseColor: 'green'
      }
    },
    {
      priority: 1000,
      selector: {
        always: true
      },
      settings: {
        baseColor: 'light_grey',
        colors: [[0, null]],
        specialColor: 'dark_grey',
        undefinedColor: 'dark_grey'
      }
    }
  ]
} as ColorRuleSet;
