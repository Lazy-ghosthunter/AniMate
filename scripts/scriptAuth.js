const base_url = "http://localhost:8080";

const signup = async () => {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const repassword = document.getElementById("repass").value;

  const body = {
    username: username,
    email: email,
    password: password,
    rePassword: repassword, 
  };

  try {
    const response = await axios.post(`${base_url}/auth/signup`, body);
    console.log(response.data);
    alert("Dados cadastrados com sucesso");
    window.location.href = "animateperfil.html";
  } catch (error) {
    console.error("Erro no cadastro: ", error);
    const errorMessage = error.response?.data || "Erro desconhecido";
    alert(`Falha no cadastro: ${errorMessage}`);
  }
};

const signin = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const body = {
    email: email,
    password: password,
  };

  try {
    const response = await axios.post(`${base_url}/auth/signin`, body);
    console.log(response.data);
    // Salva o token
    localStorage.setItem("token", response.data.token);
    alert("Login realizado com sucesso");
    window.location.href = "animateperfil.html";
  } catch (error) {
    console.error("Erro no login: ", error);
    const errorMessage = error.response?.data || "Erro desconhecido";
    alert(`Falha no login: ${errorMessage}`);
  }
};

const signout = async () => {
  console.log("Logout iniciado");
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Usuário não está logado.");
    window.location.href = "index.html";
    return;
  }

  try {
    await axios.post(`${base_url}/auth/signout`, null, {
      headers: {
        'token': token
      }
    });

    localStorage.removeItem("token");
    alert("Logout realizado com sucesso");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erro no logout: ", error);
    alert("Erro ao fazer logout");
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginform');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      signin();
    });
  }

  const cad = document.getElementById('signup-Form');
  if (cad) {
    cad.addEventListener('submit', (e) => {
      e.preventDefault();
      signup();
    });
  }

  const logoutLink = document.getElementById('signout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault(); // Impede o redirecionamento automático
      signout();          // Executa o logout e redireciona manualmente
    });
  }

});