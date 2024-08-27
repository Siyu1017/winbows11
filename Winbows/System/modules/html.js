self.HTML = async (target, html) => {
    return await System.request({
        type: 'function',
        name: 'HTML',
        target: target,
        html: html
    })
}