import './lib/select.min.js';
import contextMenu from './contextMenu/contextMenu.js';
import * as utils from './utils.js';
import { Terminal } from '@xterm/xterm';

const WinUI = { contextMenu, utils, Terminal };
export default WinUI;