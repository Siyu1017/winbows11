Object.defineProperty(self.System.ToolbarComponents, 'Icon', {
    value: class {
        constructor(url) {
            this.url = url;
            return new Promise(async (resolve, reject) => {
                return await System.request({
                    type: 'function',
                    name: 'ToolbarComponents.Icon',
                    url: this.url
                }).then(e => {
                    return resolve(e);
                })
            })
        }
    },
    configurable: false,
    writable: false
})

Object.defineProperty(self.System.ToolbarComponents, 'Menu', {
    value: class {
        constructor(items) {
            this.items = items;
            return new Promise(async (resolve, reject) => {
                return await System.request({
                    type: 'function',
                    name: 'ToolbarComponents.Menu',
                    items: this.items
                }).then(e => {
                    return resolve(e);
                })
            })
        }
    },
    configurable: false,
    writable: false
})

Object.defineProperty(self.System.ToolbarComponents, 'Button', {
    value: class {
        constructor(content) {
            this.content = content;
            return new Promise(async (resolve, reject) => {
                return await System.request({
                    type: 'function',
                    name: 'ToolbarComponents.Button',
                    content: this.content
                }).then(e => {
                    return resolve(e);
                })
            })
        }
    },
    configurable: false,
    writable: false
})