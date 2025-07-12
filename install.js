(async () => {
    var index = 0;
    var name = '';
    var downloadedSize = 0;

    if (!window.fs) {
        // Check if the file system has been initialized
        console.warn('Wait for file system initialization...');
        await (() => {
            return new Promise((resolve, reject) => {
                window.__fscf.c(resolve);
            })
        })();
        console.warn('File system initialized.');
    }

    async function downloadFile(path) {
        function removeStringInRange(str, start, end) {
            return str.substring(0, start) + str.substring(end);
        }

        return new Promise((resolve, reject) => {
            fetch(`./${removeStringInRange(path, 0, path.split(':/').length > 1 ? (path.split(':/')[0].length + 2) : 0)}?timestamp=${new Date().getTime()}`).then(response => {
                if (response.ok) {
                    return response.blob();
                } else {
                    throw new Error(`Failed to fetch file: ${path}`);
                }
            }).then(async content => {
                var blob = content;
                await fs.writeFile(path, blob);
                downloadedSize += blob.size;
                return resolve();
            }).catch(async err => {
                console.log(`Failed to fetch file: ${path}`, err);
                document.querySelector('.install-window').style.alignItems = 'center';
                document.querySelector('.install-window').style.justifyContent = 'center';
                document.querySelector('.install-window').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" style="width:5rem;height:5rem;" viewBox="0 0 24 24" fill="none" stroke="#E69264" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><div style= "max-width: 60%;word-break: break-all;font-weight: 600;font-size: 1.25rem;margin-top: 1rem;">An error occurred and cannot be downloaded ${name}</div> <div style="font-size: .875rem;color: #454545;margin: .375rem;">It is recommended that you download in a place with a stable network connection</div><br><a href="./" style="color: #fff;margin-bottom: .5rem;padding: .75rem 1.25rem;background: #0067c0;border-radius: .5rem;text-decoration: none;cursor: pointer;user-select:none; -webkit-user-select:none;-webkit-user-drag:none;">Re-execute Winbows11?</a>`;
                return reject(err);
            })
        })
    }

    try {
        fetch(`./build.json?timestamp=${new Date().getTime()}`).then(res => {
            return res.json();
        }).then(async data => {
            // Clear configs
            localStorage.removeItem('WINBOWS_SYSTEM_FV_VIEWERS');
            localStorage.removeItem('WINBOWS_SYSTEM_FV_DEFAULT_VIEWERS');
            localStorage.removeItem('WINBOWS_SYSTEM_FV_REGISTERED_VIEWERS');

            // Remove Temp Files
            try {
                await fs.rm('C:/Winbows/System/Temp');
            } catch (err) {
                console.error('Failed to remove temp files:', err);
            }

            var lastTime = Date.now();
            var startTime = lastTime;

            var nameElement = document.createElement('div');
            var timeElement = document.createElement('div');
            var lastElement = document.createElement('div');

            const files = data.table;
            const build_id = data.build_id;
            const size = data.size;

            console.log('Whole size: ' + formatBytes(size).replaceAll('(', '').replaceAll(')', ''));

            nameElement.innerHTML = 'Name: unknown';
            timeElement.innerHTML = 'Remaining times: unknown';
            lastElement.innerHTML = 'Remaining items: unknown';

            document.querySelector('.install-info').appendChild(nameElement);
            document.querySelector('.install-info').appendChild(timeElement);
            document.querySelector('.install-info').appendChild(lastElement);

            function predictTime() {
                var avarageTime = (Date.now() - lastTime) / 2 / 1000;
                var lastItems = files.length - index;
                var seconds = ~~(avarageTime * lastItems);
                if (lastTime == startTime) {
                    return 'Calculating...';
                } else if (seconds < 60) {
                    return `${seconds} sencond(s)`;
                } else if (seconds < 60 * 60) {
                    return `${~~(seconds / 60)} minute(s) and ${seconds % 60} sencond(s)`;
                } else if (seconds < 60 * 60 * 24) {
                    return `${~~(seconds / (60 * 60))} hour(s)`;
                } else {
                    return 'more than one day';
                }
            }

            function formatBytes(bytes, decimals = 2) {
                if (bytes === 0) return '';

                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));

                return '(' + parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i] + ')';
            }

            function updateItem() {
                document.querySelector('.install-percent').innerHTML = ~~((index / (files.length - 1)) * 100) + '% complete';
                document.querySelector('.install-progress-bar').style.width = (index / (files.length - 1)) * 100 + '%';
                nameElement.innerHTML = `Name: ${name}`;
                lastElement.innerHTML = `Remaining items: ${files.length - index - 1} ${formatBytes(size - downloadedSize)}`;
            }
            function updateTime() {
                updateItem();
                timeElement.innerHTML = `Remaining times: ${predictTime()}`;
            }
            function update() {
                updateTime();
            }
            setInterval(update, 1000);
            update();
            var installed = [];
            for (let i in files) {
                index = i;
                try {
                    name = files[i].split('/').slice(-1)
                } catch (e) {
                    name = files[i]
                }
                updateItem();
                await downloadFile(files[i]).then(() => {
                    var file = document.createElement('div');
                    file.className = 'install-detail-installed';
                    file.innerHTML = `<span>${files[i].replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</span>`;
                    document.querySelector('.install-detail-installeds').appendChild(file);
                    document.querySelector('.install-details').scrollTop = document.querySelector('.install-detail-installeds').scrollHeight;
                    duration = Date.now() - startTime;
                    lastTime = startTime;
                    startTime = Date.now();
                    installed.push(files[i]);
                    localStorage.setItem('WINBOWS_DIRECTORIES', JSON.stringify(installed));

                    console.log(formatBytes(downloadedSize).replaceAll('(', '').replaceAll(')', ''));

                    if (installed.length == files.length) {
                        localStorage.setItem('WINBOWS_BUILD_ID', build_id);
                        update();
                        location.href = './';
                    }
                });
            }
        })
    } catch (e) { resolve(); }
})();