import * as _ from "lodash";
import * as request from "supertest";
import * as should from 'should';

import { app } from "../app";

describe('GET /api/fonts', function () {

  it('should respond with JSON array with all fonts', async () => {

    const res = await request(app)
      .get('/api/fonts')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', /json/);
    should(res.body).be.instanceof(Array);

  });

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

  it('should respond with 404 for unknown font', async () => {

    const res = await request(app)
      .get('/api/fonts/this-font-will-never-exist')
      .timeout(10000)
      .expect(404)
      .expect('Content-Type', /text\/html/);
    should(res.body).be.instanceof(Object);

  });

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

});
