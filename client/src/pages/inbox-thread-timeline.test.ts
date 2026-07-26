import test from 'node:test';
import assert from 'node:assert/strict';
import { buildThreadTimeline, type ThreadTimelineEmail } from './inbox-thread-timeline';

function pick(entries: ReturnType<typeof buildThreadTimeline>) {
  return entries.map((e) => ({
    id: e.email.id,
    direction: e.direction,
    roleLabel: e.roleLabel,
    identityLabel: e.identityLabel,
  }));
}

test('3-message inbound/outbound chain snapshot', () => {
  const emails: ThreadTimelineEmail[] = [
    { id: '2', sender: 'Me', senderEmail: 'me@latte.ai', toAddress: 'external@foo.com', raw: { sentAt: '2026-01-01T10:10:00Z' } },
    { id: '1', sender: 'External', senderEmail: 'external@foo.com', toAddress: 'me@latte.ai', raw: { sentAt: '2026-01-01T10:00:00Z' } },
    { id: '3', sender: 'External', senderEmail: 'external@foo.com', toAddress: 'me@latte.ai', raw: { sentAt: '2026-01-01T10:20:00Z' } },
  ];

  assert.deepEqual(pick(buildThreadTimeline(emails, 'me@latte.ai')), [
    { id: '1', direction: 'incoming', roleLabel: 'Incoming', identityLabel: 'From external@foo.com' },
    { id: '2', direction: 'outgoing', roleLabel: 'Outgoing', identityLabel: 'From me@latte.ai to external@foo.com' },
    { id: '3', direction: 'incoming', roleLabel: 'Incoming', identityLabel: 'From external@foo.com' },
  ]);
});

test('multi-party CC thread snapshot', () => {
  const emails: ThreadTimelineEmail[] = [
    { id: 'a', sender: 'Me', senderEmail: 'me@latte.ai', toAddress: 'a@foo.com, b@foo.com, c@foo.com', raw: { sentAt: '2026-01-01T09:00:00Z' } },
    { id: 'b', sender: 'A', senderEmail: 'a@foo.com', toAddress: 'me@latte.ai, b@foo.com, c@foo.com', raw: { sentAt: '2026-01-01T09:10:00Z' } },
  ];

  assert.deepEqual(pick(buildThreadTimeline(emails, 'me@latte.ai')), [
    { id: 'a', direction: 'outgoing', roleLabel: 'Outgoing', identityLabel: 'From me@latte.ai to a@foo.com, b@foo.com, c@foo.com' },
    { id: 'b', direction: 'incoming', roleLabel: 'Incoming', identityLabel: 'From a@foo.com' },
  ]);
});

test('selecting middle message still shows full chronological order', () => {
  const emails: ThreadTimelineEmail[] = [
    { id: 'oldest', sender: 'X', senderEmail: 'x@foo.com', toAddress: 'me@latte.ai', raw: { sentAt: '2026-01-01T08:00:00Z' } },
    { id: 'middle', sender: 'Me', senderEmail: 'me@latte.ai', toAddress: 'x@foo.com', raw: { sentAt: '2026-01-01T09:00:00Z' } },
    { id: 'latest', sender: 'X', senderEmail: 'x@foo.com', toAddress: 'me@latte.ai', raw: { sentAt: '2026-01-01T10:00:00Z' } },
  ];

  const order = buildThreadTimeline(emails, 'me@latte.ai').map((entry) => entry.email.id);
  assert.deepEqual(order, ['oldest', 'middle', 'latest']);
});
