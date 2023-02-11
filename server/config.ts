import * as path from "path"
import * as _ from "lodash";

const env = process.env.NODE_ENV || 'development';

const GOOGLE_FONTS_API_KEY = process.env.GOOGLE_FONTS_API_KEY;

if (!_.isString(GOOGLE_FONTS_API_KEY) || _.isEmpty(GOOGLE_FONTS_API_KEY)) {
  console.error('Error: ENV var "GOOGLE_FONTS_API_KEY" must be set!');
  console.error('See https://developers.google.com/fonts/docs/developer_api')
  process.exit(1);
}

export interface IUserAgents {
  eot: string;
  woff: string;
  woff2: string;
  svg: string;
  ttf: string;
}

export const config = {
  ENV: env,

  // Root path of server
  ROOT: path.normalize(__dirname + '/..'),

  // Server port
  PORT: process.env.PORT
    ? _.parseInt(process.env.PORT)
    : (env === "production"
      ? 8080
      : 9000),

  IP: process.env.IP
    || undefined,

  // Server port
  TIMEOUT_MS: process.env.TIMEOUT_MS
    ? _.parseInt(process.env.TIMEOUT_MS)
    : 60 * 1000, // 60 seconds

  // Middlewares
  ENABLE_MIDDLEWARE_ACCESS_LOG: process.env.ENABLE_MIDDLEWARE_ACCESS_LOG === 'true'
    ? true
    : false, // default false

  ENABLE_MIDDLEWARE_COMPRESSION: process.env.ENABLE_MIDDLEWARE_COMPRESSION === 'false'
    ? false
    : true, // default true

  GOOGLE_FONTS_API_KEY,

  GOOGLE_FONTS_USE_TEST_JSON: process.env.GOOGLE_FONTS_USE_TEST_JSON === 'true'
    ? true
    : (env === "test"
      ? true
      : false), // enabled in test, else default false

  CACHE_DIR: process.env.CACHE_DIR
    || `${path.normalize(__dirname + '/logic')}/cachedFonts/`,

  USER_AGENTS: <IUserAgents>{
    // see http://www.dvdprojekt.de/category.php?name=Safari for a list of sample user handlers
    // test generation through running grunt mochaTest:src
    eot: process.env.USER_AGENT_EOT
      || 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)',
    woff: process.env.USER_AGENT_WOFF
      || 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0',
    // must serve complete woff2 file for one variant (no unicode range support yet!)
    // see http://www.useragentstring.com/pages/Firefox/
    // see http://caniuse.com/#search=woff2
    // see http://caniuse.com/#feat=font-unicode-range
    // see https://developers.googleblog.com/2015/02/smaller-fonts-with-woff-20-and-unicode.html
    woff2: process.env.USER_AGENT_WOFF2
      || 'Mozilla/5.0 (Windows NT 6.3; rv:39.0) Gecko/20100101 Firefox/39.0',
    svg: process.env.USER_AGENT_SVG
      || 'Mozilla/4.0 (iPad; CPU OS 4_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/4.1 Mobile/9A405 Safari/7534.48.3',
    ttf: process.env.USER_AGENT_TTF
      || 'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) Safari/538.1 Daum/4.1'
  },
};