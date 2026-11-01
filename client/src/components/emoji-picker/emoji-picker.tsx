import { useId, useRef, type ToggleEvent } from 'react'
import { Smile } from 'lucide-react'
import { currentTheme } from '../../theme/theme'
import { IconButton } from '../icon-button/icon-button'
import styles from './emoji-picker.module.css'

type EmojiPickerProps = {
  disabled?: boolean
  // Called with the picked emoji, such as "👋".
  onSelect: (emoji: string) => void
}

// A smiley button that opens emoji-mart's picker above it. Like the Menu,
// the picker is a popover placed by CSS anchor positioning. It loads with
// its emoji data the first time it opens, so it doesn't slow down the
// app's first load, and it is built anew on every open so its search box
// takes the focus.
export function EmojiPicker({ disabled, onSelect }: EmojiPickerProps) {
  const id = useId()
  const anchor = `--emoji-picker${id}`
  const popover = useRef<HTMLDivElement>(null)

  async function handleToggle(event: ToggleEvent<HTMLDivElement>) {
    const element = popover.current
    if (!element) return
    if (event.newState === 'closed') {
      element.replaceChildren()
      return
    }

    const [{ Picker }, { default: data }] = await Promise.all([
      import('emoji-mart'),
      import('@emoji-mart/data'),
    ])
    // It may have closed while loading.
    if (!element.matches(':popover-open')) return
    const picker = new Picker({
      data,
      // Read on each open, since the picker is built anew every time.
      theme: currentTheme(),
      autoFocus: true,
      previewPosition: 'none',
      // Narrow enough to fit inside the chat panel.
      perLine: 8,
      onEmojiSelect: (emoji: { native: string }) => {
        element.hidePopover()
        onSelect(emoji.native)
      },
    })
    // Always true in a browser. emoji-mart's types allow a plain object for
    // server rendering, so this tells TypeScript it is an element.
    if (picker instanceof HTMLElement) element.replaceChildren(picker)
  }

  return (
    <>
      <IconButton
        label="Emoji"
        className={styles.trigger}
        style={{ anchorName: anchor }}
        popoverTarget={id}
        disabled={disabled}
      >
        <Smile />
      </IconButton>
      <div
        ref={popover}
        id={id}
        popover="auto"
        className={styles.picker}
        style={{ positionAnchor: anchor }}
        onToggle={handleToggle}
      />
    </>
  )
}
