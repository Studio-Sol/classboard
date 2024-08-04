# 2024/08/04

-   Next.js로 구현이 완료되었거나 사용하지 않는 페이지에 대한 라우팅 및 파일 제거

    -   /setting
    -   /teacher
    -   /privacy
    -   /terms
    -   /jobs
    -   user.html
    -   select-school.html
    -   wait.html
    -   find-school.html
    -   pwa구현을 위한 service worker, manifest, icons

-   변경된 플레이스토어 앱 패키지명 적용 (kr.classboard.sol -> kr.classboard.twa)

# 2023/11/16

> Good Bye, Classboard 1.0

-   이 프로젝트의 API, ADMIN 부분을 제외한 모든 코드를 legacy로 전환합니다.
-   이제부터 view, static resource, 기타 routing은 모두 유지보수되지 않으며 Next.js로 다시 작성될 예정입니다.
    -   최종 목표는 API를 제외한 모든 기능을 포팅하는 것입니다.
-   프로젝트 전체의 개발 종료가 아닌, API만을 위한 프로젝트로의 전환입니다.

> R.I.P<br>
> Classboard 1.0<br>
> 2022.03.14 ~ 2023.10.21

# 2023/06/19

-   캘린더 등 style 깨지는 현상 해결 (adsense, GA로드방식 변경)
-   main페이지 jquery 제거

# 2023/06/15

-   모바일 /main 하단 여백 추가
-   공통 /main 캘린더 block 여백 조정
-   공통 /main 설정/선생님 메뉴 오픈 target blank
-   summernote 테마 유저 테마에 동기화
-   공지 선생님 칭호 제거
-   공지 선택형 회신 버그 수정
-   /post 타이틀 변경
