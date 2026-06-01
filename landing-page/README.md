# Kolibri — Landing page

Site institucional do Kolibri. HTML/CSS/JS estático, **sem build e sem dependências**.
O botão "Acessar a plataforma" leva para o app principal em
[kolibri-web.onrender.com](https://kolibri-web.onrender.com).

```
landing-page/
├── index.html      # a página inteira (uma rota só)
├── styles.css      # tokens de marca + layout (OKLCH, sem framework)
├── main.js         # nav sticky, scroll reveals, animação dos gauges
└── assets/
    ├── logo-mark.png     # marca oficial (colibri) com fundo transparente
    ├── passaporte.png    # screenshot do DPP real (referência)
    ├── app-login.png     # screenshot do app (referência)
    └── cover.png         # capa Kolibri Labs (og:image)
```

## Rodar localmente

Não precisa de Node nem pnpm. Qualquer servidor estático serve:

```bash
# a partir desta pasta
python3 -m http.server 4321
# abra http://localhost:4321
```

> Abrir o `index.html` direto com `file://` também funciona, mas um servidor
> evita qualquer atrito com caminhos relativos.

## Deploy no Render

A landing é um **Static Site** (não um microserviço com processo rodando — é só
CDN servindo arquivos). Já está declarada no [`render.yaml`](../render.yaml) da
raiz como o serviço `kolibri-landing`:

```yaml
- type: web
  name: kolibri-landing
  runtime: static
  rootDir: .
  buildCommand: "echo 'sem build...'"   # nada para compilar
  staticPublishPath: landing-page        # publica esta pasta
  routes:
    - type: rewrite
      source: /*
      destination: /index.html
```

Como aplicar (uma vez):

1. **Dashboard do Render → Blueprints** → abra o blueprint do Kolibri (o que lê o
   `render.yaml`) e clique em **Manual Sync / Apply**. O Render detecta o novo
   serviço `kolibri-landing` e cria o site.
2. Ele vai nascer numa URL tipo `https://kolibri-landing.onrender.com` (o Render
   às vezes adiciona um sufixo, ex.: `kolibri-landing-xxxx`).
3. Pronto. A cada push na branch o Render republica sozinho.

> Alternativa sem `render.yaml`: **New + → Static Site → conecta o repo →**
> *Publish Directory* = `landing-page`, *Build Command* em branco. Mesmo resultado.

### Domínio próprio (opcional)

Quando tiver um domínio (ex.: `kolibri.xyz`), aponte o apex/`www` para o
`kolibri-landing` em **Settings → Custom Domains**, e deixe o app em um subdomínio
(ex.: `app.kolibri.xyz` → `kolibri-web`).

## Editar conteúdo

Tudo é texto. Os pontos mais comuns de edição no `index.html`:

- **Link do app:** procure por `kolibri-web.onrender.com` (hero, nav, CTA, footer).
- **Redes sociais:** bloco `footer-socials` (X, Instagram, e-mail).
- **Roadmap:** seção `.timeline`.
- **Dados on-chain:** Program ID e links do explorer aparecem no hero (`.trust`) e
  no footer.
