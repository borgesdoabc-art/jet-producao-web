# JET Produção Web — PWA inicial

Versão inicial independente do Android, preparada para GitHub Pages e Safari no iPhone.

## Incluído nesta base
- Formulário de registros com categoria, identificação, turno, motivo e comentário.
- Captura de GPS com permissão do navegador.
- Anexo de foto e compressão para JPEG.
- Histórico com pesquisa, filtro por categoria/mês, detalhes e exclusão.
- Métricas mensais por total, dias ativos, média e categoria.
- Backup JSON e importação aditiva (ignora IDs já existentes).
- IndexedDB local e cache básico para abertura offline após a primeira visita.
- Manifest e service worker de PWA.

## Publicar pelo Android no GitHub Pages
1. Extraia o ZIP no Android usando o gerenciador de arquivos.
2. No navegador, entre em https://github.com e crie um repositório público chamado `jet-producao-web`.
3. Abra o repositório, escolha **Add file → Upload files** e envie o conteúdo desta pasta (index.html, app.js, styles.css, manifest.webmanifest, sw.js, icon.svg e README.md). Não envie a pasta ZIP dentro do repositório; envie os arquivos extraídos.
4. Faça commit dos arquivos.
5. No repositório, vá em **Settings → Pages**. Em **Build and deployment**, escolha **Deploy from a branch**, selecione `main` e `/ (root)`, depois **Save**.
6. Aguarde a publicação e abra o endereço indicado pelo GitHub Pages, normalmente `https://SEU-USUARIO.github.io/jet-producao-web/`.
7. No iPhone, abra esse endereço no Safari, permita câmera/fotos e localização quando solicitado, teste um registro e depois use **Compartilhar → Adicionar à Tela de Início**.

## Observações importantes
- Use HTTPS. GPS e câmera dependem de contexto seguro e de permissões do Safari.
- IndexedDB fica no armazenamento do navegador deste aparelho. Limpar dados do Safari, remover dados do site ou trocar de aparelho pode apagar os registros; exporte backups frequentemente.
- O backup JSON inclui fotos em base64 e pode ficar grande.
- Esta versão ainda não implementa a gravação/processamento de vídeo com Time Mark. Isso será uma etapa posterior e precisa ser testada no iPhone real.
- A interface é uma reconstrução web inicial baseada nas funcionalidades descritas no README do projeto Android, não uma conversão automática nem uma garantia de equivalência exata com o app nativo.
