'use strict';

var should = require('should');
var subsetGen = require('./subsetGen');
var _ = require('lodash');

describe('logic/subsetGen', function() {

  it('handles 10 items = 2^10-1', function(done) {
    var subsets = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    var subsetStore = subsetGen(subsets);

    subsetStore.should.be.instanceof(Object);
    _.keys(subsetStore).length.should.equal(1023);

    done();
  });

  it('does not hang', function(done) {

    subsetGen([]).should.be.instanceof(Object).have.keys(); //no keys
    subsetGen(undefined).should.be.instanceof(Object).have.keys(); //no keys
    subsetGen("asf").should.be.instanceof(Object).have.keys(); //no keys

    done();
  });

  it('corrects input duplicates silently', function(done) {

    _.keys(subsetGen(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'a', 'j']))
      .length.should.equal(511); // double "a" = 2^9-1 combos

    done();
  });

  it('storeID looks as indented', function(done) {

    var subsets = ['a', 'b', 'c', 'd', 'e'];
    var subsetStore = subsetGen(subsets);

    var fontSubsetKey = _.findKey(subsetStore, {
      subsetMap: {
        a: true,
        b: false,
        c: true,
        d: false,
        e: false
      }
    });

    fontSubsetKey.length.should.equal(3);
    fontSubsetKey[1].should.equal('_'); // delimiter
    fontSubsetKey[0].should.not.be.equal(fontSubsetKey[2]); // a or c

    done();
  });

  it('subsetMap filtering works as indented', function(done) {

    var subsets = ['a', 'b', 'c'];
    var subsetStore = subsetGen(subsets);

    subsetStore.should.be.instanceof(Object);

    _.keys(subsetStore).length.should.equal(7);

    _.filter(_.values(subsetStore), {
      subsetMap: {
        a: true
      }
    }).length.should.equal(4);

    _.filter(_.values(subsetStore), {
      subsetMap: {
        a: true,
        b: true
      }
    }).length.should.equal(2);

    _.filter(_.values(subsetStore), {
      subsetMap: {
        a: true,
        b: false,
        c: true
      }
    }).length.should.equal(1);

    _.filter(_.values(subsetStore), {
      subsetMap: {
        a: true,
        b: true,
        c: true
      }
    }).length.should.equal(1);
    done();
  });
});