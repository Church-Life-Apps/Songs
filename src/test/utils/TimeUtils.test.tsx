import {
  describeTime,
  formatDate,
  MILLIS_PER_DAY,
  MILLIS_PER_HOUR,
  MILLIS_PER_MINUTE,
  MILLIS_PER_SECOND,
} from '../../utils/TimeUtils';

describe('Time Utils Tests', () => {
  it('Format Date Test', () => {
    expect(formatDate(1605072884599)).toBe('Wed, 11 Nov 2020 05:34:44 GMT');
  });

  it('Describe Time test', () => {
    // Past times
    expect(describeTime(Date.now() - MILLIS_PER_DAY * 5.1)).toBe('5 days ago.');
    expect(describeTime(Date.now() - MILLIS_PER_DAY * 1.1)).toBe('1 day ago.');
    expect(describeTime(Date.now() - MILLIS_PER_HOUR * 5.1)).toBe('5 hours ago.');
    expect(describeTime(Date.now() - MILLIS_PER_HOUR * 1.1)).toBe('1 hour ago.');
    expect(describeTime(Date.now() - MILLIS_PER_MINUTE * 5.1)).toBe('5 minutes ago.');
    expect(describeTime(Date.now() - MILLIS_PER_MINUTE * 1.1)).toBe('1 minute ago.');
    expect(describeTime(Date.now() - MILLIS_PER_SECOND * 5.1)).toBe('5 seconds ago.');
    expect(describeTime(Date.now() - MILLIS_PER_SECOND * 1.1)).toBe('1 second ago.');

    // Future times.
    expect(describeTime(Date.now() + MILLIS_PER_DAY * 5.1)).toBe('In 5 days.');
    expect(describeTime(Date.now() + MILLIS_PER_DAY * 1.1)).toBe('In 1 day.');
    expect(describeTime(Date.now() + MILLIS_PER_HOUR * 5.1)).toBe('In 5 hours.');
    expect(describeTime(Date.now() + MILLIS_PER_HOUR * 1.1)).toBe('In 1 hour.');
    expect(describeTime(Date.now() + MILLIS_PER_MINUTE * 5.1)).toBe('In 5 minutes.');
    expect(describeTime(Date.now() + MILLIS_PER_MINUTE * 1.1)).toBe('In 1 minute.');
    expect(describeTime(Date.now() + MILLIS_PER_SECOND * 5.1)).toBe('In 5 seconds.');
    expect(describeTime(Date.now() + MILLIS_PER_SECOND * 1.1)).toBe('In 1 second.');
  });
});
