// const ffi = require("ffi-napi");
// const ref = require("ref-napi");
// const Struct = require("ref-struct-napi");

// const HWND_BOTTOM = 1;
// let SetWindowPos_Flags = {
//     NOSIZE: 0x0001,
//     NOMOVE: 0x0002,
//     NOACTIVATE: 0x0010,
// }

// var user32 = new ffi.Library("user32", {
//     // return, handle, handleInsertAfter, x, y, cx, cy, flags
//     SetWindowPos: ["bool", ["int32", "int32", "int32", "int32", "int32", "int32", "uint32"]],
// });

// function SendWindowToBack(handle) {
//     user32.SetWindowPos(handle, HWND_BOTTOM, 0, 0, 0, 0, SetWindowPos_Flags.NOMOVE | SetWindowPos_Flags.NOSIZE | SetWindowPos_Flags.NOACTIVATE);
// }

// const WM_WINDOWPOSCHANGING = 0x0046;
// const SWP_NOZORDER = 0x0004;
// let WINDOWPOS = Struct({
//     hwndInsertAfter: ffi.types.int32,
//     hwnd: ffi.types.int32,
//     x: ffi.types.int32,
//     y: ffi.types.int32,
//     cx: ffi.types.int32,
//     cy: ffi.types.int32,
//     flags: ffi.types.uint32,
// });
// function AddHook(window, disableZIndexChanging = false) {
//     window.hookWindowMessage(WM_WINDOWPOSCHANGING, (wParam, lParam)=> {
//         // The "lParam" buffer holds the address to a place in unmanaged memory, which itself holds the address to the actual (unmanaged) struct-data.
//         // Thus: js-pseudo-pointer (8-bytes; the lParam Buffer) -> c-pointer (8-bytes, unmanaged) -> struct-data (28-bytes, unmanaged)
//         // However, the lParam buffer does not realize it is/could-be a "pseudo-pointer" -- all it knows is that it's holding some random numbers.
//         // To access the unmanaged struct-data, we have to tell the js-side that the contents of lParam are actually the address explained above.
//         // Then we'll be able to use the Buffer.deref() function to correctly obtain the final struct-data.

//         // To do this, we:
//         // 1) Create a new js-pseudo-pointer (using the modified Buffer class), whose contents/what-it-points-to is marked as of type "pointer to a pointer" (ie. the c-pointer entry above)
//         let lParam2 = Buffer.alloc(8);
//         lParam2["type"] = ref.refType(WINDOWPOS);

//         // 2) Fill the js-pseudo-pointer with the actual address to that c-pointer (just copy this address from the unmarked lParam Buffer)
//         lParam.copy(lParam2);

//         // 3) Dereference our js-pseudo-pointer, retrieving the actual struct-data bytes
//         let actualStructDataBuffer = lParam2["deref"]();

//         // 4) Convert the struct-data bytes into a regular JavaScript object
//         let windowPos = actualStructDataBuffer["deref"]();

//         // 5) Modify the 7th integer (the flags field) in the (unmanaged) struct-data, to include the new SWP_NOZORDER flag
//         if (disableZIndexChanging) {
//             //lParam.flags |= SWP_NOZORDER;
//             let newFlags = windowPos.flags | SWP_NOZORDER;
//             actualStructDataBuffer.writeUInt32LE(newFlags, 6);
//         }
//     });
// }

// // This is the function you actually call from the rest of your program.
// exports.SendElectronWindowToBackAndKeepItThere = function(window) {
//     let handleAsBuffer = window.getNativeWindowHandle();
//     let handleAsNumber = ref.types.int64.get(handleAsBuffer, 0);
//     SendWindowToBack(handleAsNumber);
//     AddHook(window, true);
// }

const ref = require('ref-napi');
const StructType = require('ref-struct-di')(ref);
const { 
  SetWindowPos,
  HWND_BOTTOM,
  SWP_NOACTIVATE,
  SWP_NOSIZE,
  SWP_NOMOVE,
  SWP_NOZORDER,
  SWP_NOSENDCHANGING,
} = require('win-setwindowpos');

const WINDOWPOS = StructType({
  hwnd: ref.types.int32,
  hwndInsertAfter: ref.types.int32,
  x: ref.types.int32,
  y: ref.types.int32,
  cx: ref.types.int32,
  cy: ref.types.int32,
  flags: ref.types.uint32,
});

const WM_WINDOWPOSCHANGING = 0x0046;

const preventZOrderChange = win => {
  win.hookWindowMessage(WM_WINDOWPOSCHANGING, (wParam, lParam)=> {
    const buf = Buffer.alloc(8);
    buf.type = ref.refType(WINDOWPOS);
    lParam.copy(buf);
    
    const actualStructDataBuffer = buf.deref();
    const windowPos = actualStructDataBuffer.deref();
    
    const newFlags = windowPos.flags | SWP_NOZORDER | SWP_NOMOVE | SWP_NOSIZE;
    actualStructDataBuffer.writeUInt32LE(newFlags, 6);
    actualStructDataBuffer.writeUInt32LE(HWND_BOTTOM, 1);
  });
};

module.exports = {
  WINDOWPOS,
  WM_WINDOWPOSCHANGING,
  preventZOrderChange,
};
