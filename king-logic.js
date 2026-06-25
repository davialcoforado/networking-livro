(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KingLogic = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var THRESHOLD = 15;

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
  }

  function normalizeDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function validatePhone(phone) {
    return normalizeDigits(phone).length >= 10;
  }

  function formatWhatsapp(value) {
    var v = normalizeDigits(value).slice(0, 11);
    var out = '';
    if (v.length >= 1) out = '(' + v.slice(0, 2);
    if (v.length >= 8) {
      out += ') ' + v.slice(2, 7) + '-' + v.slice(7, 11);
    } else if (v.length >= 3) {
      out += ') ' + v.slice(2, 7);
    }
    return out;
  }

  function sumAnswers(answers) {
    return answers.reduce(function (sum, value) {
      return sum + Number(value || 0);
    }, 0);
  }

  function getQuadrantKey(a, b) {
    if (a >= THRESHOLD && b >= THRESHOLD) return 'sg';
    if (a < THRESHOLD && b >= THRESHOLD) return 'ri';
    if (a >= THRESHOLD && b < THRESHOLD) return 'ut';
    return 'is';
  }

  function firstName(name) {
    return String(name || 'usuario').trim().split(/\s+/)[0] || 'usuario';
  }

  return {
    THRESHOLD: THRESHOLD,
    validateEmail: validateEmail,
    validatePhone: validatePhone,
    formatWhatsapp: formatWhatsapp,
    sumAnswers: sumAnswers,
    getQuadrantKey: getQuadrantKey,
    firstName: firstName
  };
});
