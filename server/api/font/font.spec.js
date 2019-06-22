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
        // res.body.should.be.instanceof(Array);
        done();
      });
  });

  it('should respond with the right content-length header for roboto zip', function(done) {
    request(app)
      .get('/api/fonts/roboto?download=zip')
      .expect(200)
      .expect('Content-Type', 'application/zip')
      //.expect('Content-Length', '100')
      .expect('Content-disposition', 'attachment; filename=roboto-v19-latin.zip')
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('should respond with the right content-length header for roboto zip (greek subset)', function(done) {
    request(app)
      .get('/api/fonts/roboto?download=zip&subsets=greek')
      .expect(200)
      .expect('Content-Type', 'application/zip')
      //.expect('Content-Length', '100')
      .expect('Content-disposition', 'attachment; filename=roboto-v19-greek.zip')
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });

});
