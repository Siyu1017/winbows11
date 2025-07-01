class Behavior {
    constructor(el, config) {
        this.el = el;
        this.config = config;
        this.listeners = {
            'pointerdown': [],
            'pointermove': [],
            'dragstart': [],
            'dragging': [],
            'dragend': []
        }
        this.on('dragstart', (e) => {

        })
        this.on('dragging', (e) => {

        })
        this.on('dragend', (e) => {

        })
        this.init();
    }
    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        this.listeners[event].push(listener);
    }
    off(event, listener) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(f => f != listener);
        }
    }
    init() {
        this.dragging = false;
        this.startX = 0;
        this.startY = 0;
        this.pointerX = 0;
        this.pointerY = 0;
        this.xAxis = this.config.xAxis != false;
        this.yAxis = this.config.yAxis != false;
    }
}