// Dependencies:
// - win-setwindowpos@2.1.0

const WM_WINDOWPOSCHANGING = 0x0046;
const { 
	SetWindowPos,
	HWND_BOTTOM,
	SWP_NOACTIVATE,
	SWP_NOSIZE,
	SWP_NOMOVE,
} = require('win-setwindowpos');

function enable(win,dev) {
	if (win.moveBottomWindowEnabled) {
		return
	}
	win.moveBottomWindowEnabled = true

	let winHWND = win.getNativeWindowHandle()
	function moveWindowDown() {
		SetWindowPos(winHWND,HWND_BOTTOM,0,0,0,0, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE)
	}
	// win.hookWindowMessage(WM_WINDOWPOSCHANGING, ()=>setTimeout(moveWindowDown,5))
	let moving = false
	win.on("focus",win.mostBottomWindowFocusHandle = ()=>{
		if (!moving) setTimeout(moveWindowDown,0); win.blur()
	})
	win.on("will-move",win.mostBottomWindowWillMoveHandle = ()=>{
		if (!moving) {
			moving = true
			if (!dev) win.focus()
		}
	})
	win.on("moved",win.mostBottomWindowMovedHandle = ()=>{
		moving = false
		setTimeout(moveWindowDown,0)
		if (!dev) win.blur()
	})
	moveWindowDown()
}

function disable(win) {
	if (!win.moveBottomWindowEnabled) {
		return
	}
	win.moveBottomWindowEnabled = false

	win.removeListener("focus",win.mostBottomWindowFocusHandle)
	win.removeListener("will-move",win.mostBottomWindowWillMoveHandle)
	win.removeListener("moved",win.mostBottomWindowMovedHandle)

	win.mostBottomWindowFocusHandle = null
	win.mostBottomWindowWillMoveHandle = null
	win.mostBottomWindowMovedHandle = null
}

exports.enable = enable
exports.disable = disable
