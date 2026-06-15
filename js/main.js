// Copy-to-clipboard buttons
document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    try {
      navigator.clipboard.writeText(btn.dataset.copy);
    } catch (err) {
      // clipboard unavailable — button still flips to "copied!" as feedback
    }
    btn.textContent = 'copied!';
    setTimeout(() => {
      btn.textContent = 'copy';
    }, 1600);
  });
});

// Hero terminal typing replay. The full session is already in the HTML, so
// content is readable without JS and under prefers-reduced-motion.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const terminal = document.getElementById('terminal');
  if (!terminal) return;

  const lines = Array.from(terminal.querySelectorAll('.t-line'));

  // Pause after each line lands, mirroring the design prototype's pacing
  const pauses = [500, 320, 260, 900, 120, 800, 700, 120, 450, 200, 400];

  const cursor = document.createElement('span');
  cursor.className = 't-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  lines.forEach((line) => {
    line.style.display = 'none';
  });

  let index = 0;

  function typeCommand(line, done) {
    const cmd = line.querySelector('.t-cmd');
    const full = cmd.textContent;
    cmd.textContent = '';
    line.style.display = '';
    line.appendChild(cursor);
    let pos = 0;

    function tick() {
      if (pos < full.length) {
        pos += 1;
        cmd.textContent = full.slice(0, pos);
        setTimeout(tick, 34 + Math.random() * 48);
      } else {
        done();
      }
    }
    tick();
  }

  function showLine() {
    if (index >= lines.length) {
      // Idle prompt with blinking cursor, as in the prototype
      const idle = document.createElement('div');
      idle.className = 't-line';
      const prompt = document.createElement('span');
      prompt.className = 't-prompt';
      prompt.textContent = '$ ';
      idle.append(prompt, cursor);
      terminal.appendChild(idle);
      return;
    }

    const line = lines[index];
    const pause = pauses[index] || 140;
    const advance = () => {
      index += 1;
      setTimeout(showLine, pause);
    };

    if (line.querySelector('.t-cmd')) {
      typeCommand(line, advance);
    } else {
      line.style.display = '';
      line.appendChild(cursor);
      advance();
    }
  }

  setTimeout(showLine, 700);
})();
