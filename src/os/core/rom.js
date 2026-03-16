// ROM
function list() {
    const item = localStorage.getItem('WINBOWS_ROM_FT');
    if (item) return JSON.parse(item);
    localStorage.setItem('WINBOWS_ROM_FT', '[]');
    return [];
}

function getKey(fileName) {
    return 'WINBOWS_ROM_FT:' + fileName;
}

const rom = {
    list,
    exists: function (fileName) {
        return list().some(f => f.n === fileName);
    },
    write: function (fileName, fileContent) {
        const FT = list();
        const fileIndex = FT.findIndex(f => f.n === fileName);
        if (fileIndex !== -1) {
            FT.splice(fileIndex, 1);
        }
        FT.push({
            n: fileName,
            l: fileContent.length
        });
        localStorage.setItem(getKey(fileName), fileContent);
        localStorage.setItem('WINBOWS_ROM_FT', JSON.stringify(FT));
    },
    read: function (fileName) {
        return localStorage.getItem(getKey(fileName)) || "";
    },
    rm: function (fileName) {
        const FT = list();
        const fileIndex = FT.findIndex(f => f.n === fileName);
        if (fileIndex !== -1) {
            FT.splice(fileIndex, 1);
        }
        localStorage.removeItem(getKey(fileName));
        localStorage.setItem('WINBOWS_ROM_FT', JSON.stringify(FT));
    }
}

export default rom;