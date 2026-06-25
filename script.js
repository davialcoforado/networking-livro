/* ═══════════════════════════════════════════════════════════
   LANDING PAGE — script.js
   As credenciais ficam em config.js (carregado antes deste).
═══════════════════════════════════════════════════════════ */

// Inicializa Supabase assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  if (typeof initSupabase === 'function') initSupabase();
});


/* ═══════════════════════════════════════════════════════════
   SMOOTH SCROLL — botões que apontam para #form
═══════════════════════════════════════════════════════════ */
document.querySelectorAll('.scroll-to-form').forEach(function (btn) {
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    var target = document.getElementById('form');
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Foco no primeiro campo após scroll
    setTimeout(function () {
      var first = target.querySelector('input');
      if (first) first.focus();
    }, 600);
  });
});


/* ═══════════════════════════════════════════════════════════
   MÁSCARA DE TELEFONE — WhatsApp
   Formata enquanto o usuário digita: (11) 99999-9999
═══════════════════════════════════════════════════════════ */
var whatsappInput = document.getElementById('whatsapp');

if (whatsappInput) {
  whatsappInput.addEventListener('input', function () {
    this.value = KingLogic.formatWhatsapp(this.value);
  });
}


/* ═══════════════════════════════════════════════════════════
   VALIDAÇÃO DO FORMULÁRIO
═══════════════════════════════════════════════════════════ */
function validateEmail(email) {
  return KingLogic.validateEmail(email);
}

function validatePhone(phone) {
  return KingLogic.validatePhone(phone);
}

function showError(fieldId, message) {
  var input = document.getElementById(fieldId);
  var error = document.getElementById(fieldId + '-error');
  if (input)  input.classList.add('invalid');
  if (error)  error.textContent = message;
}

function clearError(fieldId) {
  var input = document.getElementById(fieldId);
  var error = document.getElementById(fieldId + '-error');
  if (input)  input.classList.remove('invalid');
  if (error)  error.textContent = '';
}

function validateForm(name, email, whatsapp) {
  var valid = true;

  clearError('name');
  clearError('email');
  clearError('whatsapp');

  if (!name.trim()) {
    showError('name', 'Por favor, informe seu nome.');
    valid = false;
  }

  if (!email.trim()) {
    showError('email', 'Por favor, informe seu e-mail.');
    valid = false;
  } else if (!validateEmail(email)) {
    showError('email', 'E-mail inválido. Verifique e tente novamente.');
    valid = false;
  }

  if (!whatsapp.trim()) {
    showError('whatsapp', 'Por favor, informe seu WhatsApp.');
    valid = false;
  } else if (!validatePhone(whatsapp)) {
    showError('whatsapp', 'Número inválido. Use o formato (11) 99999-9999.');
    valid = false;
  }

  return valid;
}

// Limpa erro ao usuário começar a digitar
['name', 'email', 'whatsapp'].forEach(function (id) {
  var el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', function () { clearError(id); });
  }
});


/* ═══════════════════════════════════════════════════════════
   ENVIO DO FORMULÁRIO
═══════════════════════════════════════════════════════════ */

/**
 * submitToService — envia para Formspree (e-mail) + Supabase (banco).
 * As credenciais ficam em config.js.
 * Se ainda não configuradas, simula o envio para testes locais.
 */
function submitToService(data) {
  return KingLogic.submitLandingLead(data, {
    formspreeId: typeof FORMSPREE_ID !== 'undefined' ? FORMSPREE_ID : null,
    formspreeUrl: typeof FORMSPREE_URL !== 'undefined' ? FORMSPREE_URL : null,
    saveLead: typeof saveLead === 'function' ? saveLead : null,
    fetchFn: typeof fetch === 'function' ? fetch.bind(window) : null
  });
}

function showSuccess() {
  var form    = document.getElementById('lead-form');
  var success = document.getElementById('success-message');
  if (form)    form.hidden    = true;
  if (success) success.hidden = false;
  // Scroll suave para o cartão de sucesso
  if (success) success.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setLoading(isLoading) {
  var btn     = document.getElementById('submit-btn');
  var text    = btn && btn.querySelector('.btn-text');
  var loading = btn && btn.querySelector('.btn-loading');
  if (!btn) return;
  btn.disabled = isLoading;
  if (text)    text.hidden    = isLoading;
  if (loading) loading.hidden = !isLoading;
}

var form = document.getElementById('lead-form');
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name      = document.getElementById('name').value;
    var email     = document.getElementById('email').value;
    var whatsapp  = document.getElementById('whatsapp').value;

    if (!validateForm(name, email, whatsapp)) return;

    setLoading(true);

    submitToService({ name: name, email: email, whatsapp: whatsapp })
      .then(function (result) {
        if (result.ok) {
          showSuccess();
        } else {
          alert('Ocorreu um erro ao enviar. Por favor, tente novamente.');
        }
      })
      .catch(function () {
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
      })
      .finally(function () {
        setLoading(false);
      });
  });
}


/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL — aparição suave de seções
═══════════════════════════════════════════════════════════ */
var revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          // Pequeno delay escalonado para grupos de cards
          setTimeout(function () {
            entry.target.classList.add('visible');
          }, i * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealItems.forEach(function (el) { observer.observe(el); });
} else {
  // Fallback para navegadores sem IntersectionObserver
  revealItems.forEach(function (el) { el.classList.add('visible'); });
}


/* ═══════════════════════════════════════════════════════════
   ANO NO FOOTER
═══════════════════════════════════════════════════════════ */
var yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
