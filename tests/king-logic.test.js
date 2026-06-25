const assert = require('node:assert/strict');
const test = require('node:test');

const logic = require('../king-logic');

test('validates email addresses', () => {
  assert.equal(logic.validateEmail('ana@example.com'), true);
  assert.equal(logic.validateEmail('claudio.alcoforado+king@networkingisking.net'), true);
  assert.equal(logic.validateEmail('sem-arroba.com'), false);
  assert.equal(logic.validateEmail('ana@'), false);
});

test('validates Brazilian phone-like numbers by digit count', () => {
  assert.equal(logic.validatePhone('(81) 99999-1234'), true);
  assert.equal(logic.validatePhone('81999991234'), true);
  assert.equal(logic.validatePhone('(81) 9999-1234'), true);
  assert.equal(logic.validatePhone('9999-123'), false);
});

test('formats WhatsApp input while typing', () => {
  assert.equal(logic.formatWhatsapp('8'), '(8');
  assert.equal(logic.formatWhatsapp('8199'), '(81) 99');
  assert.equal(logic.formatWhatsapp('81999991234'), '(81) 99999-1234');
  assert.equal(logic.formatWhatsapp('(81) 99999-1234 extra'), '(81) 99999-1234');
});

test('sums diagnostic answers', () => {
  assert.equal(logic.sumAnswers([1, 2, 3, 4, 5, 5]), 20);
  assert.equal(logic.sumAnswers([0, null, undefined, 4]), 4);
});

test('maps diagnostic scores to K.I.N.G. quadrants at the threshold', () => {
  assert.equal(logic.getQuadrantKey(15, 15), 'sg');
  assert.equal(logic.getQuadrantKey(14, 15), 'ri');
  assert.equal(logic.getQuadrantKey(15, 14), 'ut');
  assert.equal(logic.getQuadrantKey(14, 14), 'is');
});

test('extracts first name with a stable fallback', () => {
  assert.equal(logic.firstName('Claudio Alcoforado'), 'Claudio');
  assert.equal(logic.firstName('  Ana Luisa  '), 'Ana');
  assert.equal(logic.firstName(''), 'usuario');
});
