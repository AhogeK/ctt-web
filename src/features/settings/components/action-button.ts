import { cn } from '@/lib/utils'

/**
 * The outline button every settings card uses for its actions.
 *
 * One definition, because the cards are read side by side: a change to this shape has to reach all
 * of them at once, or they drift apart one card at a time.
 */
export const SETTINGS_ACTION_BUTTON_CLASS = cn(
  'h-9 rounded-md font-emphasis text-sm',
  'border-border bg-white text-foreground',
  'dark:border-white/8 dark:bg-white/2 dark:text-foreground',
  'transition-[background-color,border-color] duration-200',
  'hover:border-primary/50',
  'dark:hover:bg-white/5 dark:hover:border-accent/50',
)
