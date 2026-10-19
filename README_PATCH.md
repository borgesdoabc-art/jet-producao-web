# JET Produção Web — pacote de atualização (PWA inicial + Time Mark)

## Aplicar pelo Android
1. Extraia este ZIP no Android.
2. Abra o repositório https://github.com/borgesdoabc-art/jet-producao-web.
3. Use **Add file → Upload files** e envie os arquivos da pasta extraída para a raiz do repositório, substituindo os arquivos com o mesmo nome.
4. Confirme em **Commit changes** e aguarde o GitHub Pages atualizar.
5. No iPhone, feche e reabra a PWA. Se continuar mostrando a versão antiga, remova o ícone da tela inicial e adicione novamente pelo Safari.

## O que este pacote contém
- PWA instalável chamada JET Produção.
- Registro geral, histórico local, filtros simples, métricas básicas e importação/exportação JSON.
- Aba Time Mark com câmera do navegador, GPS obrigatório antes da captura, carimbo aplicado aos pixels, pré-visualização, refazer, salvar, baixar e compartilhar quando suportado.
- Backup JSON sem fotos, conforme o requisito definido. As fotos continuam armazenadas localmente nos registros existentes, mas não entram no arquivo de backup.

## Limitações importantes
Este pacote é uma atualização funcional da PWA inicial, **não é ainda a implementação completa de todos os requisitos reunidos**. Ainda faltam os fluxos completos de turno, pontos organizados separados, períodos de ociosidade, PIN e bloqueio, configurações/categorias personalizadas, relatórios completos e edição avançada de registros. Não use como substituto completo do aplicativo operacional sem testar e concluir esses módulos.

A câmera e o GPS exigem HTTPS e permissões concedidas. Os dados são locais ao navegador/dispositivo; não há sincronização automática. Teste primeiro com registros fictícios.
