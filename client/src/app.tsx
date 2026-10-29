import { useState } from 'react'
import { useChat } from './chat/chat-context'
import { Panel } from './components/panel/panel'
import { Tabs } from './components/tabs/tabs'
import { ChatScreen } from './screens/chat-screen/chat-screen'
import { ParticipantsScreen } from './screens/participants-screen/participants-screen'
import styles from './app.module.css'

type TabId = 'participants' | 'chat'

export function App() {
  const [tab, setTab] = useState<TabId>('chat')
  const { participants } = useChat()

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
        {tab === 'participants' ? <ParticipantsScreen /> : <ChatScreen />}
      </Panel>
    </main>
  )
}
