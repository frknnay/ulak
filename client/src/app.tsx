import { useState } from 'react'
import { Panel } from './components/panel/panel'
import { Tabs } from './components/tabs/tabs'
import { ChatScreen, type ChatEntry } from './screens/chat-screen/chat-screen'
import { ParticipantsScreen } from './screens/participants-screen/participants-screen'
import styles from './app.module.css'

// Placeholder data until the screens are wired to chat state.
const participants = [
  { id: '1', name: 'Alfonso Press' },
  { id: '2', name: 'Ann Lipshutz' },
  { id: '3', name: 'Chance Carder' },
  { id: '4', name: 'Kianna Bator' },
  { id: '5', name: 'Nolan Passaquindici Arcand' },
  { id: '6', name: 'Phillip Philips' },
  { id: '7', name: 'Phillip Rosser' },
]

const entries: ChatEntry[] = [
  {
    kind: 'message',
    id: '1',
    author: 'Alfonso',
    time: '09:21',
    text: 'Waiting for a few more before we begin, I’m keeping my microphone muted for now 😉',
  },
  { kind: 'message', id: '2', author: 'Kiana', time: '09:32', text: 'Very nice presentation :)' },
  { kind: 'notice', id: '3', time: '09:33', text: 'Marcus joined' },
  { kind: 'message', id: '4', author: 'Chance', time: '09:35', text: '🤩' },
  {
    kind: 'message',
    id: '5',
    author: 'Nolan',
    time: '09:41',
    text: 'Can you share the file with us?',
  },
  { kind: 'notice', id: '6', time: '09:45', text: 'Ann Lipshutz left' },
]

type TabId = 'participants' | 'chat'

export function App() {
  const [tab, setTab] = useState<TabId>('chat')

  return (
    <main className={styles.app}>
      <Panel title="Status meeting standup">
        <Tabs
          label="Meeting"
          tabs={[
            { id: 'participants', label: `Participants (${participants.length})` },
            { id: 'chat', label: 'Chat' },
          ]}
          selected={tab}
          onSelect={setTab}
        />
        {tab === 'participants' ? (
          <ParticipantsScreen participants={participants} />
        ) : (
          <ChatScreen entries={entries} onSend={() => {}} />
        )}
      </Panel>
    </main>
  )
}
