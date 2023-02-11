import * as _ from "lodash";
import * as request from "supertest";
import * as should from 'should';

import { app } from "../app";

describe('GET /api/fonts', () => {

  it('should respond with JSON array with all fonts', async () => {

    const res = await request(app)
      .get('/api/fonts')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', /json/);
    should(res.body).be.instanceof(Array);

  });

});

describe('GET /api/fonts/:id', () => {

  it('should respond with font files for arvo', async function () {

    const res = await request(app)
      .get('/api/fonts/arvo')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', /json/);
    should(res.body).be.instanceof(Object);

    should(res.body).have.property("id", "arvo");
    should(res.body).have.property("family", "Arvo");
    should(res.body).have.property("subsets", ["latin"]);
    should(res.body).have.property("category", "serif");
    should(res.body).have.property("version", "v20");
    should(res.body).have.property("lastModified", "2022-09-22");
    should(res.body).have.property("popularity", 1);
    should(res.body).have.property("defSubset", "latin");
    should(res.body).have.property("defVariant", "regular");
    should(res.body).have.property("subsetMap", { latin: true });
    should(res.body).have.property("storeID", "latin");

    should(res.body.variants).be.instanceof(Array);
    should(res.body.variants).be.lengthOf(4);

    if (res.body.variants.length === 4) {
      should(res.body.variants[0]).have.property("id", "regular");
      should(res.body.variants[0]).have.property("fontFamily", "'Arvo'");
      should(res.body.variants[0]).have.property("fontStyle", "normal");
      should(res.body.variants[0]).have.property("fontWeight", "400");

      should(res.body.variants[1]).have.property("id", "italic");
      should(res.body.variants[1]).have.property("fontFamily", "'Arvo'");
      should(res.body.variants[1]).have.property("fontStyle", "italic");
      should(res.body.variants[1]).have.property("fontWeight", "400");

      should(res.body.variants[2]).have.property("id", "700");
      should(res.body.variants[2]).have.property("fontFamily", "'Arvo'");
      should(res.body.variants[2]).have.property("fontStyle", "normal");
      should(res.body.variants[2]).have.property("fontWeight", "700");

      should(res.body.variants[3]).have.property("id", "700italic");
      should(res.body.variants[3]).have.property("fontFamily", "'Arvo'");
      should(res.body.variants[3]).have.property("fontStyle", "italic");
      should(res.body.variants[3]).have.property("fontWeight", "700");

      _.each(res.body.variants, (variant) => {
        should(variant).have.property("woff").String();
        should(variant).have.property("woff2").String();
        should(variant).have.property("svg").String();
        should(variant).have.property("eot").String();
        should(variant).have.property("ttf").String();

        should(_.get(variant, "woff", {}).length).greaterThan(1);
        should(_.get(variant, "woff2", {}).length).greaterThan(1);
        should(_.get(variant, "svg", {}).length).greaterThan(1);
        should(_.get(variant, "eot", {}).length).greaterThan(1);
        should(_.get(variant, "ttf", {}).length).greaterThan(1);
      })
    }

  });

  it('should respond with font files for istok-web multi charsets filtered', async () => {

    const res = await request(app)
      .get('/api/fonts/istok-web?subsets=cyrillic,cyrillic-ext,latin')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', /json/);
    should(res.body).be.instanceof(Object);

    should(res.body).have.property("id", "istok-web");
    should(res.body).have.property("family", "Istok Web");
    should(res.body).have.property("subsets", ['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext']);
    should(res.body).have.property("category", "sans-serif");
    should(res.body).have.property("version", "v20");
    should(res.body).have.property("lastModified", "2022-09-22");
    should(res.body).have.property("popularity", 2);
    should(res.body).have.property("defSubset", "latin");
    should(res.body).have.property("defVariant", "regular");
    should(res.body).have.property("subsetMap", {
      cyrillic: true,
      'cyrillic-ext': true,
      latin: true,
      'latin-ext': false
    });
    should(res.body).have.property("storeID", "latin_cyrillic-ext_cyrillic");

    should(res.body.variants).be.instanceof(Array);
    should(res.body.variants).be.lengthOf(4);

    if (res.body.variants.length === 4) {
      should(res.body.variants[0]).have.property("id", "regular");
      should(res.body.variants[0]).have.property("fontFamily", "'Istok Web'");
      should(res.body.variants[0]).have.property("fontStyle", "normal");
      should(res.body.variants[0]).have.property("fontWeight", "400");

      should(res.body.variants[1]).have.property("id", "italic");
      should(res.body.variants[1]).have.property("fontFamily", "'Istok Web'");
      should(res.body.variants[1]).have.property("fontStyle", "italic");
      should(res.body.variants[1]).have.property("fontWeight", "400");

      should(res.body.variants[2]).have.property("id", "700");
      should(res.body.variants[2]).have.property("fontFamily", "'Istok Web'");
      should(res.body.variants[2]).have.property("fontStyle", "normal");
      should(res.body.variants[2]).have.property("fontWeight", "700");

      should(res.body.variants[3]).have.property("id", "700italic");
      should(res.body.variants[3]).have.property("fontFamily", "'Istok Web'");
      should(res.body.variants[3]).have.property("fontStyle", "italic");
      should(res.body.variants[3]).have.property("fontWeight", "700");

      _.each(res.body.variants, (variant) => {
        should(variant).have.property("woff").String();
        should(variant).have.property("woff2").String();
        should(variant).have.property("svg").String();
        should(variant).have.property("eot").String();
        should(variant).have.property("ttf").String();

        should(_.get(variant, "woff", {}).length).greaterThan(1);
        should(_.get(variant, "woff2", {}).length).greaterThan(1);
        should(_.get(variant, "svg", {}).length).greaterThan(1);
        should(_.get(variant, "eot", {}).length).greaterThan(1);
        should(_.get(variant, "ttf", {}).length).greaterThan(1);
      })
    }

  });

  it('should respond with 200 for known font istok-web empty subsets', async () => {

    const res = await request(app)
      .get('/api/fonts/istok-web?subsets=')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', /json/);
    should(res.body).be.instanceof(Object);

  });

  it('should respond with 404 for unknown font', async () => {

    await request(app)
      .get('/api/fonts/unknown-font')
      .timeout(10000)
      .expect(404)
      .expect('Content-Type', /text\/html/);

  });

  it('should respond with 404 for unknown font and subset', async () => {

    await request(app)
      .get('/api/fonts/unknown-font?subsets=latin')
      .timeout(10000)
      .expect(404)
      .expect('Content-Type', /text\/html/);

  });

  it('should respond with 404 for known font istok-web and unknown subset', async () => {

    await request(app)
      .get('/api/fonts/istok-web?subsets=unknownsubset')
      .timeout(10000)
      .expect(404)
      .expect('Content-Type', /text\/html/);

  });

});

describe('GET /api/fonts/:id?download=zip', () => {

  it('should (concurrently) download istok-web', async () => {

    let triggered = 0;

    await Promise.all([
      request(app)
        .get('/api/fonts/istok-web?download=zip&subsets=latin&formats=woff,woff2')
        .timeout(10000)
        .expect(200)
        .expect('Content-Type', "application/zip")
        .then(() => {
          triggered += 1;
        }),
      request(app)
        .get('/api/fonts/istok-web?download=zip&subsets=latin&formats=woff,woff2')
        .timeout(10000)
        .expect(200)
        .expect('Content-Type', "application/zip")
        .then(() => {
          triggered += 1;
        })
    ]);
    should(triggered).eql(2);

  });

  it('should (concurrently) download istok-web (subsets and formats mix)', async () => {

    let triggered = 0;

    await Promise.all([
      request(app)
        .get('/api/fonts/istok-web?download=zip&subsets=cyrillic-ext,latin,latin-ext&formats=woff,woff2')
        .timeout(10000)
        .expect(200)
        .expect('Content-Type', "application/zip")
        .then(() => {
          triggered += 1;
        }),
      request(app)
        .get('/api/fonts/istok-web?download=zip&subsets=latin-ext,latin,cyrillic-ext&formats=woff,woff2,eot,ttf,svg')
        .timeout(10000)
        .expect(200)
        .expect('Content-Type', "application/zip")
        .then(() => {
          triggered += 1;
        })
    ]);
    should(triggered).eql(2);

  });

  it('should respond with 200 for download attempt of known font istok-web with unspecified subset', async () => {

    await request(app)
      .get('/api/fonts/istok-web?download=zip&formats=woff,woff2')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', "application/zip");

  });

  it('should respond with 200 for download attempt of known font istok-web with unspecified formats', async () => {

    await request(app)
      .get('/api/fonts/istok-web?download=zip&subsets=latin')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', "application/zip");

  });

  it('should respond with 200 for download attempt of known font istok-web and empty subsets', async () => {

    await request(app)
      .get('/api/fonts/istok-web?download=zip&subsets=')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', "application/zip");

  });

  it('should respond with 200 for download attempt of known font istok-web and a single unknown format sneaked in', async () => {

    await request(app)
      .get('/api/fonts/istok-web?download=zip&formats=woff,woff2,rolf')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', "application/zip");

  });

  it('should respond with 200 for download attempt of known font istok-web with variants', async () => {

    await request(app)
      .get('/api/fonts/istok-web?download=zip&formats=woff,woff2&variants=regular')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', "application/zip");

  });

  it('should respond with 200 for download attempt of known font istok-web with one known, one unknown variant', async () => {

    await request(app)
      .get('/api/fonts/istok-web?download=zip&formats=woff,woff2&variants=regular,unknownvar')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', "application/zip");

  });

  it('should respond with 404 for download attempt of known font istok-web with empty variants', async () => {

    await request(app)
      .get('/api/fonts/istok-web?download=zip&formats=woff,woff2&variants=')
      .timeout(10000)
      .expect(404)
      .expect('Content-Type', /text\/html/);

  });

  // https://gwfh.mranftl.com/api/fonts/siemreap?download=zip&subsets=latin,latin-ext&formats=eot,woff,woff2,svg,ttf
  it('should respond with 404 for download attempt of unknown font and unknown subset', async () => {

    await request(app)
      .get('/api/fonts/unknown-font?download=zip&subsets=latin&formats=woff,woff2')
      .timeout(10000)
      .expect(404)
      .expect('Content-Type', /text\/html/);

  });

  it('should respond with 404 for download attempt of known font istok-web and unknown subset', async () => {

    await request(app)
      .get('/api/fonts/istok-web?download=zip&subsets=unknown&formats=woff,woff2')
      .timeout(10000)
      .expect(404)
      .expect('Content-Type', /text\/html/);

  });

  it('should respond with 404 for download attempt of known font istok-web and unknown format', async () => {

    await request(app)
      .get('/api/fonts/istok-web?download=zip&formats=rolf')
      .timeout(10000)
      .expect(404)
      .expect('Content-Type', /text\/html/);

  });

  it('should respond with 404 for download attempt of known font istok-web and empty formats', async () => {

    await request(app)
      .get('/api/fonts/istok-web?download=zip&formats=')
      .timeout(10000)
      .expect(404)
      .expect('Content-Type', /text\/html/);

  });

});
