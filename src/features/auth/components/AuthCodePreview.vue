<script setup lang="ts">
import { computed } from 'vue'

/** Code content to display with syntax highlighting */
const props = defineProps<{
  /** Source code string to render */
  code: string
  /** Programming language for syntax highlighting (default: 'typescript') */
  language?: string
}>()

const languageLabel = computed(() => props.language?.toUpperCase() ?? 'TS')

/**
 * Simple syntax highlighter using CSS classes.
 * Splits code into tokens and assigns semantic classes.
 * Supports: keywords, strings, comments, numbers, types, punctuation.
 */
function highlightCode(code: string): string {
  // Escape HTML entities first
  let escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Comments (single-line // and multi-line /* */)
  escaped = escaped.replace(
    /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    '<span class="code-preview__token code-preview__token--comment">$1</span>',
  )

  // Strings (single, double, and template literals)
  escaped = escaped.replace(
    /(['"`])(?:(?!\1|\\).|\\.)*?\1/g,
    '<span class="code-preview__token code-preview__token--string">$&</span>',
  )

  // Keywords
  const keywords =
    /\b(const|let|var|function|async|await|return|if|else|for|while|class|import|export|from|default|new|this|typeof|instanceof|interface|type|enum|implements|extends|public|private|protected|readonly|static|abstract|declare|module|namespace|as|in|of|switch|case|break|continue|try|catch|finally|throw|yield|void|null|undefined|true|false)\b/g
  escaped = escaped.replace(
    keywords,
    '<span class="code-preview__token code-preview__token--keyword">$1</span>',
  )

  // Numbers
  escaped = escaped.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span class="code-preview__token code-preview__token--number">$1</span>',
  )

  // Type references (PascalCase words after : or = or new)
  escaped = escaped.replace(
    /([A-Z][a-zA-Z]+)/g,
    '<span class="code-preview__token code-preview__token--type">$1</span>',
  )

  // Function calls (word followed by parenthesis)
  escaped = escaped.replace(
    /\b([a-z][a-zA-Z]*)\s*(?=\()/g,
    '<span class="code-preview__token code-preview__token--function">$1</span>',
  )

  return escaped
}

const highlightedHtml = computed(() => highlightCode(props.code))
</script>

<template>
  <div class="code-preview">
    <div class="code-preview__header">
      <div class="code-preview__dots">
        <span class="code-preview__dot code-preview__dot--red" />
        <span class="code-preview__dot code-preview__dot--yellow" />
        <span class="code-preview__dot code-preview__dot--green" />
      </div>
      <span class="code-preview__language">{{ languageLabel }}</span>
    </div>
    <div class="code-preview__body">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <pre class="code-preview__code" v-html="highlightedHtml" />
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   Code Preview Component
   Terminal-style code block with syntax highlighting
   ============================================ */

.code-preview {
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(25, 26, 27, 0.9);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.2);
}

/* Light mode: white surface with elevation */
:root:not(.dark) .code-preview {
  background: rgba(255, 255, 255, 0.98);
  border-color: #d0d6e0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 8px rgba(0, 0, 0, 0.06),
    0 8px 16px rgba(0, 0, 0, 0.04);
}

/* Header: traffic lights + language label */
.code-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.15);
}

:root:not(.dark) .code-preview__header {
  background: #f3f4f5;
  border-bottom-color: #e6e6e6;
}

.code-preview__dots {
  display: flex;
  gap: 5px;
}

.code-preview__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.code-preview__dot--red {
  background: #ff5f57;
}

.code-preview__dot--yellow {
  background: #febc2e;
}

.code-preview__dot--green {
  background: #28c840;
}

.code-preview__language {
  font-family:
    'Berkeley Mono',
    ui-monospace,
    SF Mono,
    Menlo,
    monospace;
  font-size: 0.6875rem;
  font-weight: 510;
  color: #62666d;
  letter-spacing: 0.05em;
}

/* Code body */
.code-preview__body {
  padding: 0.75rem 0.875rem 0.875rem;
  overflow-x: auto;
}

.code-preview__code {
  margin: 0;
  font-family:
    'Berkeley Mono',
    ui-monospace,
    SF Mono,
    Menlo,
    monospace;
  font-size: 0.75rem;
  line-height: 1.6;
  color: #8a8f98;
  white-space: pre;
  tab-size: 2;
}

:root:not(.dark) .code-preview__code {
  color: #62666d;
}

/* Syntax highlighting tokens */
.code-preview__token--keyword {
  color: #7170ff;
  font-weight: 510;
}

:root:not(.dark) .code-preview__token--keyword {
  color: #5e6ad2;
}

.code-preview__token--string {
  color: #27a644;
}

:root:not(.dark) .code-preview__token--string {
  color: #10b981;
}

.code-preview__token--comment {
  color: #62666d;
  font-style: italic;
}

:root:not(.dark) .code-preview__token--comment {
  color: #8a8f98;
}

.code-preview__token--number {
  color: #f7f8f8;
}

:root:not(.dark) .code-preview__token--number {
  color: #1a1a2e;
}

.code-preview__token--type {
  color: #d0d6e0;
  font-weight: 510;
}

:root:not(.dark) .code-preview__token--type {
  color: #1a1a2e;
}

.code-preview__token--function {
  color: #828fff;
}

:root:not(.dark) .code-preview__token--function {
  color: #5e6ad2;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
