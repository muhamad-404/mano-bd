import os from 'node:os'
import qrcode from 'qrcode-terminal'

const arg = process.argv[2]

let protocol = 'http'
let port = 5173

if (arg === 'https') {
  protocol = 'https'
  port = 5173
} else if (arg === 'preview') {
  protocol = 'http'
  port = 4173
}

const interfaces = os.networkInterfaces()
const addresses = []

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name] || []) {
    if (iface.family === 'IPv4' && !iface.internal) {
      addresses.push(iface.address)
    }
  }
}

if (addresses.length === 0) {
  console.log('No LAN IPv4 address found. Connect to Wi-Fi and try again.')
  process.exit(0)
}

const urls = addresses.map((ip) => `${protocol}://${ip}:${port}`)

console.log('')
console.log('+--------------------------------------------------------------+')
for (const url of urls) {
  console.log(`| Open on your phone (same Wi-Fi): ${url}`)
}
console.log('+--------------------------------------------------------------+')
console.log('')

qrcode.generate(urls[0], { small: true })

console.log('')
console.log(
  'Reminder: microphone features need `npm run dev:https` on a phone; the first HTTPS visit shows a self-signed certificate warning that is safe to accept for your own dev server.',
)
console.log('')
