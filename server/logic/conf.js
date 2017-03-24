module.exports = {
  USER_AGENTS: {
    // see http://www.dvdprojekt.de/category.php?name=Safari for a list of sample user handlers
    // test generation through running grunt mochaTest:src
    eot: 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)',
    woff: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0',
    // must serve complete woff2 file for one variant (no unicode range support yet!)
    // see http://www.useragentstring.com/pages/Firefox/
    // see http://caniuse.com/#search=woff2
    // see http://caniuse.com/#feat=font-unicode-range
    // see https://developers.googleblog.com/2015/02/smaller-fonts-with-woff-20-and-unicode.html
    woff2: 'Mozilla/5.0 (Windows NT 6.3; rv:39.0) Gecko/20100101 Firefox/39.0',
    svg: 'Mozilla/4.0 (iPad; CPU OS 4_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/4.1 Mobile/9A405 Safari/7534.48.3',
    ttf: 'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) Safari/538.1 Daum/4.1'
  },
  GOOGLE_FONTS_API_KEY: 'AIzaSyDY-C-Lt9uyPP5fSTjMCR4bB944SlI4spw',
  CACHE_DIR: __dirname + "/cachedFonts/",
}
