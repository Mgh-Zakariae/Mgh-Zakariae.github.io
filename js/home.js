
    // ---- Heartbeat hero ----
    (function () {
      var canvas = document.getElementById('ekgCanvas'), ctx = canvas.getContext('2d');
      var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      var dpr = Math.max(1, devicePixelRatio || 1), offset = 0, cycle = 340, cssW = 0, cssH = 0;
      function resize() { var r = canvas.parentElement.getBoundingClientRect(); cssW = r.width; cssH = r.height; canvas.width = cssW * dpr; canvas.height = cssH * dpr; canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px' }
      addEventListener('resize', function () { resize(); if (reduce) draw() }); resize();
      function pulseY(x) {
        var t = ((x % cycle) + cycle) % cycle, w = cycle;
        if (t < w * .32) return 0;
        if (t < w * .38) return -6 * ((t - w * .32) / (w * .06));
        if (t < w * .44) return -6 + 58 * ((t - w * .38) / (w * .06));
        if (t < w * .50) return 52 - 70 * ((t - w * .44) / (w * .06));
        if (t < w * .58) return -18 + 18 * ((t - w * .50) / (w * .08));
        return 0
      }
      function draw() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cssW, cssH);
        var midY = cssH * .62, g = ctx.createLinearGradient(0, 0, cssW, 0);
        g.addColorStop(0, 'rgba(10,3,4,0)'); g.addColorStop(.15, 'rgba(130,32,42,.95)'); g.addColorStop(.5, 'rgba(150,38,50,1)'); g.addColorStop(.85, 'rgba(130,32,42,.95)'); g.addColorStop(1, 'rgba(10,3,4,0)');
        function trace(phase, stroke, lw, blur) {
          ctx.beginPath();
          for (var x = 0; x <= cssW; x += 2) { var y = midY - pulseY(x + offset + phase); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
          ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(130,32,42,.8)'; ctx.shadowBlur = blur; ctx.stroke()
        }
        trace(18, 'rgba(130,32,42,.22)', 1, 8); trace(0, g, 1.8, 12)
      }
      if (reduce) draw(); else (function loop() { offset += .9; draw(); requestAnimationFrame(loop) })();
    })();

    // ---- Project cards pin in ----
    (function () {
      var cards = document.querySelectorAll('.pin-card');
      if (!('IntersectionObserver' in window)) { cards.forEach(function (c) { c.classList.remove('hide') }); return }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            var i = [].indexOf.call(cards, e.target);
            setTimeout(function () { e.target.classList.add('show'); e.target.classList.remove('hide') }, i * 140); io.unobserve(e.target)
          }
        })
      }, { threshold: .2 });
      cards.forEach(function (c) { io.observe(c) });
    })();

    // ---- Active nav link ----
    (function () {
      var links = document.querySelectorAll('nav .links a');
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id) })
        })
      }, { rootMargin: '-45% 0px -50% 0px' });
      ['about_me', 'board', 'cold', 'contact'].forEach(function (id) { io.observe(document.getElementById(id)) });
    })();

    // ---- Timeline: red string through every pin ----
    (function () {
      var wall = document.getElementById('evidence'); if (!wall) return;
      var svg = wall.querySelector('.string'), path = document.getElementById('thread');
      var items = wall.querySelectorAll('.item'), pins = wall.querySelectorAll('.pin');
      function draw() {
        var w = wall.getBoundingClientRect(), pts = [].map.call(pins, function (p) { var r = p.getBoundingClientRect(); return [r.left - w.left + r.width / 2, r.top - w.top + r.height / 2] });
        svg.setAttribute('viewBox', '0 0 ' + w.width + ' ' + w.height);
        var d = 'M' + pts[0][0] + ' ' + pts[0][1];
        for (var i = 1; i < pts.length; i++) {
          var a = pts[i - 1], b = pts[i], dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
          d += ' Q' + ((a[0] + b[0]) / 2) + ' ' + ((a[1] + b[1]) / 2 + 14 + dist * .07) + ' ' + b[0] + ' ' + b[1]
        }
        path.setAttribute('d', d);
        path.style.setProperty('--len', Math.ceil(path.getTotalLength()) + 10)
      }
      draw(); addEventListener('load', draw); addEventListener('resize', draw);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
      function reveal() {
        items.forEach(function (it, i) { setTimeout(function () { it.classList.add('show'); it.classList.remove('hide') }, i * 200) });
        setTimeout(function () { wall.classList.add('live') }, 300)
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { draw(); reveal(); io.disconnect() } }, { threshold: .2 }).observe(wall)
      } else { items.forEach(function (i) { i.classList.remove('hide') }); wall.classList.add('live') }
      wall.querySelectorAll('.bar').forEach(function (b) {
        b.addEventListener('click', function () { b.classList.toggle('on') });
        b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.classList.toggle('on') } })
      });
    })();

    // ---- Articles: filing cabinet (drawers are rendered at build time) ----
    (function () {
      var cab = document.getElementById('cabinet'); if (!cab) return;
      function setOpen(d, on) { d.classList.toggle('open', on); d.querySelector('.front').setAttribute('aria-expanded', on) }
      cab.addEventListener('click', function (e) {
        var f = e.target.closest('.front'); if (!f) return;
        var d = f.parentElement, will = !d.classList.contains('open');
        cab.querySelectorAll('.drawer.open').forEach(function (o) { setOpen(o, false) });
        setOpen(d, will)
      });
    })();

