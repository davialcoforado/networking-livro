# Landing Page — Livro de Networking

Página de captura de leads para lançamento do livro.

---

## Estrutura

```
networking-livro/
├── index.html   ← estrutura da página
├── style.css    ← todos os estilos
├── script.js    ← validação, envio e animações
└── README.md
```

---

## Como rodar localmente

Abra o `index.html` direto no navegador,
ou use o VS Code com a extensão **Live Server**:

1. Instale a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Clique com o botão direito em `index.html` → **"Open with Live Server"**

---

## Personalização obrigatória antes de publicar

### 1. Dados do autor
No `index.html`, procure os comentários marcados com `DADOS DO AUTOR` e substitua:
- `[Nome do Autor]` → nome completo
- `[Cargo, profissão ou especialidade]` → ex: "Consultor e palestrante"
- `[X]` → anos de experiência
- `[área de atuação]` → ex: "gestão e relacionamentos"

### 2. Título do livro
Troque `[Título do Livro]` na tag `<title>` e onde mais aparecer.

### 3. Foto do autor
- Coloque a foto em `img/autor.jpg` (crie a pasta `img/`)
- No `index.html`, descomente a tag `<img>` na seção autor e apague o `<div class="author-placeholder">`

### 4. Redes sociais (opcional)
- No `index.html`, descomente o bloco `.author-social` e preencha os links

---

## Integração do formulário

O formulário está em modo simulação por padrão.
Escolha uma das opções abaixo:

### Opção A — Formspree (recomendado para iniciantes)
1. Crie conta em [formspree.io](https://formspree.io)
2. Crie um formulário e copie a URL do endpoint
3. Em `script.js`, preencha:
   ```js
   const FORMSPREE_URL = "https://formspree.io/f/SEU_ID";
   ```

### Opção B — Netlify Forms (se hospedar no Netlify)
1. Em `script.js`, defina:
   ```js
   const USE_NETLIFY = true;
   ```
2. Na tag `<form>` do `index.html`, adicione os atributos:
   ```html
   <form id="lead-form" data-netlify="true" name="leads" novalidate>
   ```
3. Dentro do `<form>`, adicione:
   ```html
   <input type="hidden" name="form-name" value="leads">
   ```
4. Faça o deploy — o Netlify detecta automaticamente.

---

## Publicar no Netlify (gratuito)

1. Acesse [netlify.com](https://netlify.com) e crie uma conta
2. Arraste a pasta `networking-livro/` para a área de upload em **"Deploy manually"**
3. O site estará no ar em segundos com um link temporário
4. Em **"Domain settings"**, conecte o domínio que você já comprou

## Publicar no Vercel (gratuito)

1. Instale o CLI: `npm i -g vercel`
2. Dentro da pasta do projeto, rode: `vercel`
3. Siga as instruções — domínio customizado disponível nas configurações

---

## Conectar domínio próprio

Após publicar, acesse as configurações de domínio da plataforma
e siga as instruções para apontar seu DNS para o Netlify ou Vercel.
Ambos oferecem HTTPS gratuito via Let's Encrypt.
