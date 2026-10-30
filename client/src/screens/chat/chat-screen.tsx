import { Composer } from './composer/composer'
import { MessageLog } from './message-log/message-log'
import { useChatScreen } from './use-chat-screen'

export function ChatScreen() {
  const chat = useChatScreen()

  return (
    <>
      <MessageLog
        log={chat.log}
        canChange={chat.canChange}
        onEdit={chat.startEditing}
        onDelete={chat.deleteMessage}
      />
      <Composer
        inputRef={chat.input}
        value={chat.text}
        editing={chat.editingOriginal}
        offline={!chat.online}
        onChange={chat.setText}
        onSubmit={chat.submit}
        onCancelEdit={chat.cancelEditing}
      />
    </>
  )
}
