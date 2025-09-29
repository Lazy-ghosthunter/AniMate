const base_url = "http://localhost:8080";

const axios = require("axios");

const signup = async () => {
  const username = document.getElementById("#username").value.trim();
  const email = document.getElementById("#email").value.trim();
  const password = document.getElementById("#password").value();
  const repassword = document.getElementById("#repass").value();

  const body = {
    username: username,
    email: email,
    password: password,
    repassword: repassword,
  };

  try {
    const response = await axios.post(`${base_url}/auth/signup`, body);
    console.log(response.data);
    alert("Dados cadastrados com sucesso");
    window.location.href = "animateperfil.html";
  } catch (erro) {
    console.error("Erro no cadastro: ", erro);
    const errorMessage = error.response?.data || "Erro desconhecido";
    alert(`Falha no cadastro: ${errorMessage}`);
  }
};

//submit do form do cadastro
const cad = document.getElementById('signup-Form');
cad.addEventListener('submit',() =>{
  signup();
});




const signin = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value();

  const body = {
    email: email,
    password: password,
  };

  try {
    const response = await axios.post(`${base_url}/auth/signin`, body);
    console.log(response.data);
    alert("Login realizado com sucesso");
    window.location.href = "animateperfil.html";
  } catch (error) {
    console.error("Erro no login: ", error);
    const errorMessage = error.response?.data || "Erro desconhecido";
    alert(`Falha no login: ${errorMessage}`);
  }
};

//submit do form do login
const loginForm = document.getElementById('loginform');
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  signin();
});



