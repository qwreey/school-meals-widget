const electron = require("electron")
// 설정 가져오기
const config = await electron.ipcRenderer.invoke("getConfig")
const packageInfo = await electron.ipcRenderer.invoke("getPackageInfo")

const API_KEY = config.API_KEY || "a2929ada2e4143a5a7dfdde5a98cc616"
const REG_CODE = config.REG_CODE
const SC_CODE = config.SC_CODE
const SC_NAME = config.SC_NAME
const scale = config.scale || 1
const winSize = config.winSize
const disableDinner = config.disableDinner
let ignoreRegex,ignoreRegexErr
try { ignoreRegex = new RegExp(config.ignoreRegex,'g') }
catch (err) { ignoreRegexErr = err }

// url 에서 데이터 fetch 하기
async function fetchAsync (url) {
	let response = await fetch(url)
	// let text = await response.text(); console.log(text)
	let data = await response.json()
	return data
}

// API 를 통해서 급식 정보 가져오기
async function getMeal(date,mealId) {
	return await fetchAsync(`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&KEY=${API_KEY}&ATPT_OFCDC_SC_CODE=${REG_CODE}&SD_SCHUL_CODE=${SC_CODE}&MMEAL_SC_CODE=${mealId}&MLSV_YMD=${date}`);
}

// API 를 통해서 학교 검색하기
async function getSchool(schoolName) {
	return await fetchAsync(encodeURI(`https://open.neis.go.kr/hub/schoolInfo?Type=json&KEY=${API_KEY}&SCHUL_NM=${schoolName}`))
}

// 종료 버튼
let closeButton = document.getElementById("close_button")
closeButton.onclick = ()=>window.close()
closeButton.classList.add("hidden")

// 리로드 버튼
let reloadButton = document.getElementById("reload_button")
reloadButton.onclick = ()=>location.reload()
reloadButton.classList.add("hidden")

// 오류 보여주기
function showErr(msg) {
	console.error(msg)
	let error = document.getElementById("error")
	let holder = document.getElementById("holder")
	error.innerHTML = `
		<p>${msg}</p>
	`

	error.classList.remove("hidden")
	holder.classList.add("hidden")
	reloadButton.classList.remove("hidden")
	closeButton.classList.remove("hidden")
}

// 화면 업데이트하기
async function display(id,date,mealCode) {
	let data = await getMeal(date,mealCode)

	data &&= data.mealServiceDietInfo
	data &&= data[1]
	data &&= data.row
	data &&= data[0]

	let display = document.getElementById(id)
	if (!data) {
		display.getElementsByClassName("menu")[0].innerHTML = "급식 정보가<br>없습니다."
		return [false,"오늘의 급식 정보를<br>확인할 수 없습니다"]
	}


	let menu = data.DDISH_NM
	display.getElementsByClassName("menu")[0].innerHTML = menu.replace(ignoreRegex,"")

	return ["ok"]
}

// 날짜 가져오기
function getDateYYYYMMDD() {
	let now = new Date()
	let month = (now.getMonth() + 1).toString()
	let day = now.getDate().toString()
	return `${now.getFullYear().toString()}${month.length == 1 ? "0" : ""}${month}${day.length == 1 ? "0" : ""}${day}`
}

// 업데이트
async function update() {
	if (ignoreRegexErr) {
		showErr(`잘못된 무시 Regex 가 설정되었습니다.<br>위젯 편집에서 변경해주세요<br>${ignoreRegexErr.toString().replace(/\n/,"<br>")}`)
		return
	}
	if (!SC_CODE) {
		showErr("등록된 학교가 없습니다<br>위젯 편집을 눌러 추가하세요")
		return
	}

	let date = getDateYYYYMMDD()

	try {
		let [successLunch,errLunch] = await display("display_lunch",date,2)
		if (!successLunch) {
			showErr(errLunch)
			return
		}

		if (!disableDinner) {
			await display("display_dinner",date,3)
		}
	} catch (err) {
		showErr(`오류가 발생했습니다\n${err}`)
	}
}
update()

// 저녁 끄기
if (disableDinner) {
	document.getElementById("display_dinner").classList.add("hidden")
}

// 이미지 복사 막기
{
	Array.from(document.getElementsByTagName("img")).forEach(item=>{
		item.draggable = false
	})
}

// 스캐일 지정
let cropedScale = Math.max(Math.min(scale,4),0.5)
let root = document.getElementById("root")
root.style.fontSize = `${cropedScale}em`
root.classList.add(config.textColor || "outline") // 색깔지정

// 크기조절 요청하기
let lastRootSizeY = root.clientHeight,
	lastRootSizeX = root.clientWidth,
	updateWindowSizeTimeout
function updateWindowSize() {
	updateWindowSizeTimeout = null
	if (configPanelVisible) return
	lastRootSizeY = root.clientHeight
	lastRootSizeX = root.clientWidth
	window.resizeTo(Math.ceil(lastRootSizeX),Math.ceil(lastRootSizeY))
}
function onRootSizeChanged() {
	if (updateWindowSizeTimeout) return
	updateWindowSizeTimeout = setTimeout(updateWindowSize,100)
}
new ResizeObserver(onRootSizeChanged).observe(root)
onRootSizeChanged()

// 설정 열기닫기
let configPanel = document.getElementById("config_panel")
let configButton = document.getElementById("config_button")
let configPanelVisible
async function openConfigPanel() {
	configPanelVisible = true
	await electron.ipcRenderer.invoke("setmostBottomWindowEnabled",false)
	await electron.ipcRenderer.invoke("takeFocus")
	root.classList.add("hidden")
	configPanel.classList.remove("hidden")
	window.resizeTo(configPanel.clientWidth,configPanel.clientHeight)

	// 스캐일
	let config_scale = document.getElementById("config_scale")
	config_scale.value = cropedScale

	// 텍스트 컬러
	let config_textcolor_outline = document.getElementById("config_textcolor_outline")
	let config_textcolor_white = document.getElementById("config_textcolor_white")
	let config_textcolor_black = document.getElementById("config_textcolor_black")
	switch (config.textColor) {
		case "white":
		config_textcolor_white.checked = true
		break
		case "black":
		config_textcolor_black.checked = true
		break
		default:
		config_textcolor_outline.checked = true
		break
	}

	// 학교 이름
	let config_school_text = document.getElementById("config_school_text")
	config_school_text.innerText = SC_NAME || "없음"

	// 저녁 비활성화 유무
	let config_disable_dinner = document.getElementById("config_disable_dinner")
	config_disable_dinner.checked  = disableDinner

	// 무시 regex
	let config_ignore_regex = document.getElementById("config_ignore_regex")
	config_ignore_regex.value = config.ignoreRegex

	// 버전 텍스트
	let config_version_text = document.getElementById("config_version_text")
	config_version_text.innerHTML = packageInfo.version

	// 학교 검색창
	let config_school_search = document.getElementById("config_school_search")
	let config_school_search_input = document.getElementById("config_school_search_input")
	let school_search_item_template = document.getElementById("school_search_item_template")
	let searchTimeout
	let new_REG_CODE,new_SC_CODE,new_SC_NAME
	config_school_search_input.onkeyup=async()=>{
		if(window.event.keyCode==13){
			if (searchTimeout) return
			searchTimeout = true
			let text = config_school_search_input.value
			if (text == "") return
			let schoolInfos = await getSchool(text)
			searchTimeout = setTimeout(()=>{
				searchTimeout = null
			},1000)
			// 이미 있던 검색 결과 지우기
			config_school_search.childNodes.forEach((child)=>{
				if (child.id != "config_school_search_input") config_school_search.removeChild(child)
			})
			console.log(schoolInfos)

			if (schoolInfos.RESULT) {
				let node = school_search_item_template.content.firstElementChild.cloneNode(true)
				node.querySelector(".school_search_item_text").textContent = "검색 결과가 없습니다"
				config_school_search.appendChild(node)
				return
			}
			schoolInfos.schoolInfo[1].row.forEach((school)=>{
				let node = school_search_item_template.content.firstElementChild.cloneNode(true)
				node.onclick = ()=>{
					new_REG_CODE = school.ATPT_OFCDC_SC_CODE
					new_SC_CODE = school.SD_SCHUL_CODE
					new_SC_NAME = school.SCHUL_NM
					config_school_text.innerText = new_SC_NAME
				}
				node.querySelector(".school_search_item_text").textContent = `${school.SCHUL_NM} (${school.ORG_RDNMA})`
				config_school_search.appendChild(node)
			})

		}
	}

	// 버그 리포트 버튼
	let config_report_button = document.getElementById("config_report_button")
	config_report_button.onclick = ()=>electron.shell.openExternal('https://github.com/qwreey75/schoolMealsWidget/issues/new')

	// 소스코드 버튼
	let config_source_code_button = document.getElementById("config_source_code_button")
	config_source_code_button.onclick = ()=>electron.shell.openExternal('https://github.com/qwreey75/schoolMealsWidget')

	// 취소버튼
	let config_cancel_button = document.getElementById("config_cancel_button")
	config_cancel_button.onclick = async ()=>{
		window.resizeTo(Math.ceil(winSize[0]*cropedScale),Math.ceil(winSize[1]*cropedScale))
		await electron.ipcRenderer.invoke("setmostBottomWindowEnabled",true)
		location.reload()
	}

	// 저장버튼
	let config_save_button = document.getElementById("config_save_button")
	config_save_button.onclick = async ()=>{
		config.scale = config_scale.value != "" ? Number(config_scale.value) : 1
		config.disableDinner = config_disable_dinner.checked;
		config.ignoreRegex = config_ignore_regex.value
		config.SC_NAME = new_SC_NAME || config.SC_NAME
		config.SC_CODE = new_SC_CODE || config.SC_CODE
		config.REG_CODE = new_REG_CODE || config.REG_CODE
		if (config_textcolor_white.checked) config.textColor = "white"
		else if (config_textcolor_black.checked) config.textColor = "black"
		else config.textColor = "outline"
		config_textcolor_outline.checked = true
		await electron.ipcRenderer.invoke("setConfig",config)
		await electron.ipcRenderer.invoke("setmostBottomWindowEnabled",true)
		window.resizeTo(Math.ceil(winSize[0]*cropedScale),Math.ceil(winSize[1]*cropedScale))
		location.reload()
	}
}
configButton.onclick = openConfigPanel
