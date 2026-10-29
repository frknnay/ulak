import type { ButtonHTMLAttributes } from 'react'
import styles from './icon-button.module.css'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  // Icon-only buttons have no visible text, so the label names them for screen readers.
  label: string
}

export function IconButton({ label, type = 'button', className, ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={className ? `${styles.button} ${className}` : styles.button}
      {...rest}
    />
  )
}
