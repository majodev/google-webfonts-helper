'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /api/fonts', function() {

  it('should respond with JSON array with all fonts', function(done) {
    request(app)
      .get('/api/fonts')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array);
        done();
      });
  });

  it('should respond with font files for arvo', function(done) {
    request(app)
      .get('/api/fonts/arvo')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        // console.log(res.body);
        // res.body.should.be.instanceof(Array);
        done();
      });
  });

});
