const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const fs = require("fs")
const mostBottomWindow = require("./mostBottomWindow")
// console.log(mostBottomWindow)

// 설정 읽어드리기
const configPath = path.join(app.getPath("appData"),"schoolMeals.config.json")
function saveConfig(newConfig) {
	fs.writeFileSync(configPath,JSON.stringify(newConfig))
}
try {config = JSON.parse(fs.readFileSync(configPath)) } catch {
	config = { showSetupScreen: true, winSize: [332,332], ignoreRegex: "\\(? ?[0-9]+\\. ?\\)?", "SC_CODE": null, "REG_CODE": null }
	saveConfig(config)
}
const winSize = config.winSize || [332,332]

// 설정 넘겨주는 ipc handler
ipcMain.handle('getConfig',() => {
	return config
})
ipcMain.handle('setConfig',(newConfig) => {
	newConfig.forEach((value,index) => {
		config[index] = value
	})
	saveConfig(config)
})

// 윈도우 생성
let win
function createWindow() {
	win = new BrowserWindow({
		minimizable: false,
		icon: 'src/icons/headerIcon.png',
		width: parseInt(winSize[0]),
		height: parseInt(winSize[1]),
		frame: false,
		resizable: false,
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

	win.setSkipTaskbar(true) // 작업 표시줄에서 표시 안함
	win.loadFile("src/index.html") // 파일 로드

	// 창 닫힘 / 꺼짐 / 복구
	win.on("closed", () => {
		win = null
	})
	win.on("minimize", () => {
		win.setSkipTaskbar(false)
	})
	win.on("restore", () => {
		win.setSkipTaskbar(true)
	})

	// 이전 위치 복구하기
	let winPos = config.winPos
	if (winPos) {
		win.setPosition(winPos[0],winPos[1])
	}

	function winPosUpdated() {
		try {
			config.winPos = win.getPosition()
			saveConfig(config)
		} catch {}
	}
	win.on('close', winPosUpdated)
	win.on("moved", winPosUpdated)

	win.removeMenu() // ctrl w 로 꺼짐 방지

	// TODO
	// 뒤로 숨기기 (창 맨 아래로)
	if (process.platform === "win32") {
		mostBottomWindow.SendElectronWindowToBackAndKeepItThere(win)
	}
}

// App 핸들링
app.on("ready", createWindow)
app.on("window-all-closed", () => {
	app.quit()
})
app.on("activate", () => {
	if (win === null) {
		createWindow()
	}
})
