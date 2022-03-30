const { app, BrowserWindow } = require("electron")
const path = require("path")
app.allowRendererProcessReuse = false

let win
const config = require("./config.json")
const renderScale = config.renderScale
const winSize = config.winSize

function createWindow() {
	win = new BrowserWindow({
		minimizable: true,
		// icon: 'src/app.png',
		width: parseInt(winSize[0] * renderScale),
		height: parseInt(winSize[1] * renderScale),
		frame: false,
		resizable: true,
		// alwaysOnTop: true,
		transparent: true,
		webPreferences: {
			transparent: true,
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: true,
			enableRemoteModule: true,
			contextIsolation: false,
		},
	})

	win.setSkipTaskbar(true);
	win.loadFile("src/index.html")

	win.on("closed", () => {
		win = null
	})
}

app.on("ready", createWindow)

app.on("window-all-closed", () => {
	app.quit()
})

app.on("activate", () => {
	if (win === null) {
		createWindow()
	}
})
