import { Menu } from '../../components/menu/menu'
import { Message } from '../../components/message/message'
import { Notice } from '../../components/notice/notice'
import { Composer } from './composer/composer'
import { useChatScreen } from './use-chat-screen'
import styles from './chat-screen.module.css'

// Times as in the mockup, such as 09:21.
const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function ChatScreen() {
  const chat = useChatScreen()

  return (
    <>
      <ol className={styles.log}>
        {chat.log.map((entry) =>
          entry.kind === 'message' ? (
            <li key={entry.message.id} className={styles.entry}>
              <Message
                author={entry.message.authorName}
                time={timeFormat.format(entry.message.sentAt)}
                text={entry.message.text}
                edited={entry.message.editedAt !== null}
                deleted={entry.message.deleted}
                actions={
                  chat.canChange(entry.message) && (
                    <Menu
                      label="Message actions"
                      items={[
                        { label: 'Edit', onSelect: () => chat.startEditing(entry.message) },
                        { label: 'Delete', onSelect: () => chat.deleteMessage(entry.message) },
                      ]}
                    />
                  )
                }
              />
            </li>
          ) : (
            <li key={entry.notice.id} className={styles.entry}>
              <Notice time={timeFormat.format(entry.notice.at)} text={entry.notice.text} />
            </li>
          ),
        )}
      </ol>
      <Composer
        inputRef={chat.input}
        value={chat.text}
        editing={chat.editingOriginal}
        onChange={chat.setText}
        onSubmit={chat.submit}
        onCancelEdit={chat.cancelEditing}
      />
    </>
  )
}
