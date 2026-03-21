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
