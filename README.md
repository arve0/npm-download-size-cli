# npm download size
Are you on slow connection or limited mobile plan? Care about tarball size of your package? Care about bloat? How many bytes download are `npm i lodash`? Check with

```sh
$ download-size lodash
lodash@4.17.4: 303.39 KiB
```

before installing!

npm-download-size is also available online: https://arve0.github.io/npm-download-size/

Package sizes are resolved through a [server side API](https://github.com/arve0/npm-download-size-api), so only statistics is ever downloaded while using this tool.

## Install

```sh
npm install -g download-size  # 2 KiB download
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

The reported size includes all dependecies. `download-size` gets size from the gzipped tarballs (e.g. http://registry.npmjs.org/lodash/-/lodash-4.17.4.tgz), so space on disk will be higher.


## Why?
Many node packages are bloated beyond belief. This tool helps you take an informed decision. Should you rely on that package? [1,1 MB for doing HTTP requests](https://arve0.github.io/npm-download-size/#request) you say? Take a stand against bloat!

## License
MIT
