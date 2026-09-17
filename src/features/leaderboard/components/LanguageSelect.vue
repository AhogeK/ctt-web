<script setup lang="ts">
/**
 * LanguageSelect — the board picker for the `LANGUAGE` dimension.
 *
 * A `Select` rather than the button group the dimension selector uses: there can be dozens
 * of boards, so the option count grows with the data and a row of buttons would wrap into a
 * block. `Select` also brings keyboard navigation, typeahead and listbox semantics from
 * reka-ui, which a hand-rolled popover list would have to reimplement.
 *
 * Two levels of ordering, both needed at this scale. Options are grouped by category,
 * because the catalogue legitimately mixes `Java` with `Markdown` — a flat list would read
 * as if they were alternatives of one kind. Within a category the boards that **have
 * members** come first, behind a divider: since v0.76.0 the catalogue is the entire
 * vocabulary, so the handful of boards with anybody in them would otherwise be lost among
 * hundreds of empty ones.
 *
 * An empty board is still offered. It is a real, queryable board — it answers 200 and says
 * nobody is ranked yet, which is information rather than a dead end — and the API draws no
 * distinction between "empty" and "not a language" other than `hasMembers`.
 *
 * The selected board is the parent's state, via `v-model:language`.
 */
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LANGUAGE_TYPE_LABELS, type LanguageBoardGroup } from '../composables/useLeaderboard'

const props = defineProps<{
  /** Selected board name, or null while none is chosen */
  language: string | null
  /** Boards to offer, grouped and already filtered by the caller */
  groups: LanguageBoardGroup[]
}>()

const emit = defineEmits<{
  /** A board was picked */
  'update:language': [language: string]
}>()

/**
 * reka-ui's `Select` is a controlled component whose model can be `undefined`; this one is
 * never empty (the dimension is only offered when a board exists), so `null` maps to
 * `undefined` for the primitive and back on the way out.
 */
const model = computed({
  get: () => props.language ?? undefined,
  set: (value: string | undefined) => {
    if (value !== undefined) emit('update:language', value)
  },
})
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Decorative: the trigger carries the accessible name, and repeating it would make
         screen readers announce "Language" twice. Same arrangement as the period row. -->
    <span class="text-[11px] text-muted-foreground" aria-hidden="true">Language</span>
    <Select v-model="model">
      <SelectTrigger class="w-56" aria-label="Language board" data-testid="language-select">
        <SelectValue placeholder="Select a language" />
      </SelectTrigger>
      <!--
        Bounded height, and scrollable: the catalogue is the whole vocabulary — around 842
        languages against a couple of dozen that carry members — so an unbounded menu would
        run far past the viewport. reka-ui adds scroll buttons when it overflows.

        Within a category the boards that have members come first, behind a divider. That
        ordering is what keeps the list usable: it puts every board worth opening in the
        first few rows of its group instead of scattering them through hundreds of empty
        ones, and the divider makes the boundary visible rather than inferred.
      -->
      <SelectContent class="max-h-72">
        <SelectGroup v-for="group in props.groups" :key="group.type">
          <SelectLabel>{{ LANGUAGE_TYPE_LABELS[group.type] }}</SelectLabel>
          <SelectItem
            v-for="board in group.withMembers"
            :key="board.name"
            :value="board.name"
            :data-testid="`language-option-${board.name}`"
          >
            <SelectItemText>{{ board.name }}</SelectItemText>
          </SelectItem>
          <!-- Only when there is something on both sides: a divider with nothing after it
               would imply more options than the group has. -->
          <SelectSeparator v-if="group.withMembers.length > 0 && group.withoutMembers.length > 0" />
          <SelectItem
            v-for="board in group.withoutMembers"
            :key="board.name"
            :value="board.name"
            :data-testid="`language-option-${board.name}`"
          >
            <SelectItemText>{{ board.name }}</SelectItemText>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
