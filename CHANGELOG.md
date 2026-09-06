## 1.0.4

- Added ability to supply the port number before the `--silent` flag as well as after it.
- Fixed a crash that occurred when a port number outside of the valid 1-65535 range was supplied.
- Fixed a bug on Windows that prevented processes listening on addresses other than `0.0.0.0`, such as IPv6 addresses, from being killed.
- Fixed a bug causing duplicate PIDs reported for the same port to killed more than once.
- Updated dependencies.

## 1.0.3

- Fixed a bug that caused port detection to not properly handle port termination for both IPv4 and IPv6 addresses.
- Fixed a bug that prevented some processes from being killed.
- Added `-v`, `-version`, and `--version` flags to see version.
- Added tests.
- Updated dependencies.

## 1.0.2

- The script will now throw a better error when you don't have permission to kill the process.

## 1.0.1

- Made the script a bit more aggressive in its attempt to kill the process.
- Updated dependencies.

## 1.0.0

- Initial version.
