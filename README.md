# npm download size
On slow connection or mobile plan? How many bytes will `npm i lodash` download This tool resolves dependencies and checks their tarball sizes with a HTTP HEAD request, so you can check download size up front.

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
```

The reported download size includes size of package pluss size of dependecies. Size reported is the size of packages gzipped tarball, so space on disk will be higher.

Requests to registry.npmjs.com is gzipped and cached to save bandwidth.

## License
MIT
