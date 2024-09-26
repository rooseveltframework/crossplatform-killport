# crossplatform-killport

Command line program to kill the process running on a given port in any operating system written in Node.js.

Unlike many of the other programs out there that do this, this one works in Windows, Linux, and Mac, it is very easily installed in any OS using `npm`, and it is actively maintained by a [team](https://github.com/orgs/rooseveltframework/people) of people rather than being just some guy's project from several years ago that may or may not work.

## Usage

Install to your system:

To install to your system:

```
npm i -g crossplatform-killport
```

Kill whatever process is using port 8080:

Use from within a Node.js project:

```
node node_modules/.bin/crossplatform-killport/killport.js 8080
```



```
killport 8080
```

Or to use via `npx`:

```
npx crossplatform-killport 8080
```
