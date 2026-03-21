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
  document.querySelectorAll('a[href]').forEach(function (link) {
    var href = link.getAttribute("href");
    if (href.startsWith("http") && !link.hasAttribute("target")) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
    }
  });
});
