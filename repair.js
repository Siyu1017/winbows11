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
                document.querySelector('.repair-window').style.alignItems = 'center';
                document.querySelector('.repair-window').style.justifyContent = 'center';
                document.querySelector('.repair-window').style.height = '480px';
                document.querySelector('.repair-window').innerHTML = `<div class="repair-window" style="align-items: center;justify-content: center;height: 480px;display: block;overflow: auto;"><div style="display:flex;align-items:center;justify-content:center;flex-direction: column;overflow: auto;width: -webkit-fill-available;height: -webkit-fill-available;min-height: 320px;/* padding: 4rem 0; */"><svg xmlns="http://www.w3.org/2000/svg" style="width:5rem;height:5rem;min-width: 5rem;min-height: 5rem;" viewBox="0 0 24 24" fill="none" stroke="#E69264" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><div style="max-width: 60%;word-break: break-all;font-weight: 600;font-size: 1.25rem;margin-top: 1rem;">Failed to repair resources.</div> <div style="font-size: .875rem;color: #454545;margin: .375rem;">It is recommended to repair resources where the network connection is stable.</div><br><a href="./repair.html?timestamp=${new Date().getTime()}" style="color: #fff;margin-bottom: .5rem;padding: .75rem 1.25rem;background: #0067c0;border-radius: .5rem;text-decoration: none;cursor: pointer;user-select:none; -webkit-user-select:none;-webkit-user-drag:none;">Retry</a></div></div>`;
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

            const files = data.table;
            const build_id = data.build_id;
            const size = data.size;

            function update() {
                document.querySelector('.repair-percent').innerHTML = ~~((index / (files.length - 1)) * 100) + '% complete';
                document.querySelector('.repair-progress-bar').style.width = (index / (files.length - 1)) * 100 + '%';
            }
            setInterval(update, 1000);
            update();
            var repaired = [];
            for (let i in files) {
                index = i;
                try {
                    name = files[i].split('/').slice(-1)
                } catch (e) {
                    name = files[i]
                }
                update();
                await fs.downloadFile(files[i]).then(() => {
                    repaired.push(files[i]);
                    localStorage.setItem('WINBOWS_DIRECTORIES', JSON.stringify(repaired));

                    if (repaired.length == files.length) {
                        localStorage.removeItem('WINBOWS_REQUIRED');
                        localStorage.setItem('WINBOWS_BUILD_ID', build_id);
                        update();
                        location.href = './';
                    }
                }).catch(async err => {
                    console.log(`Failed to fetch file: ${path}`, err);
                    document.querySelector('.repair-window').style.alignItems = 'center';
                    document.querySelector('.repair-window').style.justifyContent = 'center';
                    document.querySelector('.repair-window').style.height = '480px';
                    document.querySelector('.repair-window').innerHTML = `<div class="repair-window" style="align-items: center;justify-content: center;height: 480px;display: block;overflow: auto;"><div style="display:flex;align-items:center;justify-content:center;flex-direction: column;overflow: auto;width: -webkit-fill-available;height: -webkit-fill-available;min-height: 320px;/* padding: 4rem 0; */"><svg xmlns="http://www.w3.org/2000/svg" style="width:5rem;height:5rem;min-width: 5rem;min-height: 5rem;" viewBox="0 0 24 24" fill="none" stroke="#E69264" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><div style="max-width: 60%;word-break: break-all;font-weight: 600;font-size: 1.25rem;margin-top: 1rem;">Failed to repair resources.</div> <div style="font-size: .875rem;color: #454545;margin: .375rem;">It is recommended to repair resources where the network connection is stable.</div><br><a href="./repair.html?timestamp=${new Date().getTime()}" style="color: #fff;margin-bottom: .5rem;padding: .75rem 1.25rem;background: #0067c0;border-radius: .5rem;text-decoration: none;cursor: pointer;user-select:none; -webkit-user-select:none;-webkit-user-drag:none;">Retry</a></div></div>`;
                    return reject(err);
                });
            }
        })
    } catch (e) { resolve(); }
})();