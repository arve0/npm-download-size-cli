# npm download size
Are you on slow connection or mobile plan? How many bytes will `npm i lodash` download? This tool resolves dependencies and checks their tarball sizes with a [HTTP HEAD request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD), so you can check download size before doing `npm install package`.

## Install

```sh
npm install -g download-size
```

## Usage
```sh
$ download-size lodash
303.39 KiB
$ download-size request
1.24 MiB
$ download-size async
401.05 KiB
$ download-size chalk
30.49 KiB
$ download-size express
1.08 MiB
```

The reported size includes dependecies. `download-size` gets size from the gzipped tarballs (e.g. http://registry.npmjs.org/lodash/-/lodash-4.17.4.tgz), so space on disk will be higher.

Requests to registry.npmjs.com is gzipped and cached to save bandwidth.

## License
MIT
