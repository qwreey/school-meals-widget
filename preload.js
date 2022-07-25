window._ = require("lodash")
window.remote = require("electron").remote
if (window.remote) {
    window.Menu = window.remote.Menu
    window.MenuItem = window.remote.MenuItem
}
window.config = require("./config.json")
