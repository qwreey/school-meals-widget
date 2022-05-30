const API_KEY = config.API_KEY
const REG_CODE = config.REG_CODE
const SC_CODE = config.SC_CODE
const ignoreRegex = new RegExp(config.ignoreRegex,'g')

async function fetchAsync (url) {
    let response = await fetch(url)
    // let text = await response.text(); console.log(text)
    let data = await response.json()
    return data
}

async function getMeal(date,mealId) {
    return await fetchAsync(`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&KEY=${API_KEY}&ATPT_OFCDC_SC_CODE=${REG_CODE}&SD_SCHUL_CODE=${SC_CODE}&MMEAL_SC_CODE=${mealId}&MLSV_YMD=${date}`);
}

function showErr(msg) {
    console.error(msg)
    let error = document.getElementById("error")
    let holder = document.getElementById("holder")

    error.innerHTML = `
        <p>${msg}</p>
    `

    error.classList.remove("hidden")
    holder.classList.add("hidden")
}

async function display(id,date,mealCode) {
    let data = await getMeal(date,mealCode)

    data &&= data.mealServiceDietInfo
    data &&= data[1]
    data &&= data.row
    data &&= data[0]

    if (!data) {
        return [false,"오늘의 급식 정보를 확인할 수 없습니다"]
    }

    let display = document.getElementById(id)

    let menu = data.DDISH_NM
    display.getElementsByClassName("menu")[0].innerHTML = menu.replace(ignoreRegex,"")

    return ["ok"]
}

// alt+F4 로 꺼지는거 막음
window.addEventListener('keydown', (e) => {
    const { key, altKey } = e;
    if (key === 'F4' && altKey) {
        e.preventDefault();   
    }
});

async function main() {
    let now = new Date()
    let month = (now.getMonth() + 1).toString()
    month = (month.length == 1 ? "0" : "") + month
    let day = now.getDate().toString();
    day = (day.length == 1 ? "0" : "") + day
    let date = now.getFullYear().toString() + month + day

    let [successLunch,errLunch] = await display("display_lunch",date,2)
    if (!successLunch) {
        showErr(errLunch)
        return
    }

    let [successDinner,errDinner] = await display("display_dinner",date,3)
    if (!successDinner) {
        showErr(errDinner)
        return
    }
}
main()
