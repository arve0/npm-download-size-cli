# npm download size
Are you on slow connection or limited mobile plan? Care about tarball size of your package? How many bytes download are `npm i -S lodash`? Check the download size with `download-size package` before installing!

This tool resolves dependencies and checks their tarball sizes with [HTTP HEAD requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD), so you can check download size before doing `npm install package`. The requests are done  [server side](https://github.com/arve0/npm-download-size-api).

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

The reported size includes dependecies. `download-size` gets size from the gzipped tarballs (e.g. http://registry.npmjs.org/lodash/-/lodash-4.17.4.tgz), so space on disk will be higher.


## Why?
Many node packages are bloated beyond belief. This tool helps you take an informed decision. Should you rely on that package? [1,1 MB for doing HTTP requests](https://asciinema.org/a/GqCnDlllrI0YtJgc7BkxisCla) you say? Take a stand against bloat!

## License
MIT
