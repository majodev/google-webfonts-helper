'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /-/healthy', function () {

  it('should respond with 200', function (done) {
    request(app)
      .get('/-/healthy')
      .timeout(2000)
      .expect(200)
      .expect('Content-Type', /text\/plain/)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

});


describe('GET /api/not_defined', function () {

  it('should respond with 404', function (done) {
    request(app)
      .get('/api/not_defined')
      .timeout(2000)
      .expect(404)
      .expect('Content-Type', /text\/html/)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

});