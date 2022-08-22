require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"topics":[function(require,module,exports){
/**
 * @module - topic
 * @description - Topics
 * author: titus
 * date: 24/06/15
 * time: 5:17 PM
 */

/**
 * @module exports
 * @type {Topics}
 */
module.exports = Topics;

/**
 * @description pub/sub jQuery topics
 * @returns {Topics}
 * @constructor
 */
function Topics(){
  "use strict";
  if(!(this instanceof Topics)){
    return new Topics();
  }
  return this;
}

/**
 * @description shared list of topics
 * @type {{}}
 * @private
 */
Topics.prototype.__topics__ = {};

/**
 * @description jquery  topic (subscribe / publish)
 * @param id
 * @returns {*}
 */
Topics.prototype.topic = function (id) {
  var callbacks;
  var topic = id && this.__topics__[id];

  if (!topic && id) {
    callbacks = jQuery.Callbacks();
    topic = {
      publish    : callbacks.fire,
      subscribe  : callbacks.add,
      unsubscribe: callbacks.remove
    };
    this.__topics__[id] = topic;
  }
  return topic;
};

},{}]},{},[])

