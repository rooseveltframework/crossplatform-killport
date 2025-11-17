/* eslint-env mocha */
const assert = require('assert')
const net = require('net')
const path = require('path')
const { spawn, spawnSync } = require('child_process')
const config = require('./util/mochaConfig.js')

function checkPort (port, callback) {
  const server = net.createServer()
  let ipv4Check

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') callback(err, true) // port is in use
    else callback(err, false)
  })

  server.on('listening', () => {
    if (ipv4Check) {
      server.close()
      callback(null, false) // port is not in use
    } else {
      server.close(() => {
        ipv4Check = true
        server.listen(port, '0.0.0.0') // listen on ipv4 addresses
      })
    }
  })

  server.listen(port)
}

before((done) => {
  // make sure port 8080 is available before running tests
  checkPort(config.port, (err, isInUse) => {
    if (err || isInUse) {
      console.error(`Port ${config.port} is currently in use. Please supply a different port number by editing the ./util/mochaConfig.js file.`)
      process.exit(1)
    }
    done()
  })
})

afterEach((done) => {
  // make sure port gets closed
  spawnSync('node', ['killport.js', config.port], {
    shell: false,
    stdio: 'pipe'
  })
  done()
})

describe('universal crossplatform-killport tests', () => {
  it('should kill process of specified port', (done) => {
    const ipv4ServerProcess = spawn('node', ['./test/util/createIpv4Server.js', config.port], {
      shell: false,
      stdio: 'pipe'
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        spawnSync('node', ['killport.js', config.port], {
          shell: false,
          stdio: 'pipe'
        })

        checkPort(config.port, (err, isInUse) => {
          assert(!err && !isInUse, `Port ${config.port} is still in use`)
          done()
        })
      }
    })
  })

  it('should kill multiple processes of specified port', (done) => {
    const ipv4ServerProcess = spawn('node', ['./test/util/createIpv4Server.js', config.port], {
      shell: false,
      stdio: 'pipe'
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        const ipv6ServerProcess = spawn('node', ['./test/util/createIpv6Server.js', config.port], {
          shell: false,
          stdio: 'pipe'
        })

        ipv6ServerProcess.stdout.on('data', (data) => {
          if (data.toString().includes(`IPv6 server is listening on port ${config.port}`)) {
            spawnSync('node', ['killport.js', config.port], {
              shell: false,
              stdio: 'pipe'
            })

            checkPort(config.port, (err, isInUse) => {
              assert(!err && !isInUse, `Port ${config.port} is still in use`)
              done()
            })
          }
        })

        // specific to linux: when binding an IPv6 socket to ::
        // when an IPv4 socket is already bound to the same port,
        // this will lead to a "port already in use" error
        // in most linux distros by default, triggering the code below.
        ipv6ServerProcess.stderr.on('data', () => {
          spawnSync('node', ['killport.js', config.port], {
            shell: false,
            stdio: 'pipe'
          })

          checkPort(config.port, (err, isInUse) => {
            assert(!err && !isInUse, `Port ${config.port} is still in use`)
            done()
          })
        })
      }
    })
  })

  it('should kill a specified port while "--silent" mode is enabled', (done) => {
    const ipv4ServerProcess = spawn('node', ['./test/util/createIpv4Server.js', config.port], {
      shell: false,
      stdio: 'pipe'
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        spawnSync('node', ['killport.js', config.port, '--silent'], {
          shell: false,
          stdio: 'pipe'
        })

        checkPort(config.port, (err, isInUse) => {
          assert(!err && !isInUse, `Port ${config.port} is still in use`)
          done()
        })
      }
    })
  })

  it('should log version number when supplied "-v", "-version" or "--version" argument', (done) => {
    const pkg = require(path.join(__dirname, '..', 'package.json'))
    const version = pkg.version
    const outputArg1 = spawnSync('node', ['killport.js', '-v'], {
      shell: false,
      stdio: 'pipe'
    })
    const outputArg2 = spawnSync('node', ['killport.js', '-version'], {
      shell: false,
      stdio: 'pipe'
    })
    const outputArg3 = spawnSync('node', ['killport.js', '--version'], {
      shell: false,
      stdio: 'pipe'
    })

    assert(outputArg1.stdout && outputArg1.stdout.toString().includes(version), 'Version was not included in logs when supplying "-v" argument')
    assert(outputArg2.stdout && outputArg2.stdout.toString().includes(version), 'Version was not included in logs when supplying "-version" argument')
    assert(outputArg3.stdout && outputArg3.stdout.toString().includes(version), 'Version was not included in logs when supplying "--version" argument')
    done()
  })

  it('should log that port is not currently in use', (done) => {
    const output = spawnSync('node', ['killport.js', config.port], {
      shell: false,
      stdio: 'pipe'
    })

    assert(output.stdout && output.stdout.toString().includes(`Port ${config.port} is available`), `Port ${config.port} is not available`)
    done()
  })

  it('should log that no process was found for running port', (done) => {
    const noProcessFoundPath = path.join(__dirname, './util/noProcessFound.js')
    const ipv4ServerProcess = spawn('node', ['./test/util/createIpv4Server.js', config.port], {
      shell: false,
      stdio: 'pipe'
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        const output = spawnSync('node', [noProcessFoundPath, config.port], {
          shell: false,
          stdio: 'pipe'
        })

        assert(output.stdout && output.stdout.toString().includes(`No process found running on port ${config.port}`), `Process was found running on port ${config.port}`)
        done()
      }
    })
  })

  it('should throw error if a valid port number is not supplied', (done) => {
    const output = spawnSync('node', ['killport.js', 'not-valid-port'], {
      shell: false,
      stdio: 'pipe'
    })

    assert(output.stderr && output.stderr.toString().includes('Please provide a valid port number'), 'Valid port number was supplied')
    done()
  })

  it('should throw error when attempting to find PID of the process running on the given port', (done) => {
    const pathEnv = process.env.PATH
    const os = require('os')
    const command = os.platform() === 'win32' ? 'where' : 'which'
    const args = os.platform() === 'win32' ? ['netstat'] : ['-a', 'lsof']
    const splitPath = os.platform() === 'win32' ? process.env.PATH.split(';') : process.env.PATH.split(':')

    // remove lsof or netstat from PATH
    const argsPath = spawnSync(command, args, { shell: false })
    const argsPathArr = argsPath.stdout.toString().trim().split('\n')
    for (let i = 0; i < argsPathArr.length; i++) {
      const splitArgsPath = os.platform() === 'win32' ? argsPathArr[i].split('\\') : argsPathArr[i].split('/')
      splitArgsPath.splice(splitArgsPath.length - 1, 1)
      const joinArgsPath = os.platform() === 'win32' ? splitArgsPath.join('\\') : splitArgsPath.join('/')
      for (let j = 0; j < splitPath.length; j++) {
        if (os.platform() === 'win32') {
          if (splitPath[j].toLowerCase() === joinArgsPath.toLowerCase()) splitPath.splice(j, 1)
        } else {
          if (splitPath[j] === joinArgsPath) splitPath.splice(j, 1)
        }
      }
    }

    // get node path
    const nodeArgs = os.platform() === 'win32' ? ['node'] : ['-a', 'node']
    const nodePath = spawnSync(command, nodeArgs, { shell: false })
    const nodePathArr = nodePath.stdout.toString().trim().split('\n')

    const joinPathNoBin = os.platform() === 'win32' ? splitPath.join(';') : splitPath.join(':')
    process.env.PATH = joinPathNoBin

    const ipv4ServerProcess = spawn(nodePathArr[0], ['./test/util/createIpv4Server.js', config.port], {
      shell: false,
      stdio: 'pipe',
      windowsVerbatimArguments: true
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        const output = spawnSync(nodePathArr[0], ['killport.js', config.port], {
          shell: false,
          stdio: 'pipe',
          windowsVerbatimArguments: true
        })

        assert(output.stderr && output.stderr.toString().includes(`Error finding process on port ${config.port}`), 'No error thrown when attempting to close port')
        process.env.PATH = pathEnv // reset PATH for rest of tests
        done()
      }
    })
  })

  it('should throw permission denied error while attempting to kill process', (done) => {
    const permissionDeniedErrorPath = path.join(__dirname, './util/permissionDeniedError.js')
    const ipv4ServerProcess = spawn('node', ['./test/util/createIpv4Server.js', config.port], {
      shell: false,
      stdio: 'pipe'
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        const output = spawnSync('node', [permissionDeniedErrorPath, config.port], {
          shell: false,
          stdio: 'pipe'
        })

        assert(output.stderr && output.stderr.toString().includes('Permission denied'), 'No permission error was thrown')
        done()
      }
    })
  })

  it('should throw non-permission denied error while attempting to kill process', (done) => {
    const nonPermissionDeniedErrorPath = path.join(__dirname, './util/nonPermissionDeniedError.js')
    const ipv4ServerProcess = spawn('node', ['./test/util/createIpv4Server.js', config.port], {
      shell: false,
      stdio: 'pipe'
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        const output = spawnSync('node', [nonPermissionDeniedErrorPath, config.port], {
          shell: false,
          stdio: 'pipe'
        })

        assert(output.stderr && !output.stderr.toString().includes('Permission denied'), 'No non-permission error was thrown')
        done()
      }
    })
  })

  it('should throw "Error checking port" error', (done) => {
    const serverListenError = path.join(__dirname, './util/serverListenError.js')
    const ipv4ServerProcess = spawn('node', ['./test/util/createIpv4Server.js', config.port], {
      shell: false,
      stdio: 'pipe'
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        const output = spawnSync('node', [serverListenError, config.port], {
          shell: false,
          stdio: 'pipe'
        })

        assert(output.stderr && output.stderr.toString().includes('Error checking port'), 'No port check error was thrown')
        done()
      }
    })
  })
})
