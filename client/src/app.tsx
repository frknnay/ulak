import { useState } from 'react'
import { useChat } from './chat/chat-context'
import { ChatProvider } from './chat/chat-provider'
import { createIdentity, loadIdentity } from './chat/identity'
import { Panel } from './components/panel/panel'
import { Tabs } from './components/tabs/tabs'
import { ChatScreen } from './screens/chat/chat-screen'
import { JoinScreen } from './screens/join/join-screen'
import { ParticipantsScreen } from './screens/participants/participants-screen'
import styles from './app.module.css'

type TabId = 'participants' | 'chat'

// A tab asks for a name once, then joins the chat. A reload keeps the
// name, so it joins right away.
export function App() {
  const [self, setSelf] = useState(() => loadIdentity())

  return (
    <main className={styles.app}>
      <Panel title="Status meeting standup">
        {self ? (
          <ChatProvider self={self}>
            <Meeting />
          </ChatProvider>
        ) : (
          <JoinScreen onJoin={(name) => setSelf(createIdentity(name))} />
        )}
      </Panel>
    </main>
  )
}

function Meeting() {
  const [tab, setTab] = useState<TabId>('chat')
  const { participants } = useChat()

  return (
    <>
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
    </>
  )
}
