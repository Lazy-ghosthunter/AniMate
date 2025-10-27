if (!localStorage.getItem("token")) {
  alert("Você precisa estar logada para acessar essa página.");
  window.location.href = "index.html";
}

document.addEventListener('DOMContentLoaded', () => {

  const usernameElement = document.getElementById("username");
  const usernameStorage = localStorage.getItem("username");

  if (usernameStorage && usernameElement) {
    usernameElement.textContent = `@${usernameStorage}`;
  }

  //* lógicas da Bio
  const loadProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get(`${base_url}/profile/me?token=${token}`);
      const userProfile = response.data;
      
      const bioP = document.getElementById('bio'); 

      if (bioP && userProfile.bio && usernameElement && userProfile.username) {
        bioP.textContent = userProfile.bio;
        usernameElement.textContent = `@${userProfile.username}`;
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

  const toggleNameAlt = () => {
    const nameAltArea = document.getElementById('nameAreaAlt');
    const nameArea = document.getElementById('nameArea');

    if(!nameAltArea || !nameArea) return;

    nameAltArea.classList.toggle('hiddenName');
    nameArea.classList.toggle('hiddenName');
  }

  const toggleName = document.getElementById('toggleCN');
  if (toggleName) {
    toggleName.addEventListener('click', toggleNameAlt);
  }

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

  const altName = async () => {
    const username = document.getElementById("nameAlt").value.trim();
    const token = localStorage.getItem("token");
    
    const body = {
      username: username, 
    };

    try {
      const response = await axios.put(`${base_url}/profile/username?token=${token}`, body);
      if (response.data && response.data.username) {
        localStorage.setItem("username", response.data.username); 
      }
      
      console.log(response.data);
      alert("Nome alterado com sucesso!!");

      window.location.reload(); 

    } catch (error) {
        console.error("Erro na alteração: ", error);
        let errorMessage;
        if (error.response) {
            errorMessage = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
        } else {
            errorMessage = error.message; 
        }
        alert(`Falha na alteração: ${errorMessage}`);
    }
  };

  const saveName = document.getElementById('changeName');
  saveName.addEventListener('click', altName);

  //*foto de perfil
                                            
  
});
