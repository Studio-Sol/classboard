module.exports = {
    secretKey : 'ebixs08iehbngfvkol', // 원하는 시크릿 ㅍ키
    option : {
        algorithm : "HS256", // 해싱 알고리즘
        expiresIn : "1h",  // 토큰 유효 기간
        issuer : "sol-studio" // 발행자
    }
}