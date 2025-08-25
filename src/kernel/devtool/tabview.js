import { EventEmitter } from "../WRT/utils/eventEmitter.js";
import "./tabview.css";

export class Tabview extends EventEmitter {
    /**
     * @param {HTMLElement} container 
     * @param {*} options 
     */
    constructor(container, options = {
        width: container.offsetWidth,
        height: 28
    }) {
        super();

        this.width = options?.width ?? container.offsetWidth;
        this.height = options?.height ?? 28;

        this.tabs = {};
        this.order = [];

        this.container = document.createElement('div');
        this.tabsContainer = document.createElement('div');
        this.tabsEl = document.createElement('div');
        this.slider = document.createElement('div');
        this.itemContainer = document.createElement('div');

        this.selected = null;
        this.tabsContainer.style.width = `${this.width}px`;
        this.tabsContainer.style.height = `${this.height}px`;
        this.tabsContainer.style.minHeight = `${this.height}px`;
        this.itemContainer.style.height = `calc(100% - ${this.height}px)`;

        this.container.className = 'devtool-tabview';
        this.tabsContainer.className = 'devtool-tabview-tabs-container';
        this.tabsEl.className = 'devtool-tabview-tabs';
        this.slider.className = 'devtool-tabview-slider';
        this.itemContainer.className = 'devtool-tabview-item-container';

        container.appendChild(this.container);
        this.container.appendChild(this.tabsContainer);
        this.tabsContainer.appendChild(this.tabsEl);
        this.tabsContainer.appendChild(this.slider);
        this.container.appendChild(this.itemContainer);

        const observer = new ResizeObserver(() => {
            this.width = container.offsetWidth;
            this.tabsContainer.style.width = `${this.width}px`;
        });
        observer.observe(container);
    }
    add(tab) {
        const title = tab?.title ?? `Tab${this.tabs.length + 1}`;
        const closable = tab?.closable ?? false;
        const id = tab?.id ?? `tab-${this.tabs.length + 1}`;

        const tabItem = document.createElement('div');
        const tabTitle = document.createElement('div');
        const itemEl = document.createElement('div');

        tabItem.className = 'devtool-tabview-tab';
        tabTitle.className = 'devtool-tabview-tab-title';
        tabTitle.textContent = title;
        itemEl.className = 'devtool-tabview-item';

        tabItem.appendChild(tabTitle);
        this.tabsEl.appendChild(tabItem);
        itemEl.appendChild(tab.content);
        this.itemContainer.appendChild(itemEl);


        const onSelect = () => {
            if (this.selected == id) return;

            this.itemContainer.querySelectorAll('.active').forEach(item => item.classList.remove('active'));
            this.tabsContainer.querySelectorAll('.selected').forEach(tab => tab.classList.remove('selected'));

            itemEl.classList.add('active');
            tabItem.classList.add('selected');

            this.selected = id;
            this._emit('select', id);

            const children = tabItem.parentNode.children;
            const index = Array.prototype.indexOf.call(children, tabItem);
            let left = 0;
            for (let i = 0; i < index; i++) {
                left += children[i].offsetWidth;
            }
            this.slider.style.left = `${left}px`;
            this.slider.style.width = `${tabItem.offsetWidth}px`;
        }

        tabItem.addEventListener('click', onSelect);

        this.tabs[id] = {
            title,
            closable,
            id,
            tabItem,
            tabTitle,
            onSelect
        };
        this.order.push(id);
    }
    remove(tabId) {
        const tabIndex = this.order.indexOf(tabId);
        if (tabIndex != -1) {
            const tab = this.tabs[tabId];
            this.order.splice(tabIndex, 1);
            delete this.tabs[tabId];

            tab.tabItem.remove();
            if (this.selected == tabId) {
                this.itemContainer.innerHTML = '';
                this.selected = null;
            }
            this._emit('remove', tabId);

            if (this.order[tabIndex]) {
                this.select(this.order[tabIndex]);
            } else {
                this.select(this.order[0]);
            }
        }
    }
    select(tabId) {
        const tab = this.tabs[tabId];
        if (tab) {
            tab.onSelect();
        }
    }
}