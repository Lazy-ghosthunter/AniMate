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


