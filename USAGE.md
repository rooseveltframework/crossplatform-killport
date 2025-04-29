First make sure [Node.js](https://nodejs.org) is installed on your system.

Then, to install `crossplatform-killport` to your system:

```
npm i -g crossplatform-killport
```

Kill whatever process is using port 8080:

```
killport 8080
```

Windows users may need to run `Set-ExecutionPolicy Unrestricted` on their terminal to permit the script to run. See [docs](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies) from Microsoft for more information.

Use via `npx` (this will allow you to use it without installing it to your system by downloading it from `npm` temporarily):

```
npx crossplatform-killport 8080
```

Use from within a Node.js project's root directory:

```
node_modules/.bin/killport 8080
```

Use from within Node.js code:

``` javascript
const { spawnSync, } = require('child_process')
spawnSync('node_modules/.bin/killport', ['8080', '--silent'], { env: process.env, shell: false, stdio: ['ignore', 'pipe', 'pipe'] })
```
