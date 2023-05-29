import { fromBuffer as fileTypeFromBuffer } from "file-type";
import * as JSZip from "jszip";
import * as _ from "lodash";
import * as should from "should";
import * as request from "supertest";
import { app } from "../app";
import { getStats, reinitStore } from "../logic/store";

describe("GET /api/fonts", () => {
  afterEach(() => {
    return reinitStore();
  });

  it("should respond with JSON array with all fonts", async () => {
    const res = await request(app).get("/api/fonts").timeout(10000).expect(200).expect("Content-Type", /json/);
    should(res.body).be.instanceof(Array);
  });
});

describe("GET /api/fonts/:id", () => {
  afterEach(() => {
    return reinitStore();
  });

  it("should respond with font files for arvo", async function () {
    const res = await request(app).get("/api/fonts/arvo").timeout(10000).expect(200).expect("Content-Type", /json/);
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
      });
    }

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(0);
  }).timeout(10000);

  it("should respond with font files for istok-web multi charsets filtered", async () => {
    const res = await request(app)
      .get("/api/fonts/istok-web?subsets=cyrillic,cyrillic-ext,latin")
      .timeout(10000)
      .expect(200)
      .expect("Content-Type", /json/);
    should(res.body).be.instanceof(Object);

    should(res.body).have.property("id", "istok-web");
    should(res.body).have.property("family", "Istok Web");
    should(res.body).have.property("subsets", ["cyrillic", "cyrillic-ext", "latin", "latin-ext"]);
    should(res.body).have.property("category", "sans-serif");
    should(res.body).have.property("version", "v20");
    should(res.body).have.property("lastModified", "2022-09-22");
    should(res.body).have.property("popularity", 2);
    should(res.body).have.property("defSubset", "latin");
    should(res.body).have.property("defVariant", "regular");
    should(res.body).have.property("subsetMap", {
      cyrillic: true,
      "cyrillic-ext": true,
      latin: true,
      "latin-ext": false,
    });
    should(res.body).have.property("storeID", "cyrillic_cyrillic-ext_latin");

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
      });
    }

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(0);
  }).timeout(10000);

  it("should respond with 200 for known font istok-web empty subsets", async function () {
    this.timeout(10000);
    const res = await request(app).get("/api/fonts/istok-web?subsets=").timeout(10000).expect(200).expect("Content-Type", /json/);
    should(res.body).be.instanceof(Object);

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(0);
  }).timeout(10000);

  it("should respond with 404 for unknown font", async () => {
    await request(app)
      .get("/api/fonts/unknown-font")
      .timeout(10000)
      .expect(404)
      .expect("Content-Type", /text\/html/);

    should(getStats().urlMap).eql(0);
    should(getStats().archiveMap).eql(0);
  }).timeout(10000);

  it("should respond with 404 for unknown font and subset", async () => {
    await request(app)
      .get("/api/fonts/unknown-font?subsets=latin")
      .timeout(10000)
      .expect(404)
      .expect("Content-Type", /text\/html/);

    should(getStats().urlMap).eql(0);
    should(getStats().archiveMap).eql(0);
  }).timeout(10000);

  it("should respond with 404 for known font istok-web and unknown subset", async () => {
    await request(app)
      .get("/api/fonts/istok-web?subsets=unknownsubset")
      .timeout(10000)
      .expect(404)
      .expect("Content-Type", /text\/html/);
  }).timeout(10000);
});

describe("GET /api/fonts/:id?download=zip", () => {
  afterEach(() => {
    return reinitStore();
  });

  it("should (concurrently) download istok-web", async function () {
    this.timeout(10000);
    let triggered = 0;

    await Promise.all([
      request(app)
        .get("/api/fonts/istok-web?download=zip&subsets=latin&formats=woff,woff2")
        .timeout(10000)
        .expect(200)
        .expect("Content-Type", "application/zip")
        .then(() => {
          triggered += 1;
        }),
      request(app)
        .get("/api/fonts/istok-web?download=zip&subsets=latin&formats=woff,woff2")
        .timeout(10000)
        .expect(200)
        .expect("Content-Type", "application/zip")
        .then(() => {
          triggered += 1;
        }),
    ]);
    should(triggered).eql(2);

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(1);
  }).timeout(10000);

  it("should (concurrently) download istok-web (subsets and formats mix)", async function () {
    this.timeout(10000);

    let triggered = 0;

    const [res1, res2] = await Promise.all([
      request(app)
        .get("/api/fonts/istok-web?download=zip&subsets=cyrillic-ext,latin,latin-ext&formats=woff,woff2")
        .responseType("blob")
        .timeout(10000)
        .expect(200)
        .expect("Content-Type", "application/zip")
        .then((res) => {
          triggered += 1;
          return res;
        }),
      request(app)
        .get("/api/fonts/istok-web?download=zip&subsets=latin-ext,latin,cyrillic-ext&formats=woff,woff2,eot,ttf,svg")
        .responseType("blob")
        .timeout(10000)
        .expect(200)
        .expect("Content-Type", "application/zip")
        .then((res) => {
          triggered += 1;
          return res;
        }),
    ]);
    should(triggered).eql(2);

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(1);

    const archive1 = await JSZip.loadAsync(<Buffer>res1.body);

    // 8 files in archive1
    should(_.keys(archive1.files).length).eql(8);

    const archive2 = await JSZip.loadAsync(<Buffer>res2.body);

    // 60 files in archive2
    should(_.keys(archive2.files).length).eql(20);
  }).timeout(10000);

  it("should (concurrently) download playfair-display (different but unknown subsets resolve to the same key)", async function () {
    let triggered = 0;

    this.timeout(30000);

    const [res1, res2] = await Promise.all([
      request(app)
        .get(
          "/api/fonts/playfair-display?download=zip&subsets=devanagari,vietnamese,cyrillic-ext,latin,greek-ext,greek,cyrillic,latin-ext,hebrew,korean,oriya"
        )
        .responseType("blob")
        .timeout(30000)
        .expect(200)
        .expect("Content-Type", "application/zip")
        .then((res) => {
          triggered += 1;
          return res;
        }),
      request(app)
        .get("/api/fonts/playfair-display?download=zip&subsets=cyrillic,latin,latin-ext,vietnamese")
        .responseType("blob")
        .timeout(30000)
        .expect(200)
        .expect("Content-Type", "application/zip")
        .then((res) => {
          triggered += 1;
          return res;
        }),
    ]);
    should(triggered).eql(2);

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(1);

    const archive1 = await JSZip.loadAsync(<Buffer>res1.body);

    // 60 files in archive1
    should(_.keys(archive1.files).length).eql(60);

    const archive2 = await JSZip.loadAsync(<Buffer>res2.body);

    // 60 files in archive2
    should(_.keys(archive2.files).length).eql(60);
  }).timeout(10000);

  it("should respond with 200 for download attempt of known font istok-web with unspecified subset", async function () {
    this.timeout(10000);
    const res = await request(app)
      .get("/api/fonts/istok-web?download=zip&formats=woff,woff2")
      .responseType("blob")
      .timeout(10000)
      .expect(200)
      .expect("Content-Type", "application/zip");

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(1);

    const archive = await JSZip.loadAsync(<Buffer>res.body);

    // 4 default variants, 2 formats -> 8 files in archive
    should(_.keys(archive.files).length).eql(8);

    const files = _.map(_.sortBy(_.keys(archive.files)), (key) => {
      const file = archive.files[key];
      return file;
    });

    should(files[0].name).eql("istok-web-v20-latin-700.woff");
    should((await fileTypeFromBuffer(await files[0].async("nodebuffer")))?.mime).eql("font/woff");
    should(files[1].name).eql("istok-web-v20-latin-700.woff2");
    should((await fileTypeFromBuffer(await files[1].async("nodebuffer")))?.mime).eql("font/woff2");
    should(files[2].name).eql("istok-web-v20-latin-700italic.woff");
    should((await fileTypeFromBuffer(await files[2].async("nodebuffer")))?.mime).eql("font/woff");
    should(files[3].name).eql("istok-web-v20-latin-700italic.woff2");
    should((await fileTypeFromBuffer(await files[3].async("nodebuffer")))?.mime).eql("font/woff2");
    should(files[4].name).eql("istok-web-v20-latin-italic.woff");
    should((await fileTypeFromBuffer(await files[4].async("nodebuffer")))?.mime).eql("font/woff");
    should(files[5].name).eql("istok-web-v20-latin-italic.woff2");
    should((await fileTypeFromBuffer(await files[5].async("nodebuffer")))?.mime).eql("font/woff2");
    should(files[6].name).eql("istok-web-v20-latin-regular.woff");
    should((await fileTypeFromBuffer(await files[6].async("nodebuffer")))?.mime).eql("font/woff");
    should(files[7].name).eql("istok-web-v20-latin-regular.woff2");
    should((await fileTypeFromBuffer(await files[7].async("nodebuffer")))?.mime).eql("font/woff2");
  }).timeout(10000);

  it("should respond with 200 for download attempt of known font istok-web with unspecified formats", async () => {
    const res = await request(app)
      .get("/api/fonts/istok-web?download=zip&subsets=latin")
      .responseType("blob")
      .timeout(10000)
      .expect(200)
      .expect("Content-Type", "application/zip");

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(1);

    const archive = await JSZip.loadAsync(<Buffer>res.body);

    // 4 default variants, 5 formats -> 20 files in archive
    should(_.keys(archive.files).length).eql(20);

    const files = _.map(_.sortBy(_.keys(archive.files)), (key) => {
      const file = archive.files[key];
      return file;
    });

    // _.each(files, (file) => console.log(file.name));

    should(files[0].name).eql("istok-web-v20-latin-700.eot");
    should((await fileTypeFromBuffer(await files[0].async("nodebuffer")))?.mime).eql("application/vnd.ms-fontobject");
    should(files[1].name).eql("istok-web-v20-latin-700.svg");
    should((await fileTypeFromBuffer(await files[1].async("nodebuffer")))?.mime).eql("application/xml");
    should(files[2].name).eql("istok-web-v20-latin-700.ttf");
    should((await fileTypeFromBuffer(await files[2].async("nodebuffer")))?.mime).eql("font/ttf");
    should(files[3].name).eql("istok-web-v20-latin-700.woff");
    should((await fileTypeFromBuffer(await files[3].async("nodebuffer")))?.mime).eql("font/woff");
    should(files[4].name).eql("istok-web-v20-latin-700.woff2");
    should((await fileTypeFromBuffer(await files[4].async("nodebuffer")))?.mime).eql("font/woff2");
    should(files[5].name).eql("istok-web-v20-latin-700italic.eot");
    should((await fileTypeFromBuffer(await files[5].async("nodebuffer")))?.mime).eql("application/vnd.ms-fontobject");
    should(files[6].name).eql("istok-web-v20-latin-700italic.svg");
    should((await fileTypeFromBuffer(await files[6].async("nodebuffer")))?.mime).eql("application/xml");
    should(files[7].name).eql("istok-web-v20-latin-700italic.ttf");
    should((await fileTypeFromBuffer(await files[7].async("nodebuffer")))?.mime).eql("font/ttf");
    should(files[8].name).eql("istok-web-v20-latin-700italic.woff");
    should((await fileTypeFromBuffer(await files[8].async("nodebuffer")))?.mime).eql("font/woff");
    should(files[9].name).eql("istok-web-v20-latin-700italic.woff2");
    should((await fileTypeFromBuffer(await files[9].async("nodebuffer")))?.mime).eql("font/woff2");
    should(files[10].name).eql("istok-web-v20-latin-italic.eot");
    should((await fileTypeFromBuffer(await files[10].async("nodebuffer")))?.mime).eql("application/vnd.ms-fontobject");
    should(files[11].name).eql("istok-web-v20-latin-italic.svg");
    should((await fileTypeFromBuffer(await files[11].async("nodebuffer")))?.mime).eql("application/xml");
    should(files[12].name).eql("istok-web-v20-latin-italic.ttf");
    should((await fileTypeFromBuffer(await files[12].async("nodebuffer")))?.mime).eql("font/ttf");
    should(files[13].name).eql("istok-web-v20-latin-italic.woff");
    should((await fileTypeFromBuffer(await files[13].async("nodebuffer")))?.mime).eql("font/woff");
    should(files[14].name).eql("istok-web-v20-latin-italic.woff2");
    should((await fileTypeFromBuffer(await files[14].async("nodebuffer")))?.mime).eql("font/woff2");
    should(files[15].name).eql("istok-web-v20-latin-regular.eot");
    should((await fileTypeFromBuffer(await files[15].async("nodebuffer")))?.mime).eql("application/vnd.ms-fontobject");
    should(files[16].name).eql("istok-web-v20-latin-regular.svg");
    should((await fileTypeFromBuffer(await files[16].async("nodebuffer")))?.mime).eql("application/xml");
    should(files[17].name).eql("istok-web-v20-latin-regular.ttf");
    should((await fileTypeFromBuffer(await files[17].async("nodebuffer")))?.mime).eql("font/ttf");
    should(files[18].name).eql("istok-web-v20-latin-regular.woff");
    should((await fileTypeFromBuffer(await files[18].async("nodebuffer")))?.mime).eql("font/woff");
    should(files[19].name).eql("istok-web-v20-latin-regular.woff2");
    should((await fileTypeFromBuffer(await files[19].async("nodebuffer")))?.mime).eql("font/woff2");
  }).timeout(10000);

  it("should respond with 200 for download attempt of known font istok-web and empty subsets", async () => {
    const res = await request(app)
      .get("/api/fonts/istok-web?download=zip&subsets=")
      .responseType("blob")
      .timeout(10000)
      .expect(200)
      .expect("Content-Type", "application/zip");

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(1);

    const archive = await JSZip.loadAsync(<Buffer>res.body);

    // defaults to latin with 4 default variants, 5 formats -> 20 files in archive
    should(_.keys(archive.files).length).eql(20);

    _.each(_.sortBy(_.keys(archive.files)), (key) => {
      should(key.indexOf("istok-web-v20-latin-")).eql(0);
    });
  }).timeout(10000);

  it("should respond with 200 for download attempt of known font istok-web and a single unknown format sneaked in", async () => {
    const res = await request(app)
      .get("/api/fonts/istok-web?download=zip&formats=woff,woff2,rolf")
      .responseType("blob")
      .timeout(10000)
      .expect(200)
      .expect("Content-Type", "application/zip");

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(1);

    const archive = await JSZip.loadAsync(<Buffer>res.body);

    // defaults to latin with 4 default variants, 2 formats -> 8 files in archive
    should(_.keys(archive.files).length).eql(8);

    _.each(_.sortBy(_.keys(archive.files)), (key) => {
      should(key.indexOf("istok-web-v20-latin-")).eql(0);
    });
  }).timeout(10000);

  it("should respond with 200 for download attempt of known font istok-web with variants", async () => {
    const res = await request(app)
      .get("/api/fonts/istok-web?download=zip&formats=woff,woff2&variants=regular")
      .responseType("blob")
      .timeout(10000)
      .expect(200)
      .expect("Content-Type", "application/zip");

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(1);

    const archive = await JSZip.loadAsync(<Buffer>res.body);

    // defaults to latin with 1 variant, 2 formats -> 2 files in archive
    should(_.keys(archive.files).length).eql(2);

    _.each(_.sortBy(_.keys(archive.files)), (key) => {
      should(_.endsWith(key, ".woff") || _.endsWith(key, ".woff2")).eql(true);
      should(key.indexOf("regular") === -1).eql(false);
    });
  }).timeout(10000);

  it("should respond with 200 for download attempt of known font istok-web with one known, one unknown variant", async () => {
    const res = await request(app)
      .get("/api/fonts/istok-web?download=zip&formats=woff,woff2&variants=regular,unknownvar")
      .responseType("blob")
      .timeout(10000)
      .expect(200)
      .expect("Content-Type", "application/zip");

    should(getStats().urlMap).eql(1);
    should(getStats().archiveMap).eql(1);

    const archive = await JSZip.loadAsync(<Buffer>res.body);

    // defaults to latin with 1 variant, 2 formats -> 2 files in archive
    should(_.keys(archive.files).length).eql(2);

    _.each(_.sortBy(_.keys(archive.files)), (key) => {
      should(_.endsWith(key, ".woff") || _.endsWith(key, ".woff2")).eql(true);
      should(key.indexOf("regular") === -1).eql(false);
    });
  }).timeout(10000);

  it("should respond with 404 for download attempt of known font istok-web with empty variants", async () => {
    await request(app)
      .get("/api/fonts/istok-web?download=zip&formats=woff,woff2&variants=")
      .timeout(10000)
      .expect(404)
      .expect("Content-Type", /text\/html/);
  }).timeout(10000);

  // https://gwfh.mranftl.com/api/fonts/siemreap?download=zip&subsets=latin,latin-ext&formats=eot,woff,woff2,svg,ttf
  it("should respond with 404 for download attempt of unknown font and unknown subset", async () => {
    await request(app)
      .get("/api/fonts/unknown-font?download=zip&subsets=latin&formats=woff,woff2")
      .timeout(10000)
      .expect(404)
      .expect("Content-Type", /text\/html/);
  }).timeout(10000);

  it("should respond with 404 for download attempt of known font istok-web and unknown subset", async () => {
    await request(app)
      .get("/api/fonts/istok-web?download=zip&subsets=unknown&formats=woff,woff2")
      .timeout(10000)
      .expect(404)
      .expect("Content-Type", /text\/html/);
  }).timeout(10000);

  it("should respond with 404 for download attempt of known font istok-web and unknown format", async () => {
    await request(app)
      .get("/api/fonts/istok-web?download=zip&formats=rolf")
      .timeout(10000)
      .expect(404)
      .expect("Content-Type", /text\/html/);
  }).timeout(10000);

  it("should respond with 404 for download attempt of known font istok-web and empty formats", async () => {
    await request(app)
      .get("/api/fonts/istok-web?download=zip&formats=")
      .timeout(10000)
      .expect(404)
      .expect("Content-Type", /text\/html/);
  }).timeout(10000);
});
