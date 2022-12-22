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

function apply(win,dev) {
	let winHWND = win.getNativeWindowHandle()
	function moveWindowDown() {
		SetWindowPos(winHWND,HWND_BOTTOM,0,0,0,0, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE)
	}
	// win.hookWindowMessage(WM_WINDOWPOSCHANGING, ()=>setTimeout(moveWindowDown,5))
	let moving = false
	win.on("focus",()=>{
		if (!moving) setTimeout(moveWindowDown,0)
	})
	win.on("will-move",()=>{
		if (!moving) {
			moving = true
			if (!dev) win.focus()
		}
	})
	win.on("moved",()=>{
		moving = false
		setTimeout(moveWindowDown,0)
		if (!dev) win.blur()
	})
}

exports.apply = apply
