import { jest } from '@jest/globals';
import { StateManager } from '../js/core/StateManager.js';

global.window = {
  addEventListener: jest.fn(),
};

const localStore = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    setItem: (k, v) => {
      localStore[k] = v;
    },
    getItem: (k) => localStore[k] || null,
    removeItem: (k) => {
      delete localStore[k];
    },
  },
});

describe('StateManager', () => {
  test('setState and getState work', () => {
    const sm = new StateManager({ persistence: false, autoSave: false });
    sm.setState('user.name', 'Alice');
    expect(sm.getState('user.name')).toBe('Alice');
  });

  test('subscribe receives updates', () => {
    const sm = new StateManager({ persistence: false, autoSave: false });
    const cb = jest.fn();
    sm.subscribe('count', cb);
    sm.setState('count', 1);
    expect(cb).toHaveBeenCalledWith(1);
  });

  test('deleteState removes value', () => {
    const sm = new StateManager({ persistence: false, autoSave: false });
    sm.setState('tmp.val', 10);
    sm.deleteState('tmp.val');
    expect(sm.getState('tmp.val')).toBeUndefined();
  });
});
