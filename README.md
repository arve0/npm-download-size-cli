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
npm install -g download-size  # 8 KiB download
```

## Usage
```sh
$ download-size svelte
svelte@3.25.0: 1.12 MiB

$ download-size -f package.json
package.json (svelte-app@1.0.0):
  devDependencies:
    npm-run-all@4.1.5: 429.35 KiB
    rollup@1.32.1: 845.42 KiB
    rollup-plugin-commonjs@10.1.0: 216.54 KiB
    rollup-plugin-livereload@1.3.0: 239.76 KiB
    rollup-plugin-node-resolve@5.2.0: 185.16 KiB
    rollup-plugin-svelte@5.2.3: 71.01 KiB
    rollup-plugin-terser@5.3.1: 827.78 KiB
    svelte@3.25.0: 1.12 MiB
All dependencies: 3.87 MiB
```

The reported size includes all dependecies. `download-size` gets size from the gzipped tarballs (e.g. http://registry.npmjs.org/lodash/-/lodash-4.17.4.tgz), so space on disk will be higher.


## Why?
Many node packages are bloated beyond belief. This tool helps you take an informed decision. Should you rely on that package? [1,1 MB for doing HTTP requests](https://arve0.github.io/npm-download-size/#request) you say? Take a stand against bloat!

## License
MIT
