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

test('submits landing lead to Supabase and Formspree with expected payloads', async () => {
  const data = {
    name: 'Claudio Alcoforado',
    email: 'claudio@networkingisking.net',
    whatsapp: '(81) 99999-1234'
  };
  const saved = [];
  const fetchCalls = [];

  const result = await logic.submitLandingLead(data, {
    formspreeId: 'mqevenjw',
    formspreeUrl: 'https://formspree.io/f/mqevenjw',
    saveLead: (payload) => saved.push(payload),
    fetchFn: async (url, options) => {
      fetchCalls.push({ url, options });
      return { ok: true };
    }
  });

  assert.deepEqual(saved[0], {
    name: 'Claudio Alcoforado',
    email: 'claudio@networkingisking.net',
    whatsapp: '(81) 99999-1234',
    source: 'landing'
  });
  assert.equal(fetchCalls[0].url, 'https://formspree.io/f/mqevenjw');
  assert.equal(fetchCalls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(fetchCalls[0].options.body), data);
  assert.deepEqual(result, { ok: true });
});

test('skips Formspree request when the form id is not configured', async () => {
  let fetchCalled = false;

  const result = await logic.submitLandingLead(
    { name: 'Ana', email: 'ana@example.com', whatsapp: '(81) 99999-1234' },
    {
      formspreeId: 'XXXXXXXX',
      formspreeUrl: 'https://formspree.io/f/XXXXXXXX',
      fetchFn: async () => {
        fetchCalled = true;
        return { ok: true };
      }
    }
  );

  assert.equal(fetchCalled, false);
  assert.deepEqual(result, { ok: true });
});

test('builds assessment lead payload for Supabase', () => {
  const payload = logic.buildAssessmentLead(
    {
      name: 'Claudio Alcoforado',
      email: 'claudio@networkingisking.net',
      country: 'Brasil',
      state: '',
      zip: ''
    },
    { key: 'sg', name: 'Estratégico / Generoso' },
    { a: 26, b: 28 },
    { a: [4, 5, 4, 4, 5, 4], b: [5, 5, 4, 5, 4, 5] }
  );

  assert.deepEqual(payload, {
    name: 'Claudio Alcoforado',
    email: 'claudio@networkingisking.net',
    country: 'Brasil',
    state: null,
    zip: null,
    source: 'assessment',
    quadrant_key: 'sg',
    quadrant_name: 'Estratégico / Generoso',
    score_intencionalidade: 26,
    score_postura: 28,
    answers: {
      a: [4, 5, 4, 4, 5, 4],
      b: [5, 5, 4, 5, 4, 5]
    }
  });
});
