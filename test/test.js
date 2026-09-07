const assert = require('node:assert/strict')
const { after, afterEach, before, describe, it } = require('node:test')
const { port } = require('./util/config.js')
const { checkPort, envWithEmptyPath, fixture, runKillport, startServer, stopServers, version } = require('./util/helpers.js')

before(async () => {
  // the tests need the port to themselves
  if (await checkPort(port)) throw new Error(`Port ${port} is currently in use. Please supply a different port number by editing the ./test/util/config.js file.`)
})

afterEach(() => stopServers(port))
after(() => stopServers(port))

describe('universal crossplatform-killport tests', () => {
  it('should kill process of specified port', async () => {
    await startServer('createIpv4Server.js', port)
    runKillport([port])

    assert.equal(await checkPort(port), false, `Port ${port} is still in use`)
  })

  it('should kill multiple processes of specified port', async () => {
    await startServer('createIpv4Server.js', port)
    await startServer('createIpv6Server.js', port)
    runKillport([port])

    assert.equal(await checkPort(port), false, `Port ${port} is still in use`)
  })

  it('should kill a specified port while "--silent" mode is enabled', async () => {
    await startServer('createIpv4Server.js', port)
    const { stdout, stderr } = runKillport([port, '--silent'])

    assert.equal(stdout, '', 'Something was logged to stdout in "--silent" mode')
    assert.equal(stderr, '', 'Something was logged to stderr in "--silent" mode')
    assert.equal(await checkPort(port), false, `Port ${port} is still in use`)
  })

  it('should log version number when supplied "-v", "-version" or "--version" argument', () => {
    for (const arg of ['-v', '-version', '--version']) {
      const { stdout } = runKillport([arg])

      assert.ok(stdout.includes(version), `Version was not included in logs when supplying "${arg}" argument`)
    }
  })

  it('should log that port is not currently in use', () => {
    const { stdout } = runKillport([port])

    assert.ok(stdout.includes(`Port ${port} is available`), `Port ${port} is not available`)
  })

  it('should log that no process was found for running port', async () => {
    await startServer('createIpv4Server.js', port)
    const { stdout } = runKillport([port], { script: fixture('noProcessFound.js') })

    assert.ok(stdout.includes(`No process found running on port ${port}`), `Process was found running on port ${port}`)
  })

  it('should throw error if a valid port number is not supplied', () => {
    for (const arg of ['not-valid-port', '0', '65536']) {
      const { stderr } = runKillport([arg])

      assert.ok(stderr.includes('Please provide a valid port number'), `"${arg}" was accepted as a port number`)
    }
  })

  it('should throw error when attempting to find PID of the process running on the given port', async () => {
    await startServer('createIpv4Server.js', port)
    // with a bogus PATH, killport cannot find lsof or netstat to look the process up
    const { stderr } = runKillport([port], { env: envWithEmptyPath() })

    assert.ok(stderr.includes(`Error finding process on port ${port}`), 'No error thrown when attempting to close port')
  })

  it('should throw permission denied error while attempting to kill process', async () => {
    await startServer('createIpv4Server.js', port)
    const { stderr } = runKillport([port], { script: fixture('permissionDeniedError.js') })

    assert.ok(stderr.includes('Permission denied'), 'No permission error was thrown')
  })

  it('should throw non-permission denied error while attempting to kill process', async () => {
    await startServer('createIpv4Server.js', port)
    const { stderr } = runKillport([port], { script: fixture('nonPermissionDeniedError.js') })

    assert.ok(stderr.includes('Invalid signal'), 'No non-permission error was thrown')
    assert.ok(!stderr.includes('Permission denied'), 'A permission error was thrown')
  })

  it('should throw "Error checking port" error', async () => {
    await startServer('createIpv4Server.js', port)
    const { stderr } = runKillport([port], { script: fixture('serverListenError.js') })

    assert.ok(stderr.includes('Error checking port'), 'No port check error was thrown')
  })
})
