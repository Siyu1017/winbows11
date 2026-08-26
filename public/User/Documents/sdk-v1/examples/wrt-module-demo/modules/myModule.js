// Export as common js type

exports.test = () => {
    return 1;
};
exports.logMessage = () => {
    return console.log('Message from myModule🩷');
}
exports.exec = () => {
    return setInterval(() => {
        console.info('setInterval from myModule')
    }, 10);
}