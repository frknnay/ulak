import { useId, useRef, type ToggleEvent } from 'react'
import { Ellipsis } from 'lucide-react'
import { IconButton } from '../icon-button/icon-button'
import styles from './menu.module.css'

type MenuItem = {
  label: string
  onSelect: () => void
}

type MenuProps = {
  // Names the button that opens the menu, such as "Message actions".
  label: string
  items: MenuItem[]
}

// A ⋯ button that opens a short list of actions. The browser's popover
// closes it on Escape or a click outside, and CSS anchor positioning
// places it under the button.
export function Menu({ label, items }: MenuProps) {
  const id = useId()
  const anchor = `--menu${id}`
  const popover = useRef<HTMLDivElement>(null)

  // Move focus into the menu so keyboard users can pick an action.
  function handleToggle(event: ToggleEvent<HTMLDivElement>) {
    if (event.newState === 'open') popover.current?.querySelector('button')?.focus()
  }

  function select(item: MenuItem) {
    popover.current?.hidePopover()
    item.onSelect()
  }

  return (
    <>
      <IconButton
        label={label}
        className={styles.trigger}
        style={{ anchorName: anchor }}
        popoverTarget={id}
      >
        <Ellipsis />
      </IconButton>
      <div
        ref={popover}
        id={id}
        popover="auto"
        className={styles.menu}
        style={{ positionAnchor: anchor }}
        onToggle={handleToggle}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={styles.item}
            onClick={() => select(item)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}
