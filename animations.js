/* ============================================================
   animations.js
   平井総研 Webflow Global Animation & Interaction Script
   Prefix: hs-
   CDN: jsDelivr via GitHub

   注意: .hs-fade-up の初期スタイル（opacity:0 等）は
   global.css で定義済み。JSでは data-animated の付与のみ行う。
   ============================================================ */

window.Webflow = window.Webflow || [];
window.Webflow.push(function () {

  'use strict';


  /* ============================================================
     Utility: Throttle
     高頻度イベント（scroll / resize）の呼び出し回数を制限する
     ============================================================ */

  function throttle(fn, interval) {
    var lastTime = 0;
    return function () {
      var now = Date.now();
      if (now - lastTime >= interval) {
        lastTime = now;
        fn.apply(this, arguments);
      }
    };
  }


  /* ============================================================
     Utility: Debounce
     連続イベント終了後に一度だけ実行する
     ============================================================ */

  function debounce(fn, wait) {
    var timer;
    return function () {
      var ctx  = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }


  /* ============================================================
     Utility: isInViewport
     要素がビューポート内に入っているか判定（threshold: 0〜1）
     ============================================================ */

  function isInViewport(el, threshold) {
    var rect     = el.getBoundingClientRect();
    var winH     = window.innerHeight || document.documentElement.clientHeight;
    var visible  = threshold !== undefined ? threshold : 0.15;
    return rect.top <= winH * (1 - visible) && rect.bottom >= 0;
  }


  /* ============================================================
     1. Scroll Fade-In  (.hs-fade-up)
        属性: data-delay="0〜500" (ms)
        ビューポート内に入ったら data-animated="true" を付与
        → CSS側で opacity:1 / translateY(0) に遷移
     ============================================================ */

  (function initFadeUp() {

    var fadeEls = Array.prototype.slice.call(
      document.querySelectorAll('.hs-fade-up')
    );

    if (!fadeEls.length) return;

    function revealFadeEls() {
      fadeEls.forEach(function (el) {
        if (el.dataset.animated) return;
        if (isInViewport(el, 0.1)) {
          var delay = parseInt(el.dataset.delay, 10) || 0;
          setTimeout(function () {
            el.dataset.animated = 'true';
          }, delay);
        }
      });
    }

    /* 初回チェック（ファーストビュー対応） */
    revealFadeEls();

    window.addEventListener(
      'scroll',
      throttle(revealFadeEls, 100),
      { passive: true }
    );

    window.addEventListener(
      'resize',
      debounce(revealFadeEls, 200),
      { passive: true }
    );

  })();


  /* ============================================================
     2. Number Count-Up  (.hs-counter)
        属性: data-target="500"  data-suffix="件"
        ビューポートに入ったらゼロから目標値までカウントアップ
     ============================================================ */

  (function initCounter() {

    var counterEls = Array.prototype.slice.call(
      document.querySelectorAll('.hs-counter')
    );

    if (!counterEls.length) return;

    /**
     * easeOutQuart イージング関数
     * @param {number} t - 進行度 (0〜1)
     */
    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    /**
     * 単一カウンターのアニメーション
     * @param {Element} el      - 対象要素
     * @param {number}  target  - 目標値
     * @param {string}  suffix  - 単位文字列
     * @param {number}  duration- アニメーション時間 (ms)
     */
    function animateCounter(el, target, suffix, duration) {
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed  = timestamp - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var easedVal = easeOutQuart(progress);
        var current  = Math.round(easedVal * target);

        el.textContent = current.toLocaleString('ja-JP') + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString('ja-JP') + suffix;
          el.dataset.animated = 'true';
        }
      }

      requestAnimationFrame(step);
    }

    function revealCounters() {
      counterEls.forEach(function (el) {
        if (el.dataset.animated) return;
        if (isInViewport(el, 0.1)) {
          var target   = parseInt(el.dataset.target, 10) || 0;
          var suffix   = el.dataset.suffix  || '';
          var duration = parseInt(el.dataset.duration, 10) || 1800;
          animateCounter(el, target, suffix, duration);
        }
      });
    }

    /* 初回チェック */
    revealCounters();

    window.addEventListener(
      'scroll',
      throttle(revealCounters, 100),
      { passive: true }
    );

    window.addEventListener(
      'resize',
      debounce(revealCounters, 200),
      { passive: true }
    );

  })();


  /* ============================================================
     3. Header Scroll Control
        スクロール 50px 以上で <header> に .hs-header-scrolled を付与
        背景色・影などのトランジション制御に使用
     ============================================================ */

  (function initHeaderScroll() {

    var header = document.querySelector('header');

    if (!header) return;

    var SCROLL_THRESHOLD = 50;

    function updateHeader() {
      if (window.scrollY >= SCROLL_THRESHOLD) {
        header.classList.add('hs-header-scrolled');
      } else {
        header.classList.remove('hs-header-scrolled');
      }
    }

    /* 初回チェック（リロード時にスクロール位置が残っている場合） */
    updateHeader();

    window.addEventListener(
      'scroll',
      throttle(updateHeader, 80),
      { passive: true }
    );

  })();


  /* ============================================================
     4. Hamburger Menu  (SP)
        .hs-hamburger クリック → .hs-nav-menu 開閉
        body に .hs-menu-open を付与
     ============================================================ */

  (function initHamburger() {

    var hamburger = document.querySelector('.hs-hamburger');
    var navMenu   = document.querySelector('.hs-nav-menu');

    if (!hamburger || !navMenu) return;

    /* アクセシビリティ属性の初期設定 */
    hamburger.setAttribute('role', 'button');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'メニューを開く');
    hamburger.setAttribute('aria-controls', 'hs-nav-menu');
    navMenu.setAttribute('id', 'hs-nav-menu');
    navMenu.setAttribute('aria-hidden', 'true');

    function openMenu() {
      document.body.classList.add('hs-menu-open');
      hamburger.classList.add('hs-hamburger--active');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'メニューを閉じる');
      navMenu.setAttribute('aria-hidden', 'false');
      /* メニュー表示中はバックグラウンドスクロールを抑止 */
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      document.body.classList.remove('hs-menu-open');
      hamburger.classList.remove('hs-hamburger--active');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'メニューを開く');
      navMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function toggleMenu() {
      if (document.body.classList.contains('hs-menu-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    /* ハンバーガークリック */
    hamburger.addEventListener('click', toggleMenu);

    /* キーボード操作（Enter / Space） */
    hamburger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });

    /* オーバーレイクリックで閉じる */
    document.addEventListener('click', function (e) {
      if (
        document.body.classList.contains('hs-menu-open') &&
        !navMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        closeMenu();
      }
    });

    /* Escape キーで閉じる */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('hs-menu-open')) {
        closeMenu();
        hamburger.focus();
      }
    });

    /* リサイズ時に SP→PC 幅になったらメニューを閉じる */
    window.addEventListener(
      'resize',
      debounce(function () {
        if (window.innerWidth > 767) {
          closeMenu();
        }
      }, 200)
    );

  })();


}); /* end Webflow.push */
