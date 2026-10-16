/*!
 * LaZenith Studio · Analytics (GA4 + Consent Mode v2 + consentimento LGPD/RGPD)
 * Propriedade GA4: "LaZenith Studio - Site" · ID de métrica: G-W3XME308NX
 *
 * Como instalar: salve este arquivo na raiz do repositório e inclua, antes de </body>
 * em TODAS as páginas (index.html e privacidade.html):
 *   <script src="/lz-analytics.js" defer></script>
 * Não adicione outro snippet gtag.js: este arquivo já carrega a tag Google.
 *
 * Utilidades (abra no seu navegador):
 *   ?lz_internal=1  marca ESTE navegador como tráfego interno (fica salvo). ?lz_internal=0 desfaz.
 *   ?lz_debug=1     ativa o DebugView do GA4 nesta aba.
 *   lzConsent.open() reabre o aviso de cookies (use num link "Preferências de cookies").
 */
(function () {
  'use strict';

  var GA_ID = 'G-W3XME308NX';
  var CONSENT_KEY = 'lz_consent_v1';      // 'granted' | 'denied'
  var INTERNAL_KEY = 'lz_internal';
  var DEBUG_KEY = 'lz_debug';
  var PRIVACY_URL = '/privacidade.html';
  // Só estes parâmetros de URL vão para o GA4 (evita vazar dados pessoais na URL).
  var ALLOWED_PARAMS = /^(utm_(source|medium|campaign|term|content|id|source_platform|creative_format|marketing_tactic)|gclid|gbraid|wbraid|fbclid|msclkid)$/i;

  /* ---------- armazenamento seguro ---------- */
  function store(type) {
    try { return window[type]; } catch (e) { return null; }
  }
  function get(type, k) { try { var s = store(type); return s ? s.getItem(k) : null; } catch (e) { return null; } }
  function set(type, k, v) { try { var s = store(type); if (s) s.setItem(k, v); } catch (e) {} }
  function del(type, k) { try { var s = store(type); if (s) s.removeItem(k); } catch (e) {} }

  /* ---------- flags de teste via URL ---------- */
  var params = new URLSearchParams(location.search);
  if (params.get('lz_internal') === '1') set('localStorage', INTERNAL_KEY, '1');
  if (params.get('lz_internal') === '0') del('localStorage', INTERNAL_KEY);
  if (params.get('lz_debug') === '1') set('sessionStorage', DEBUG_KEY, '1');
  if (params.get('lz_debug') === '0') del('sessionStorage', DEBUG_KEY);
  var isInternal = get('localStorage', INTERNAL_KEY) === '1';
  var isDebug = get('sessionStorage', DEBUG_KEY) === '1';

  function cleanUrl(href) {
    try {
      var u = new URL(href || location.href);
      var keep = new URLSearchParams();
      u.searchParams.forEach(function (v, k) { if (ALLOWED_PARAMS.test(k)) keep.append(k, v); });
      var q = keep.toString();
      return u.origin + u.pathname + (q ? '?' + q : '');
    } catch (e) { return location.origin + location.pathname; }
  }

  /* ---------- Consent Mode v2: tudo negado por padrão ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });

  var gaLoaded = false;
  function consentGranted() { return get('localStorage', CONSENT_KEY) === 'granted'; }

  function loadGA() {
    if (gaLoaded) return;
    gaLoaded = true;
    gtag('consent', 'update', { analytics_storage: 'granted' }); // anúncios continuam negados
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    var cfg = {
      page_location: cleanUrl(),
      page_referrer: document.referrer ? cleanUrl(document.referrer) : undefined,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    };
    if (isInternal) cfg.traffic_type = 'internal';
    if (isDebug) cfg.debug_mode = true;
    gtag('config', GA_ID, cfg);
  }

  /* ---------- envio de eventos (só com consentimento) ---------- */
  function track(name, p) {
    if (!consentGranted()) return;
    if (!gaLoaded) loadGA();
    var payload = p || {};
    if (isDebug) payload.debug_mode = true;
    gtag('event', name, payload);
  }
  window.lzTrack = track;

  function sectionOf(el) {
    if (el.closest('.whatsapp-float')) return 'floating_button';
    var s = el.closest('nav, header, footer, section, [id]');
    if (!s) return 'page';
    return s.id || s.tagName.toLowerCase();
  }
  function label(el) {
    return (el.getAttribute('data-track-label') || el.getAttribute('aria-label') || el.innerText || '')
      .replace(/\s+/g, ' ').trim().slice(0, 60) || '(sem texto)';
  }

  /* ---------- cliques: WhatsApp, e-mail, telefone, contato/orçamento, CTAs ---------- */
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a, button, [data-track]');
    if (!a) return;
    var href = (a.getAttribute('href') || '').trim();
    var loc = sectionOf(a);
    var common = { link_location: loc, link_text: label(a) };

    if (/(^https?:\/\/)?(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(href)) {
      return track('whatsapp_click', Object.assign({ contact_method: 'whatsapp' }, common));
    }
    if (/^mailto:/i.test(href)) {
      return track('email_click', Object.assign({ contact_method: 'email' }, common));
    }
    if (/^tel:/i.test(href)) {
      return track('phone_click', Object.assign({ contact_method: 'phone' }, common));
    }
    var trackAttr = a.getAttribute('data-track');
    if (trackAttr === 'quote' || trackAttr === 'contact' || href === '#contact' || /or[cç]amento/i.test(label(a))) {
      return track('contact_click', Object.assign({ contact_method: 'contact_section', link_url: href || undefined }, common));
    }
    if (trackAttr === 'cta' || a.matches('.btn-primary, .btn-secondary, .btn, .cta')) {
      return track('cta_click', Object.assign({ link_url: href || undefined }, common));
    }
  }, true);

  /* ---------- formulário de contato (Formspree via fetch) ---------- */
  function initForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var started = false;

    function serviceInterest() {
      var sel = form.querySelector('select[name="subject"]');
      if (!sel || !sel.value) return '(não informado)';
      var opt = sel.options[sel.selectedIndex];
      return (opt ? opt.text : sel.value).slice(0, 60); // categoria do serviço, nunca dado pessoal
    }

    function onStart() {
      if (started) return;
      started = true;
      track('form_start', { form_id: 'contact-form', form_name: 'contato' });
    }
    form.addEventListener('input', onStart);
    form.addEventListener('change', onStart);

    // O site envia o formulário com fetch() para o Formspree, depois da validação dele.
    // form_submit  = o envio realmente saiu para o Formspree (passou na validação do site)
    // generate_lead = o Formspree respondeu OK (mesmo momento em que o site mostra "Mensagem enviada!")
    // form_error   = o Formspree recusou ou a rede falhou (lead NÃO contabilizado)
    if (typeof window.fetch === 'function' && !window.fetch.__lzWrapped) {
      var originalFetch = window.fetch;
      var wrapped = function (input) {
        var url = '';
        try { url = String((input && input.url) || input); } catch (e) {}
        var isLeadForm = /formspree\.io\//i.test(url);
        var service = isLeadForm ? serviceInterest() : '';
        if (isLeadForm) {
          track('form_submit', { form_id: 'contact-form', form_name: 'contato', service_interest: service });
        }
        var p = originalFetch.apply(this, arguments);
        if (isLeadForm) {
          p.then(function (res) {
            if (res && res.ok) {
              track('generate_lead', { form_id: 'contact-form', lead_source: 'contact_form', service_interest: service });
            } else {
              track('form_error', { form_id: 'contact-form', error_type: 'http_' + (res ? res.status : 'unknown') });
            }
          }, function () {
            track('form_error', { form_id: 'contact-form', error_type: 'network' });
          });
        }
        return p;
      };
      wrapped.__lzWrapped = true;
      window.fetch = wrapped;
    }
  }

  /* ---------- aviso de cookies ---------- */
  var BANNER_ID = 'lz-consent';
  function hideBanner() { var b = document.getElementById(BANNER_ID); if (b) b.remove(); }
  function choose(value) {
    set('localStorage', CONSENT_KEY, value);
    hideBanner();
    if (value === 'granted') {
      loadGA();
    } else if (gaLoaded) {
      gtag('consent', 'update', { analytics_storage: 'denied' });
    }
  }
  function showBanner() {
    if (document.getElementById(BANNER_ID)) return;
    var css = document.createElement('style');
    css.textContent =
      '#' + BANNER_ID + '{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:560px;margin:0 auto;' +
      'background:#111;color:#f5f5f5;border-radius:14px;padding:16px 18px;box-shadow:0 10px 30px rgba(0,0,0,.3);' +
      'font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '#' + BANNER_ID + ' p{margin:0 0 12px}#' + BANNER_ID + ' a{color:inherit;text-decoration:underline}' +
      '#' + BANNER_ID + ' .lz-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}' +
      '#' + BANNER_ID + ' button{font:inherit;cursor:pointer;border-radius:999px;padding:8px 16px;border:1px solid #f5f5f5}' +
      '#' + BANNER_ID + ' .lz-no{background:transparent;color:#f5f5f5}' +
      '#' + BANNER_ID + ' .lz-yes{background:#f5f5f5;color:#111}';
    document.head.appendChild(css);
    var b = document.createElement('div');
    b.id = BANNER_ID;
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-live', 'polite');
    b.setAttribute('aria-label', 'Preferências de cookies');
    b.innerHTML =
      '<p>Usamos cookies de análise (Google Analytics) para entender como o site é usado e melhorar a experiência. ' +
      'Nenhum dado do formulário é enviado ao Google. <a href="' + PRIVACY_URL + '">Política de Privacidade</a>.</p>' +
      '<div class="lz-row"><button type="button" class="lz-no">Recusar</button>' +
      '<button type="button" class="lz-yes">Aceitar</button></div>';
    b.querySelector('.lz-no').addEventListener('click', function () { choose('denied'); });
    b.querySelector('.lz-yes').addEventListener('click', function () { choose('granted'); });
    document.body.appendChild(b);
  }
  window.lzConsent = {
    open: showBanner,
    status: function () { return get('localStorage', CONSENT_KEY) || 'pending'; }
  };

  function init() {
    initForm();
    var c = get('localStorage', CONSENT_KEY);
    if (c === 'granted') loadGA();
    else if (c !== 'denied') showBanner();
    // links com data-lz-consent abrem o aviso novamente (ex.: no rodapé)
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-lz-consent]');
      if (t) { e.preventDefault(); showBanner(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
