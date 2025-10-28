if (!localStorage.getItem("token")) {
  alert("Você precisa estar logada para acessar essa página.");
  window.location.href = "index.html";
}

document.addEventListener('DOMContentLoaded', () => {

  let oldImageUrl = null;
  let oldImageUuid = null;
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

      if(profilePicture){
        console.log('loadProfile: userProfile.imageUrl =', userProfile.imageUrl);
      }

      if(profilePicture && userProfile.imageUrl){
        // Garante que a URL esteja bem formada, removendo "http://" duplicado
        const correctedUrl = userProfile.imageUrl.replace(/^(http:\/\/)+/g, 'http://');
        profilePicture.src = correctedUrl;
        oldImageUrl = correctedUrl;
        // capture uuid if provided by backend
        if (userProfile.imageUuid) {
          oldImageUuid = userProfile.imageUuid;
          window._oldImageUuid = oldImageUuid;
          console.log('loadProfile: oldImageUuid set to', oldImageUuid);
        }
        // expose for debugging in console
        window._oldImageUrl = oldImageUrl;
        console.log('loadProfile: oldImageUrl set to', oldImageUrl);
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
  const deleteFromChibisafe = async (imageUrl) => {
    if (!imageUrl) {
      console.log('deleteFromChibisafe: imageUrl está vazia — nada a deletar');
      return;
    }

    try {
      // Extrai o nome do arquivo com extensão. Ex: "abc.jpg"
      const filenameWithExt = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
      const dotIndex = filenameWithExt.lastIndexOf('.');
      const filenameWithoutExt = dotIndex > 0 ? filenameWithExt.substring(0, dotIndex) : filenameWithExt;

      console.log('deleteFromChibisafe: tentando deletar (com extensão):', filenameWithExt);

      // tenta extrair possíveis UUIDs embutidos na URL (tokens longos)
      const uuidCandidates = [];
      // candidate: filename without extension
      uuidCandidates.push(filenameWithoutExt);
      // candidate: filename with extension
      uuidCandidates.push(filenameWithExt);
      // candidate: any long token in the path
      try {
        const pathParts = new URL(imageUrl).pathname.split('/').filter(Boolean);
        pathParts.forEach(part => {
          if (/[A-Za-z0-9_-]{8,}/.test(part)) uuidCandidates.push(part);
        });
      } catch (e) {
        // ignore URL parse errors
      }
      // make candidates unique
      const uniqCandidates = Array.from(new Set(uuidCandidates));
      console.log('deleteFromChibisafe: uuidCandidates =', uniqCandidates);

      // Tente cada candidate até um succeed
      for (const candidate of uniqCandidates) {
        try {
          console.log('deleteFromChibisafe: tentando DELETE /api/file/' + candidate);
          const res = await axios.delete(`${chibisafeUrl}/api/file/${encodeURIComponent(candidate)}`, {
            headers: { 'x-api-key': chibisafeApiKey }
          });
          console.log('deleteFromChibisafe: sucesso com candidate=', candidate, res && res.status);
          return;
        } catch (err) {
          console.warn('deleteFromChibisafe: tentativa falhou para', candidate, err.response?.status || err.message);
          // continue to next candidate
        }
      }

      // nenhuma candidate funcionou — log final
      console.error('deleteFromChibisafe: nenhuma candidate deletou a imagem. Veja candidatos:', uniqCandidates);

      window.location.reload();

    } catch (error) {
      console.error('deleteFromChibisafe: erro inesperado', error);
    }
  };


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
  const newImgUuid = chibiRes.data.uuid || null;
      console.log('Imagem salva: ', newImgUrl);

      const token = localStorage.getItem('token');
      const body = {
        imageUrl: newImgUrl,
        imageUuid: newImgUuid,
      };

      console.log('Enviando pro back');
      await axios.put(`${base_url}/profile/picture?token=${token}`, body);

      console.log('handlePicSave: oldImageUrl =', oldImageUrl);
      console.log('handlePicSave: oldImageUuid =', oldImageUuid);
      console.log('handlePicSave: newImgUrl =', newImgUrl, ' newImgUuid=', newImgUuid);

      // expose for debugging in console
      window._oldImageUrl = oldImageUrl;
      window._oldImageUuid = oldImageUuid;
      window._newImgUrl = newImgUrl;
      window._newImgUuid = newImgUuid;

      // Note: server will attempt to delete the previous image using imageUuid. We avoid deleting from frontend to keep API key secret.

      // helper to trigger delete manually from console if needed
      window._debug_delete = async (url) => {
        console.log('manual debug delete called with', url);
        return deleteFromChibisafe(url);
      };

      alert('Foto alterada com sucesso!!! :D');
      

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
