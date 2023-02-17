import * as should from 'should';
import * as _ from "lodash";
import { getSubsets } from "./subsetGen";

describe('logic/getSubsets', function () {

  it('handles 10 items = 2^10-1', () => {
    const subsets = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const subsetStore = getSubsets(subsets);

    should(subsetStore).be.instanceof(Object);
    should(_.keys(subsetStore).length).equal(1023);
  });

  it('does not hang', () => {

    should(getSubsets([])).be.instanceof(Object).have.keys();
    should(getSubsets(undefined as any)).be.instanceof(Object).have.keys();
    should(getSubsets(null as any)).be.instanceof(Object).have.keys();
    should(getSubsets("asf" as any)).be.instanceof(Object).have.keys();

  });

  it('corrects input duplicates silently', () => {

    should(_.keys(getSubsets(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'a', 'j'])).length)
      .equal(511); // double "a" = 2^9-1 combos

  });

  it('storeID looks as indented', () => {

    const subsets = ['a', 'b', 'c', 'd', 'e'];
    const subsetStore = getSubsets(subsets);

    const fontSubsetKey = <string>_.findKey(subsetStore, {
      a: true,
      b: false,
      c: true,
      d: false,
      e: false
    });

    should(fontSubsetKey.length).equal(3);
    should(fontSubsetKey[1]).equal('_'); // delimiter
    should(fontSubsetKey[0]).not.be.equal(fontSubsetKey[2]); // a or c
  });

  it("storeIDs look and stable order as indented for ['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext']", () => {

    const expected = [
      'cyrillic',
      'cyrillic-ext',
      'cyrillic-ext_cyrillic',
      'latin',
      'latin_cyrillic',
      'latin_cyrillic-ext',
      'latin_cyrillic-ext_cyrillic',
      'latin-ext',
      'latin-ext_cyrillic',
      'latin-ext_cyrillic-ext',
      'latin-ext_cyrillic-ext_cyrillic',
      'latin-ext_latin',
      'latin-ext_latin_cyrillic',
      'latin-ext_latin_cyrillic-ext',
      'latin-ext_latin_cyrillic-ext_cyrillic'
    ];

    const subsets = ['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext'];

    const subsetStore = getSubsets(subsets);
    should(_.keys(subsetStore)).deepEqual(expected);

    const subsetStoreRev = getSubsets(subsets.reverse());
    should(_.keys(subsetStoreRev)).deepEqual(expected);

    const subsetStoreShuffled = getSubsets(_.shuffle(subsets));
    should(_.keys(subsetStoreShuffled)).deepEqual(expected);
  });

  it('subsetMap filtering works as indented', () => {

    const subsets = ['a', 'b', 'c'];
    const subsetStore = getSubsets(subsets);

    should(subsetStore).be.instanceof(Object);

    should(_.keys(subsetStore).length).equal(7);

    should(_.filter(_.values(subsetStore), {
      a: true
    }).length).equal(4);

    should(_.filter(_.values(subsetStore), {
      a: true,
      b: true
    }).length).equal(2);

    should(_.filter(_.values(subsetStore), {
      a: true,
      b: false,
      c: true
    }).length).equal(1);

    should(_.filter(_.values(subsetStore), {
      a: true,
      b: true,
      c: true
    }).length).equal(1);
  });
});