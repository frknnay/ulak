import { startSignalingServer } from './signaling-server/signaling-server.ts'

const port = Number(process.env.PORT ?? 8080)

startSignalingServer(port).on('listening', () => {
  console.log(`Signaling server listening on ws://localhost:${port}`)
})
