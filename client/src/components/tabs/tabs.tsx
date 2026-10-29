import styles from './tabs.module.css'

type Tab<Id extends string> = {
  id: Id
  label: string
}

type TabsProps<Id extends string> = {
  label: string
  tabs: Tab<Id>[]
  selected: Id
  onSelect: (id: Id) => void
}

export function Tabs<Id extends string>({ label, tabs, selected, onSelect }: TabsProps<Id>) {
  return (
    <div role="tablist" aria-label={label} className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === selected}
          className={styles.tab}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
