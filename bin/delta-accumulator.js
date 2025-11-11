#!/usr/bin/env node
'use strict';

/**
 * DeltaAccumulator - Maintain state across streaming deltas
 *
 * Tracks:
 * - Message metadata (id, model, role)
 * - Content blocks (thinking, text)
 * - Current block index
 * - Accumulated content
 *
 * Usage:
 *   const acc = new DeltaAccumulator(thinkingConfig);
 *   const events = transformer.transformDelta(openaiEvent, acc);
 */
class DeltaAccumulator {
  constructor(thinkingConfig = {}, options = {}) {
    this.thinkingConfig = thinkingConfig;
    this.messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    this.model = null;
    this.role = 'assistant';

    // Content blocks
    this.contentBlocks = [];
    this.currentBlockIndex = -1;

    // Buffers
    this.thinkingBuffer = '';
    this.textBuffer = '';

    // C-02 Fix: Limits to prevent unbounded accumulation
    this.maxBlocks = options.maxBlocks || 100;
    this.maxBufferSize = options.maxBufferSize || 10 * 1024 * 1024; // 10MB

    // State flags
    this.messageStarted = false;
    this.finalized = false;

    // Statistics
    this.inputTokens = 0;
    this.outputTokens = 0;
    this.finishReason = null;
  }

  /**
   * Get current content block
   * @returns {Object|null} Current block or null
   */
  getCurrentBlock() {
    if (this.currentBlockIndex >= 0 && this.currentBlockIndex < this.contentBlocks.length) {
      return this.contentBlocks[this.currentBlockIndex];
    }
    return null;
  }

  /**
   * Start new content block
   * @param {string} type - Block type ('thinking' or 'text')
   * @returns {Object} New block
   */
  startBlock(type) {
    // C-02 Fix: Enforce max blocks limit
    if (this.contentBlocks.length >= this.maxBlocks) {
      throw new Error(`Maximum ${this.maxBlocks} content blocks exceeded (DoS protection)`);
    }

    this.currentBlockIndex++;
    const block = {
      index: this.currentBlockIndex,
      type: type,
      content: '',
      started: true,
      stopped: false
    };
    this.contentBlocks.push(block);

    // Reset buffer for new block
    if (type === 'thinking') {
      this.thinkingBuffer = '';
    } else if (type === 'text') {
      this.textBuffer = '';
    }

    return block;
  }

  /**
   * Add delta to current block
   * @param {string} delta - Content delta
   */
  addDelta(delta) {
    const block = this.getCurrentBlock();
    if (block) {
      if (block.type === 'thinking') {
        // C-02 Fix: Enforce buffer size limit
        if (this.thinkingBuffer.length + delta.length > this.maxBufferSize) {
          throw new Error(`Thinking buffer exceeded ${this.maxBufferSize} bytes (DoS protection)`);
        }
        this.thinkingBuffer += delta;
        block.content = this.thinkingBuffer;
      } else if (block.type === 'text') {
        // C-02 Fix: Enforce buffer size limit
        if (this.textBuffer.length + delta.length > this.maxBufferSize) {
          throw new Error(`Text buffer exceeded ${this.maxBufferSize} bytes (DoS protection)`);
        }
        this.textBuffer += delta;
        block.content = this.textBuffer;
      }
    }
  }

  /**
   * Mark current block as stopped
   */
  stopCurrentBlock() {
    const block = this.getCurrentBlock();
    if (block) {
      block.stopped = true;
    }
  }

  /**
   * Update usage statistics
   * @param {Object} usage - Usage object from OpenAI
   */
  updateUsage(usage) {
    if (usage) {
      this.inputTokens = usage.prompt_tokens || usage.input_tokens || 0;
      this.outputTokens = usage.completion_tokens || usage.output_tokens || 0;
    }
  }

  /**
   * Get summary of accumulated state
   * @returns {Object} Summary
   */
  getSummary() {
    return {
      messageId: this.messageId,
      model: this.model,
      role: this.role,
      blockCount: this.contentBlocks.length,
      currentIndex: this.currentBlockIndex,
      messageStarted: this.messageStarted,
      finalized: this.finalized,
      usage: {
        input_tokens: this.inputTokens,
        output_tokens: this.outputTokens
      }
    };
  }
}

module.exports = DeltaAccumulator;
