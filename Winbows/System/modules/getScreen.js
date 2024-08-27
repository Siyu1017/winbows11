MESSENGER.send('getScreen');
MESSENGER.on('getScreen', (e) => {
    return
})

function randomString(length) {
    if (!length) return console.warn('Option Invalid');
    var characters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'p', 'Q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '2', '3', '4', '5', '6', '7', '8', '9'],
        str = '';
    for (let i = 0; i < length; i++) {
        str += characters[Math.floor(Math.random() * characters.length)];
    }
    return str;
}

function randomID(target) {
    var id = randomString(10);
    while (target.hasOwnProperty(id)) {
        id = randomString(10);
    }
    return id;
}

var messageIDs = {};

function getScreen() {
    var id = randomID(messageIDs);
    MESSENGER.send()
}