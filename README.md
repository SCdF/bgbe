# BGBE

## Incompatibilities

- spare arrays, eg `foo = []; foo[999] = 'foo';`. This will result in `['foo']`, without indexes `0-998` being `undefined`

## Performance

[see here](https://scdf.github.io/bgbe/dev/bench/)
