function toggle(id) {
  var abs = document.getElementById("abs_" + id);
  var link = document.getElementById("abslink_" + id);
  if (abs.style.display === "none" || abs.style.display === "") {
    abs.style.display = "block";
    link.textContent = "[Hide Abstract]";
  } else {
    abs.style.display = "none";
    link.textContent = "[Abstract]";
  }
}

// Open all external links in a new tab automatically
document.addEventListener("DOMContentLoaded", function () {
  var pronunciationButtons = document.querySelectorAll('[data-pronunciation]');
  var pronunciationStatus = document.getElementById('pronunciation-status');
  var pronunciationPanel = document.getElementById('pronunciation-help');
  var nameSpeaker = document.querySelector('.name-speaker');
  function closePronunciation(restoreFocus) {
    pronunciationPanel.hidden = true;
    nameSpeaker.setAttribute('aria-expanded', 'false');
    document.querySelectorAll('#name-audio, #practice-audio').forEach(function (audio) { audio.pause(); });
    if (restoreFocus) nameSpeaker.focus();
  }
  if (pronunciationPanel && nameSpeaker) {
    pronunciationPanel.querySelector('.pronunciation-close').addEventListener('click', function () { closePronunciation(true); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !pronunciationPanel.hidden) closePronunciation(true);
    });
    document.addEventListener('click', function (event) {
      if (!pronunciationPanel.hidden && !pronunciationPanel.contains(event.target) && !nameSpeaker.contains(event.target)) closePronunciation(false);
    });
  }
  pronunciationButtons.forEach(function (button) {
    var audio = document.getElementById(button.dataset.pronunciation);
    if (!audio) return;
    button.addEventListener('click', function () {
      pronunciationPanel.hidden = false;
      nameSpeaker.setAttribute('aria-expanded', 'true');
      if (button === nameSpeaker) pronunciationPanel.querySelector('.pronunciation-close').focus();
      if (!audio.getAttribute('src')) {
        pronunciationStatus.textContent = 'The recording is unavailable. Please try again later.';
        return;
      }
      document.querySelectorAll('#name-audio, #practice-audio').forEach(function (otherAudio) { otherAudio.pause(); });
      audio.currentTime = 0;
      audio.play().then(function () {
        pronunciationStatus.textContent = '';
      }).catch(function () {
        pronunciationStatus.textContent = 'The recording could not play. Please try again.';
      });
    });
  });

  document.querySelectorAll('a[href]').forEach(function (link) {
    var href = link.getAttribute("href");
    if (href.startsWith("http") && !link.hasAttribute("target")) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
    }
  });

  // Add copy button to all code blocks
  document.querySelectorAll("pre").forEach(function (pre) {
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    pre.insertBefore(btn, pre.firstChild);
    btn.addEventListener("click", function () {
      var code = pre.querySelector("code");
      var text = code ? code.textContent : pre.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = "Copied!";
          setTimeout(function () { btn.textContent = "Copy"; }, 1500);
        }, function () {
          fallbackCopy(text, btn);
        });
      } else {
        fallbackCopy(text, btn);
      }
    });
    // btn already inserted above via insertBefore
  });

  function fallbackCopy(text, btn) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      btn.textContent = "Copied!";
      setTimeout(function () { btn.textContent = "Copy"; }, 1500);
    } catch (e) {
      btn.textContent = "Failed";
      setTimeout(function () { btn.textContent = "Copy"; }, 1500);
    }
    document.body.removeChild(ta);
  }
});
