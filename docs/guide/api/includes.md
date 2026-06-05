# includes、excludes ^(1.5.0)

当这两个选项都没有设置时，默认会包含所有的 `ts、js、vue、jsx、tsx`文件。

## includes
包含的文件，支持 glob 语法。例如：
```ts
includes: ['src/**/*.{ts,js}']
```
这样的话，仅会转换 `src` 目录下的所有 `ts、js` 文件。

## excludes
排除的文件，支持 glob 语法。例如：
```ts
excludes: ['src/**/*.{ts,js}']
```
这样的话，不会转换 `src` 目录下的所有 `ts、js` 文件。
