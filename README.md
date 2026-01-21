# Configurando o Ambiente Front-End com Chibisafe

Este guia explica como configurar o ambiente de desenvolvimento front-end, incluindo a instância local do **Chibisafe**, que é usada como nosso serviço de armazenamento de imagens para as fotos de perfil dos usuários.

Seguir estes passos é essencial para que a funcionalidade de upload de imagens funcione corretamente.

## Índice
1.  [Pré-requisitos](#pré-requisitos)
2.  [Subindo o Chibisafe com Docker](#passo-1-subindo-o-chibisafe-com-docker)
3.  [Obtendo a API Key](#passo-2-obtendo-a-api-key)
4.  [Configurando o `config.js`](#passo-3-configurando-o-arquivo-configjs)

---

### Pré-requisitos
*   [Docker](https://www.docker.com/products/docker-desktop/) instalado e em execução na sua máquina.

---

### Passo 1: Subindo o Chibisafe com Docker

Nós usamos uma imagem Docker do Chibisafe para garantir que o ambiente seja idêntico para todos. O comando abaixo irá baixar a imagem, criar um contêiner e rodá-lo na porta `24424`, que é a porta que nossa aplicação espera.

siga os passos no guia oficial do chibisafe para configura-lo corretamente:

https://chibisafe.moe/guides/running-with-docker


### Passo 2: Obtendo a API Key

Com o Chibisafe rodando, precisamos de uma chave de API para autorizar os uploads.

1.  **Acesse o Chibisafe**: Abra seu navegador e vá para `http://localhost:24424`.
2.  **Crie uma conta**: O primeiro usuário a se registrar se torna o administrador. Crie sua conta.
 - Caso não seja possível criar uma nova conta, utilize: admin em ambos os campos;
 - Desta forma você poderá seguir para os próximos passos desse tutorial.
3.  **Vá para Configurações**: Após o login, clique no seu nome de usuário no canto superior direito e vá para **Settings**.
4.  **Gere a API Key**: No menu lateral, clique em **Credentials** e depois no botão **"Request new API key"**.
5.  **Copie a Chave**: Uma nova chave (um texto longo) aparecerá. **Copie essa chave**, pois você precisará dela no próximo passo.

---

### Passo 3: Configurando o Arquivo `config.js`

O arquivo `config.js` contém as URLs e chaves que nossa aplicação precisa.
ele não é enviado para o Git (está no `.gitignore`). Você precisa criá-lo manualmente.

1.  **Crie o arquivo**: Na pasta `Animate Front-End/AniMate/scripts/`, crie um novo arquivo chamado `config.js`.

2.  **Adicione o conteúdo**: Copie e cole o código abaixo no seu `config.js`.

    ```javascript
    // URL base da nossa API backend
    const base_url = "http://localhost:8080";

    // URL do serviço de armazenamento de imagens Chibisafe
    const chibisafeUrl = "http://localhost:24424"; 

    // Chave de API para autorizar uploads no Chibisafe
    const chibisafeApiKey = "SUA_CHAVE_API_VEM_AQUI"; 
    ```

3.  **Cole sua API Key**: Substitua o texto `"SUA_CHAVE_API_VEM_AQUI"` pela chave que você copiou do painel do Chibisafe no passo anterior.

