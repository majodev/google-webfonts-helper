import * as should from 'should';
import * as _ from "lodash";
import { getSubsets } from "./subsetGen";

describe('logic/getSubsets', function () {

  it('handles 10 items = 2^10-1', () => {
    var subsets = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    var subsetStore = getSubsets(subsets);

    should(subsetStore).be.instanceof(Object);
    should(_.keys(subsetStore).length).equal(1023);
  });

  it('does not hang', () => {

    should(getSubsets([])).be.instanceof(Object).have.keys();
    should(getSubsets(undefined)).be.instanceof(Object).have.keys();
    should(getSubsets("asf" as any)).be.instanceof(Object).have.keys();

  });

  it('corrects input duplicates silently', () => {

    should(_.keys(getSubsets(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'a', 'j'])).length)
      .equal(511); // double "a" = 2^9-1 combos

  });

  it('storeID looks as indented', () => {

    var subsets = ['a', 'b', 'c', 'd', 'e'];
    var subsetStore = getSubsets(subsets);

    var fontSubsetKey = _.findKey(subsetStore, {
      subsetMap: {
        a: true,
        b: false,
        c: true,
        d: false,
        e: false
      }
    });

    should(fontSubsetKey.length).equal(3);
    should(fontSubsetKey[1]).equal('_'); // delimiter
    should(fontSubsetKey[0]).not.be.equal(fontSubsetKey[2]); // a or c
  });

  it('subsetMap filtering works as indented', () => {

    var subsets = ['a', 'b', 'c'];
    var subsetStore = getSubsets(subsets);

    should(subsetStore).be.instanceof(Object);

    should(_.keys(subsetStore).length).equal(7);

    should(_.filter(_.values(subsetStore), {
      subsetMap: {
        a: true
      }
    }).length).equal(4);

    should(_.filter(_.values(subsetStore), {
      subsetMap: {
        a: true,
        b: true
      }
    }).length).equal(2);

    should(_.filter(_.values(subsetStore), {
      subsetMap: {
        a: true,
        b: false,
        c: true
      }
    }).length).equal(1);

    should(_.filter(_.values(subsetStore), {
      subsetMap: {
        a: true,
        b: true,
        c: true
      }
    }).length).equal(1);
  });
});