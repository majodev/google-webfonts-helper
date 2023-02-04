'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /api/fonts', function () {

  it('should respond with JSON array with all fonts', function (done) {
    request(app)
      .get('/api/fonts')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array);
        done();
      });
  });

  it('should respond with font files for arvo', function (done) {
    request(app)
      .get('/api/fonts/arvo')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        // res.body.should.be.instanceof(Array);
        done();
      });
  });

  it('should (concurrently) download istok-web', function (done) {

    var triggered = 0;

    request(app)
      .get('/api/fonts/istok-web?download=zip&subsets=latin&formats=eot,woff,woff2,svg,ttf')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', "application/zip")
      .end(function (err, res) {
        if (err) {
          return done(err);
        }

        triggered += 1;
        if (triggered === 2) {
          done();
        }
      });

    request(app)
      .get('/api/fonts/istok-web?download=zip&subsets=latin&formats=eot,woff,woff2,svg,ttf')
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', "application/zip")
      .end(function (err, res) {
        if (err) {
          return done(err);
        }

        triggered += 1;
        if (triggered === 2) {
          done();
        }
      });

  });

});
