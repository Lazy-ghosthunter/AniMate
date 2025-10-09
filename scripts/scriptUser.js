if (!localStorage.getItem("token")) {
  alert("Você precisa estar logada para acessar essa página.");
  window.location.href = "index.html";
}

document.addEventListener('DOMContentLoaded', () => {
  const usernameElement = document.getElementById("username");
  const username = localStorage.getItem("username");

  if (username && usernameElement) {
    usernameElement.textContent = `@${username}`;
  }
});
