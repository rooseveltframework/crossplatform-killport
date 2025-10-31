const net = require('net')
const server = net.createServer()
const port = process.argv[2]

server.once('error', () => { server.close() })
server.once('listening', () => { console.log(`IPv4 server is listening on port ${port}`) })

server.listen(port, '0.0.0.0')
