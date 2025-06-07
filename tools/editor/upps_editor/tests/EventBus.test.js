import { jest } from '@jest/globals';
import { EventBus } from '../js/core/EventBus.js';

describe('EventBus', () => {
  test('handlers receive emitted events', () => {
    const bus = new EventBus({ enableLogging: false });
    const handler = jest.fn();
    bus.on('test:event', handler);

    bus.emit('test:event', { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  test('once handler triggers only once', () => {
    const bus = new EventBus({ enableLogging: false });
    const handler = jest.fn();
    bus.once('single', handler);

    bus.emit('single');
    bus.emit('single');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('middleware intercepts events', () => {
    const bus = new EventBus({ enableLogging: false });
    const calls = [];
    bus.use((event, data, next) => {
      calls.push({ event, data });
      next();
    });

    bus.emit('mw:event', 123);
    expect(calls).toEqual([{ event: 'mw:event', data: 123 }]);
  });
});
