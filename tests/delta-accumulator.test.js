#!/usr/bin/env node
'use strict';

const DeltaAccumulator = require('../bin/delta-accumulator');

console.log('[TEST] DeltaAccumulator unit tests');
console.log('');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`[FAIL] ${name}`);
    console.log(`  Error: ${error.message}`);
    failedTests++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test: Initialization
test('Initial state', () => {
  const acc = new DeltaAccumulator();
  assert(acc.messageId.startsWith('msg_'), 'Message ID should start with msg_');
  assert(acc.role === 'assistant', 'Default role should be assistant');
  assert(acc.contentBlocks.length === 0, 'Should have no blocks initially');
  assert(acc.currentBlockIndex === -1, 'Current index should be -1');
  assert(!acc.messageStarted, 'Message should not be started');
  assert(!acc.finalized, 'Should not be finalized');
});

// Test: Start thinking block
test('Start thinking block', () => {
  const acc = new DeltaAccumulator();
  const block = acc.startBlock('thinking');
  assert(block.type === 'thinking', 'Block type should be thinking');
  assert(block.index === 0, 'First block index should be 0');
  assert(block.started === true, 'Block should be marked as started');
  assert(block.stopped === false, 'Block should not be stopped');
  assert(acc.contentBlocks.length === 1, 'Should have 1 block');
  assert(acc.currentBlockIndex === 0, 'Current index should be 0');
});

// Test: Add delta to thinking block
test('Add delta to thinking block', () => {
  const acc = new DeltaAccumulator();
  acc.startBlock('thinking');
  acc.addDelta('Hello ');
  acc.addDelta('world');
  const block = acc.getCurrentBlock();
  assert(block.content === 'Hello world', `Expected 'Hello world', got '${block.content}'`);
  assert(acc.thinkingBuffer === 'Hello world', 'Thinking buffer should match');
});

// Test: Start text block
test('Start text block', () => {
  const acc = new DeltaAccumulator();
  const block = acc.startBlock('text');
  assert(block.type === 'text', 'Block type should be text');
  assert(block.index === 0, 'First block index should be 0');
});

// Test: Add delta to text block
test('Add delta to text block', () => {
  const acc = new DeltaAccumulator();
  acc.startBlock('text');
  acc.addDelta('Answer: ');
  acc.addDelta('42');
  const block = acc.getCurrentBlock();
  assert(block.content === 'Answer: 42', `Expected 'Answer: 42', got '${block.content}'`);
  assert(acc.textBuffer === 'Answer: 42', 'Text buffer should match');
});

// Test: Multiple blocks
test('Multiple blocks (thinking → text)', () => {
  const acc = new DeltaAccumulator();

  // Thinking block
  acc.startBlock('thinking');
  acc.addDelta('Analyzing...');

  // Text block
  acc.startBlock('text');
  acc.addDelta('The answer is 42');

  assert(acc.contentBlocks.length === 2, 'Should have 2 blocks');
  assert(acc.currentBlockIndex === 1, 'Current index should be 1');
  assert(acc.contentBlocks[0].type === 'thinking', 'First block should be thinking');
  assert(acc.contentBlocks[1].type === 'text', 'Second block should be text');
  assert(acc.contentBlocks[0].content === 'Analyzing...', 'Thinking content incorrect');
  assert(acc.contentBlocks[1].content === 'The answer is 42', 'Text content incorrect');
});

// Test: Stop current block
test('Stop current block', () => {
  const acc = new DeltaAccumulator();
  acc.startBlock('thinking');
  acc.addDelta('Done');
  acc.stopCurrentBlock();
  const block = acc.getCurrentBlock();
  assert(block.stopped === true, 'Block should be marked as stopped');
});

// Test: Get current block (no blocks)
test('Get current block when none exist', () => {
  const acc = new DeltaAccumulator();
  const block = acc.getCurrentBlock();
  assert(block === null, 'Should return null when no blocks');
});

// Test: Update usage statistics
test('Update usage statistics', () => {
  const acc = new DeltaAccumulator();
  acc.updateUsage({ prompt_tokens: 100, completion_tokens: 50 });
  assert(acc.inputTokens === 100, `Expected 100, got ${acc.inputTokens}`);
  assert(acc.outputTokens === 50, `Expected 50, got ${acc.outputTokens}`);
});

// Test: Get summary
test('Get summary', () => {
  const acc = new DeltaAccumulator();
  acc.model = 'glm-4.6';
  acc.startBlock('thinking');
  acc.addDelta('test');
  acc.updateUsage({ prompt_tokens: 10, completion_tokens: 20 });

  const summary = acc.getSummary();
  assert(summary.messageId === acc.messageId, 'Message ID mismatch');
  assert(summary.model === 'glm-4.6', 'Model mismatch');
  assert(summary.role === 'assistant', 'Role mismatch');
  assert(summary.blockCount === 1, `Expected 1 block, got ${summary.blockCount}`);
  assert(summary.usage.input_tokens === 10, 'Input tokens mismatch');
  assert(summary.usage.output_tokens === 20, 'Output tokens mismatch');
});

// Test: Thinking config preservation
test('Thinking config preservation', () => {
  const config = { thinking: true, effort: 'high' };
  const acc = new DeltaAccumulator(config);
  assert(acc.thinkingConfig.thinking === true, 'Thinking config not preserved');
  assert(acc.thinkingConfig.effort === 'high', 'Effort config not preserved');
});

// Test: Message lifecycle flags
test('Message lifecycle flags', () => {
  const acc = new DeltaAccumulator();
  assert(!acc.messageStarted, 'Should not be started initially');
  acc.messageStarted = true;
  assert(acc.messageStarted, 'Should be marked as started');
  acc.finalized = true;
  assert(acc.finalized, 'Should be marked as finalized');
});

// Test: Finish reason tracking
test('Finish reason tracking', () => {
  const acc = new DeltaAccumulator();
  assert(acc.finishReason === null, 'Finish reason should be null initially');
  acc.finishReason = 'stop';
  assert(acc.finishReason === 'stop', 'Finish reason should be updated');
});

console.log('');
console.log('═══════════════════════════════════════');
console.log(`TESTS: ${passedTests} passed, ${failedTests} failed`);
console.log('═══════════════════════════════════════');

if (failedTests > 0) {
  process.exit(1);
}
