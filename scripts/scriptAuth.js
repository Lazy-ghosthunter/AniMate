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

    const loginResponse = await axios.post(`${base_url}/auth/signin`, {
      email: email,
      password: password,
    });

    localStorage.setItem("token", loginResponse.data.token);
    localStorage.setItem("username", loginResponse.data.username);

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

    // Salva o token e o username
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("username", response.data.username);

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
        token: token,
      },
    });

    localStorage.removeItem("token");
    alert("Logout realizado com sucesso");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erro no logout: ", error);
    alert("Erro ao fazer logout");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginform");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      signin();
    });
  }

  const cad = document.getElementById("signup-Form");
  if (cad) {
    cad.addEventListener("submit", (e) => {
      e.preventDefault();
      signup();
    });
  }

  const logoutLink = document.getElementById("signout");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault(); // Impede o redirecionamento automático
      signout(); // Executa o logout e redireciona manualmente
    });
  }

  
  const SendEmail = async () => {
    const email = document.getElementById("emailre").value.trim();
    if (!email) {
      alert("Informe um email");
      return;
    }
    try {
      // CORREÇÃO: usar ${base_url} dentro do template literal
      await axios.post(`${base_url}/auth/forgot-password`, { email });
      alert("Se o email for válido, será enviado o link de recuperação. Verifique o log/caixa de entrada.");
    } catch (error) {
      console.error("Erro ao pedir recuperação:", error);
      alert("Erro ao solicitar recuperação: " + (error.response?.data || error.message));
    }
  };

  const botaoRecuperar = document.getElementById("botaoem2");
  if (botaoRecuperar) {
    botaoRecuperar.addEventListener("click", (e) => {
      e.preventDefault(); // evita navegação do <a>
      SendEmail();
    });
  }

  const recover = async () => {
    const token = new URLSearchParams(window.location.search).get("token");

    const newPassword = document.getElementById("password").value;
    const rePassword = document.getElementById("repass").value;

    if (!token) {
      alert("Token ausente. Solicite a recuperação novamente.");
      return;
    }
    if (!newPassword || !rePassword) {
      alert("Preencha os campos de senha.");
      return;
    }
    if (newPassword.length < 8) {
      alert("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== rePassword) {
      alert("As senhas não conferem.");
      return;
    }

    const body = {
      token: token,
      newPassword: newPassword,
    };

    try {
      await axios.post(
        `${base_url}/auth/reset-password`,
        body
      );

      alert("Senha Alterada com sucesso, tente completar o login novamente!");
      window.location.href = "animatelogin.html";

    } catch (error) {
      console.error('Erro ao redefinir senha:', error);

      const resp = error.response?.data;
      const message = typeof resp === 'string' ? resp : (resp?.error || JSON.stringify(resp) || 'Erro desconhecido');
      alert(`Falha ao redefinir senha: ${message}`);
    }
  };

  const recoverForm = document.getElementById('recover-Form');
  if (recoverForm) {
    recoverForm.addEventListener('submit', (e) => {
      e.preventDefault();
      recover();
    });
  } else {
    const recoverBtn = document.getElementById('recover');
    if (recoverBtn) {
      recoverBtn.addEventListener('click', (e) => {
        e.preventDefault();
        recover();
      });
    }
  }
});
