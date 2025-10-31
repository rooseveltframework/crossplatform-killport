## 1.0.3

- Added mocha tests along with c8 coverage.
- Enhanced the logic to properly handle port termination for both IPv4 and IPv6 addresses.
- Added functionality that kills all processes associated with the specified open port. Effectively manages scenarios where both IPv4 and IPv6 ports are in use simultaneously.

## 1.0.2

- The script will now throw a better error when you don't have permission to kill the process.

## 1.0.1

- Made the script a bit more aggressive in its attempt to kill the process.
- Updated dependencies.

## 1.0.0

- Initial version.
