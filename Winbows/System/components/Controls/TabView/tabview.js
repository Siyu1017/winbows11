async function useTabview() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = await fs.getFileURL('C:/Winbows/System/components/Controls/TabView/tabview.css');
    document.head.appendChild(link);
    document.documentElement.classList.add('tabview');
}