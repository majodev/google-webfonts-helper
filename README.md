# google-webfonts-helper
> A Hazzle-Free Way to Self-Host Google Fonts

This service might be handy if you want to directly download all `.eot`, `.woff`, `.woff2`, `.svg`, `.ttf` files of a Google font (normally your `User-Agent` would determine the best format at Google's CSS API). Furthermore it provides charset customization and CSS snippets, hence getting your fonts ready for local hosting should be *finally* a breeze.

## [Give it a try: google-webfonts-helper hosted on Heroku](https://google-webfonts-helper.herokuapp.com)

![pic running](http://ranf.tl/static/apps/google-webfonts-helper/full_view.png)

### REST API
The API is public, feel free to use it directly.

#### GET `/api/fonts`
Returns a list of all fonts, sorted by popularity. E.g. `curl https://google-webfonts-helper.herokuapp.com/api/fonts`:
```json
[{
  "id": "open-sans",
  "family": "Open Sans",
  "variants": ["300", "300italic", "regular", "italic", "600", "600italic", "700", "700italic", "800", "800italic"],
  "subsets": ["devanagari", "greek", "latin", "cyrillic-ext", "cyrillic", "greek-ext", "vietnamese", "latin-ext"],
  "category": "sans-serif",
  "version": "v10",
  "lastModified": "2014-10-17",
  "popularity": 1,
  "defSubset": "latin",
  "defVariant": "regular"
} [...]
]
```

#### GET `/api/fonts/[id]?subsets=latin,latin-ext`
Returns a font with urls to the actual font files google's servers. `subsets` is optional (will serve the `defSubset` if unspecified).  E.g. `curl https://google-webfonts-helper.herokuapp.com/api/fonts/modern-antiqua?subsets=latin,latin-ext` (the double quotes are important as query parameters may else be stripped!):

```json
{
  "id": "modern-antiqua",
  "family": "Modern Antiqua",
  "variants": [{
    "id": "regular",
    "eot": "https://fonts.gstatic.com/s/modernantiqua/v6/8qX_tr6Xzy4t9fvZDXPkhzThM-TJeMvVB0dIsYy4U7E.eot",
    "fontFamily": "'Modern Antiqua'",
    "fontStyle": "normal",
    "fontWeight": "400",
    "woff": "https://fonts.gstatic.com/s/modernantiqua/v6/8qX_tr6Xzy4t9fvZDXPkh1bbnkJREviNM815YSrb1io.woff",
    "local": ["Modern Antiqua Regular", "ModernAntiqua-Regular"],
    "ttf": "https://fonts.gstatic.com/s/modernantiqua/v6/8qX_tr6Xzy4t9fvZDXPkhxr_S_FdaWWVbb1LgBbjq4o.ttf",
    "svg": "https://fonts.gstatic.com/l/font?kit=8qX_tr6Xzy4t9fvZDXPkh0sAoW0rAsWAgyWthbXBUKs#ModernAntiqua",
    "woff2": "https://fonts.gstatic.com/s/modernantiqua/v6/8qX_tr6Xzy4t9fvZDXPkh08GHjg64nS_BBLu6wRo0k8.woff2"
  }],
  "subsets": ["latin", "latin-ext"],
  "category": "display",
  "version": "v6",
  "lastModified": "2014-08-28",
  "popularity": 522,
  "defSubset": "latin",
  "defVariant": "regular",
  "subsetMap": {
    "latin": true,
    "latin-ext": true
  },
  "storeID": "latin-ext_latin"
}
```

#### GET `/api/fonts/[id]?download=zip&subsets=latin&formats=woff,woff2&variants=regular`

Download a zipped archive with all `.eot`, `.woff`, `.woff2`, `.svg`, `.ttf` files of a specified font. The query parameters `formats` and `variants` are optional (includes everything if no filtering is applied). is E.g. `curl -o fontfiles.zip "https://google-webfonts-helper.herokuapp.com/api/fonts/lato?download=zip&subsets=latin,latin-ext&variants=regular,700&formats=woff"` (the double quotes are important as query parameters may else be stripped!)

### History

This service was originally a prototype I've created to get familiar with Angular and Express. All magic by [generator-angular-fullstack](https://github.com/DaftMonk/generator-angular-fullstack). See [my note here](http://ranf.tl/2014/12/23/self-hosting-google-web-fonts/).

Idea originally by Clemens Lang who created an [awesome bash script](https://neverpanic.de/blog/2014/03/19/downloading-google-web-fonts-for-local-hosting/) to download Google fonts in all formats.

### Contributing

Everything is welcome, **especially tests**! Fork, change and send me a pull request. However, please add a description to your changes, not only code!

**Attention designers:** Searching for a logo and proper styling (I'm more a usability / backends guy).

## License
(c) Mario Ranftl - majodev
[MIT License](http://majodev.mit-license.org/)
