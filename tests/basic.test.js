const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html','utf8');
const js = fs.readFileSync('script.js','utf8');
const episode = fs.readFileSync('episodes.js','utf8');
const css = fs.readFileSync('style.css','utf8');

test('player includes responsive canvas and accessible controls', () => {
  assert.match(html, /<canvas id="stage"/);
  assert.match(html, /id="play"/);
  assert.match(html, /id="next"/);
  assert.match(html, /id="voice"/);
  assert.match(css, /@media\(max-width:560px\)/);
});

test('pilot has recurring original cast and dialogue', () => {
  assert.match(episode, /MARNIE/);
  assert.match(episode, /LEN/);
  assert.match(episode, /THE SYSTEM/);
  assert.match(episode, /lines:/);
  assert.ok((episode.match(/speaker:/g) || []).length >= 8);
});

test('player supports speech synthesis, captions, and canvas drawing', () => {
  assert.match(js, /SpeechSynthesisUtterance/);
  assert.match(js, /captionsOn/);
  assert.match(js, /function draw\(\)/);
  assert.match(js, /requestAnimationFrame/);
});
