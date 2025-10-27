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
      const profilePicture = document.getElementById('profilePic');

      if (bioP && userProfile.bio && usernameElement && userProfile.username) {
        bioP.textContent = userProfile.bio;
        usernameElement.textContent = `@${userProfile.username}`;
      }

      if(profilePicture && userProfile.imageUrl){
        // Garante que a URL esteja bem formada, removendo "http://" duplicado
        const correctedUrl = userProfile.imageUrl.replace(/^(http:\/\/)+/g, 'http://');
        profilePicture.src = correctedUrl;
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
  const toggleAltPhoto = () => {
    const newPicDiv = document.getElementById('insertPic');
    newPicDiv.classList.toggle('hidden');
  }

  const picInput = document.getElementById('picInput');
  const savePicButton = document.getElementById('picBtn');
  const altPhotoB = document.getElementById('altPhoto');
  
  const handlePicSave = async () => {
    const file = picInput.files[0];
    if(!file) {
      alert('Por favor, selecione uma imagem.');
      return;
    }

    //enviar para o chibisafe(drive pras fotos)
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('enviando a foto');
      const chibiRes = await axios.post(`${chibisafeUrl}/api/upload`, formData, {
        headers:{
          'x-api-key': chibisafeApiKey,
          'Content-Type':'multipart/form-data',
        },

      });

      const newImgUrl = chibiRes.data.url;
      console.log('Imagem salva: ', newImgUrl);

      const token = localStorage.getItem('token');
      const body = {
        imageUrl: newImgUrl,
      };

      console.log('Enviando pro back');
      await axios.put(`${base_url}/profile/picture?token=${token}`, body);

      alert('Foto alterada com sucesso!!! :D');
      window.location.reload();

    } catch (error) {
      console.error('Erro ao atualizar a foto: ', error);
      const errorMessage = error.response?.data || 'Ocorreu um erro desconhecido.';
      alert(`Falha ao atualizar a foto: ${errorMessage}`);
      toggleAltPhoto();
    }
  };

  //botão para mostrar a div de alterar foto
  altPhotoB.addEventListener('click', toggleAltPhoto);

  //botão para ativar a função de salvar a foto
  savePicButton.addEventListener('click', handlePicSave);

  // --- Lógica para fechar o Pop-up ---
  const insertPicDiv = document.getElementById('insertPic');
  const overlay = document.getElementById('overlay');
  const closeButton = document.getElementById('close-popup');

  // Evento para fechar clicando no botão 'X'
  if (closeButton) {
    closeButton.addEventListener('click', toggleAltPhoto);
  }

  // Evento para fechar clicando no fundo (overlay)
  if (overlay) {
    overlay.addEventListener('click', (event) => {
      // Garante que o clique não foi no conteúdo do modal
      if (event.target === overlay) {
        toggleAltPhoto();
      }
    });
  }
  
  
});
