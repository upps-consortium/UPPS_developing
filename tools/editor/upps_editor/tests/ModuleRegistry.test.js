import { jest } from '@jest/globals';
import { ModuleRegistry } from '../js/core/ModuleRegistry.js';
import { EventBus } from '../js/core/EventBus.js';
import { StateManager } from '../js/core/StateManager.js';

global.window = { addEventListener: jest.fn() };
const localStore = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    setItem: (k, v) => { localStore[k] = v; },
    getItem: (k) => localStore[k] || null,
    removeItem: (k) => { delete localStore[k]; },
  },
});

describe('ModuleRegistry', () => {
  test('register and initialize modules respecting dependencies', async () => {
    const bus = new EventBus({ enableLogging: false });
    const sm = new StateManager({ persistence: false, autoSave: false });
    const registry = new ModuleRegistry(bus, sm);

    const modA = { initialize: jest.fn(), start: jest.fn() };
    const modB = { dependencies: ['A'], initialize: jest.fn(), start: jest.fn() };

    registry.register('A', modA);
    registry.register('B', modB);

    await registry.initialize();
    expect(modA.initialize).toHaveBeenCalled();
    expect(modB.initialize).toHaveBeenCalled();
    expect(registry.initializationOrder).toEqual(['A', 'B']);

    await registry.start();
    expect(modA.start).toHaveBeenCalled();
    expect(modB.start).toHaveBeenCalled();
  });
});
