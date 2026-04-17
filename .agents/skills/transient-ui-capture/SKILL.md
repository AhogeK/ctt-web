---
name: transient-ui-capture
description: Techniques for capturing transient UI elements (toast notifications, animations, loading states, dropdowns) using browser-use CLI chain commands. Use when needing to screenshot UI that appears briefly and may disappear before separate screenshot command runs.
---

# Transient UI Capture with browser-use

## Problem

Transient UI elements (toast notifications, animations, loading states, dropdowns) appear briefly and may disappear before a separate `browser-use screenshot` command can capture them.

## Solution: Chain Commands

Use `&&` to chain click action with screenshot command. This ensures screenshot runs **immediately after** the action completes.

```bash
# WRONG: Separate commands (toast may disappear in 4s)
browser-use click 20          # Click triggers toast
browser-use screenshot        # Toast already gone

# CORRECT: Chain command (immediate capture)
browser-use click 20 && browser-use screenshot  # Captures while visible
```

## Common Transient Elements

| Element | Duration | Capture Method |
|---------|----------|----------------|
| Toast notifications | 3-5s | `click && screenshot` |
| Loading spinners | Variable | `wait selector "spinner" && screenshot` |
| Dropdown menus | Until click away | `click && screenshot` |
| Hover tooltips | Until mouse leave | `hover && screenshot` |
| Modal dialogs | Until close | `click && screenshot` |
| Animations | 0.5-2s | `click && screenshot` (may need timing) |

## Advanced Techniques

### Wait for Element Then Capture

```bash
# Wait for element to appear, then capture
browser-use click 5 && browser-use wait selector ".toast-message" && browser-use screenshot
```

### Capture Multiple States

```bash
# Capture before and after click
browser-use screenshot before-click.png && browser-use click 10 && browser-use screenshot after-click.png
```

### Full Page with Transient Element

```bash
browser-use click 15 && browser-use screenshot --full
```

## Timing Considerations

- **Toast notifications**: Most frameworks (vue-sonner, react-hot-toast) show toasts for 3-5 seconds
- **Animations**: CSS animations may be 0.3-1s, chain captures at peak moment
- **Loading states**: Use `wait selector` to capture when loading starts/ends

## Real Example

**vue-sonner toast capture** (learned from beta.73 fix):

```bash
# Navigate to page with toast trigger
browser-use open http://localhost:5173/auth/register-success?email=test@example.com

# Click copy button, toast appears
browser-use click 20 && browser-use screenshot /Users/ahogek/Pictures/screenshots/toast-captured.png
```

Result: Toast captured with styling (green background, ✓ icon, "Email address copied!" text)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Toast still disappears | Toast duration may be <1s, check framework settings |
| Animation missed | Animation timing, may need `wait` with specific state |
| Dropdown closes too fast | Some dropdowns close on mouse leave, use `hover` instead of `click` |
| Loading spinner blinks | Use `wait selector` + state check |

## Reference

- browser-use skill: `/Users/ahogek/.agents/skills/browser-use/SKILL.md`
- Screenshots path: `/Users/ahogek/Pictures/screenshots/`