# google-webfonts-helper
Ever wanted to know where Google hosts their webfonts? This service might be handy if you want to download all `.eot`, `.woff`, `.woff2`, `.svg`, `.ttf` files of a font variant directly from google (normally your `User-Agent` would determine the best format).

## [google-webfonts-helper hosted on Heroku](https://google-webfonts-helper.herokuapp.com)


### REST API
The API is public, feel free to use it directly.

#### GET `/api/fonts`
Returns a list of all fonts. E.g. `curl https://google-webfonts-helper.herokuapp.com/api/fonts`:
```json
[{
  "id": "abeezee",
  "family": "ABeeZee",
  "variants": ["regular", "italic"],
  "subsets": ["latin"],
  "category": "sans-serif",
  "version": "v4",
  "lastModified": "2014-08-28"
} ...
]
```

#### GET `/api/fonts/[id]`
Returns a font with urls to the actual font files google's servers. E.g. `curl https://google-webfonts-helper.herokuapp.com/api/fonts/antic`:

```json
{
  "id": "antic",
  "family": "Antic",
  "variants": [{
    "id": "regular",
    "woff2": [{
      "url": "https://fonts.gstatic.com/s/antic/v7/XHDNSBKb2dlIyyA7tXPbSA.woff2",
      "unicodeRange": "U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215, U+E0FF, U+EFFD, U+F000",
      "subset": "latin"
    }],
    "fontFamily": "'Antic'",
    "fontStyle": "normal",
    "fontWeight": "400",
    "local": ["Antic", "Antic-Regular"],
    "eot": "https://fonts.gstatic.com/s/antic/v7/jrYPXvXYC1H4Vn_CQx7BJQ.eot",
    "ttf": "https://fonts.gstatic.com/s/antic/v7/oPxV1dkj-zBXVn8gGPEP7w.ttf",
    "svg": "https://fonts.gstatic.com/l/font?kit=auEONVTS9YXogC-LoZ073Q#Antic",
    "woff": "https://fonts.gstatic.com/s/antic/v7/2GNslY5EMAZwbbytmM9wFw.woff"
  }],
  "subsets": ["latin"],
  "category": "sans-serif",
  "version": "v7",
  "lastModified": "2014-08-28"
}
```

#### GET `/api/fonts/[id]?download=zip`

Download a zipped archive with all `.eot`, `.woff`, `.woff2`, `.svg`, `.ttf` files of a specified font. E.g. `curl -o fontfiles.zip https://google-webfonts-helper.herokuapp.com/api/fonts/lato?download=zip`

### History

This was originally a prototype, that I've started to get familiar with Angular and Express. All magic by [generator-angular-fullstack](https://github.com/DaftMonk/generator-angular-fullstack). See [my note here](http://ranf.tl/2014/12/23/self-hosting-google-web-fonts/). That's all folks.

## License
(c) Mario Ranftl - majodev
[MIT License](http://majodev.mit-license.org/)