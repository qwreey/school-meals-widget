
![미리보기](docs/header.png)  

# 학교 급식 정보 위젯

**node js 설치 필수**  

config.json 파일을 만듭니다, 그 안에  
```jsonc
{
    "winSize": [332,332], // 창 크기를 결정합니다

    "API_KEY": "18f22c3b2d904b38bc1417879066513d",
      // 나이스에서 발급받은 API 키입니다
      // https://open.neis.go.kr/portal/mainPage.do
      // 여기에서 키를 발급받아 오세요

    "REG_CODE": "R10",
      // 시도교육청 코드입니다
      // https://open.neis.go.kr/portal/data/service/selectServicePage.do?page=1&rows=10&sortColumn=&sortDirection=&infId=OPEN17020190531110010104913&infSeq=1
      // 여기에서 학교를 검색하고 '시도교육청코드' 를 여기에 붇여넣으세요
    "SC_CODE": "0000000",
      // 위에서 검색한 결과에서 '표준학교코드' 를 여기에 붇여넣으세요

    "ignoreRegex": "\\(? ?[0-9]+\\. ?\\)?"
      // 긴 알레르기 정보가 화면을 잘리게 만드는걸
      // 방지하기 위해 지울 문자의 정규표현식입니다
      // 필요에 따라 변경하세요
}
```

이렇게 설정 파일을 만들어 줍니다 (주석은 쓰지 마세요).  

그다음  
```sh
npm update
./build.sh
```
를 입력해 윈도우 exe 파일을 만듭니다. 빌드된 파일은 dist 폴더 안에 있습니다  
이제 학교 컴에 옮겨 win+R shell:startup 열어서 그 안에 넣어놓고 쓰시면 됩니다  
