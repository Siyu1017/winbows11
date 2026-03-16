const { router } = await requireAsync('../_router.js');

function Link(href) {
    const link = document.createElement('div');
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = href || link.getAttribute('href');
        if (route) {
            router.push(route);
        }
    })
    return link;
}

module.exports = { Link }