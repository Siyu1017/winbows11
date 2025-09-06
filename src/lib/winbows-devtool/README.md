# winbows-devtool

Devtool for Winbows11

## Methods

### Standard output

- `log(...args)`
- `info(...args)`
- `debug(...args)`
- `warn(...args)`
- `error(...args)`

### Group

- `group(...args)`
- `groupCollapsed(...args)`
- `groupEnd()`

### Count

- `count(label?)`
- `countReset(label?)`

### Time

- `time(label?)`
- `timeLog(label?, ...args)`
- `timeEnd(label?)`

### Other

- `table(...args)`
- `trace(...args)`
- `assert(condition, ...args)`
- `clear()`

## Example

```js
import Devtool from './dist/index.js';

const devtool = new Devtool();
const console = devtool.console;

document.body.appendChild(devtool.devtool);

// clear
console.clear();

// Version
console.info("Version:", devtool.version);

// Basic output
console.log("log");
console.info("info");
console.debug("debug");
console.warn("warn");
console.error("error");

// Styled
console.log("%cStyled text", "color: #259ced");

// With string substitutions
for (let i = 0; i < 5; i++) {
    console.log("Hello, %s. You've called me %d times.", "Bob", i + 1);
}

// Group
console.group("level1");
console.log('Log inside level1');
console.group('level2');
console.log('Log inside level2');
console.groupCollapsed('level3 ( collapsed )');
console.warn('Warn inside collapsed level3');
console.groupEnd();
console.groupEnd();
console.groupEnd();

// count
console.count('myCount');
console.count('myCount');
console.count('myCount');
console.countReset('myCount');
console.count('myCount');

// time
console.time('myTimer');
console.timeLog('myTimer');
console.timeEnd('myTimer');

// trace
console.trace();

// assets
console.assert(4 == 5, '4 is not equal to 5');

// table
function Person(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
}

var john = new Person("John", "Smith");
var jane = new Person("Jane", "Doe");
var emily = new Person("Emily", "Jones");

console.table([john, jane, emily]);
console.table([john, jane, emily], ['firstName']);
```
