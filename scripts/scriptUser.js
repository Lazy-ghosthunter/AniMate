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

  //* Lógica do nome

  const toggleNameAlt = () => {

    const nameAltArea = document.getElementById('nameAreaAlt');
    const nameArea = document.getElementById('nameArea');
    nameAltArea.classList.toggle('hiddenName');
    nameArea.classList.toggle('hiddenName');

  };

  const toggleBtnName = document.getElementById('toggleCN');
  if(toggleBtnName) toggleBtnName.addEventListener('click', toggleNameAlt);

  const altName = async () => {

    const nameInput = document.getElementById("nameAlt");
    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (!name) {
      alert("Digite um nome válido.");
      return;
    }

    const token = localStorage.getItem("token");


    const body = {

      name : username,

    };

    try {
      const response = await axios.put(`${base_url}/profile/name?token=${token}`, body);
      console.log(response.data);

      // Atualiza localStorage com o nome retornado ou com o nome enviado
      const newName = response.data?.name || response.data?.username || name;
      localStorage.setItem("username", newName);

      // Atualiza a UI sem depender apenas do reload
      const usernameElement = document.getElementById("username");
      if (usernameElement) usernameElement.textContent = `@${newName}`;

      alert("Nome alterado com sucesso!!");

      // Fecha a área de edição (opcional)
      toggleNameAlt();

    } catch (error) {
      console.error("Erro na alteração: ", error);
      const errorMessage = error.response?.data || error.message || "Erro desconhecido";
      alert(`Falha na alteração: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}`);
    }

  };

  const saveName = document.getElementById('changeName');
  saveName.addEventListener('click', altName);

  //* lógicas da Bio
  const loadProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get(`${base_url}/profile/me?token=${token}`);
      const userProfile = response.data;
      
      const bioP = document.getElementById('bio'); 
      if (bioP && userProfile.bio) {
        bioP.textContent = userProfile.bio;
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      alert("Não foi possível carregar as informações do perfil.");
    }

  };

  loadProfile();

  //Esconde a parte de edição
  const toggleBioAlt = () => {
    const bioAltArea = document.getElementById('bioAltArea');
    const bioArea = document.getElementById('bioArea');
    bioAltArea.classList.toggle('hidden');
    bioArea.classList.toggle('hidden')
  };

  const toggleBtn = document.getElementById('toggleChange');
  toggleBtn.addEventListener('click', toggleBioAlt);


  const altBio = async () => {
    const bio = document.getElementById("bioAlt").value.trim();
    const token = localStorage.getItem("token");
    
    const body = {
      bio: bio, 
    };

    try {
      const response = await axios.put(`${base_url}/profile/bio?token=${token}`, body);
      console.log(response.data);
      alert("Bio alterada com sucesso");

      window.location.reload();

    } catch (error) {
      console.error("Erro na alteração: ", error);
      errorMessage = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      alert(`Falha na alteração: ${errorMessage}`);
    }
  };

  const save = document.getElementById('change');
  save.addEventListener('click', altBio);


  //*foto de perfil
                                            
  
});


