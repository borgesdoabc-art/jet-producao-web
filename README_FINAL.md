# JET Produção — atualização de interface, PIN e endereço

## Publicação pelo Android
1. Extraia o ZIP.
2. No GitHub, abra `borgesdoabc-art/jet-producao-web` e use Add file → Upload files.
3. Envie/substitua os arquivos da raiz incluídos neste pacote e confirme Commit changes.
4. Aguarde o Pages publicar; feche e reabra o site.

## Alterações
- Cores JET: azul `#2F80ED`, branco, azul-marinho e cinza-claro.
- PIN numérico local na abertura; PIN esquecido pode ser redefinido mantendo os registros. O PIN é proteção de interface, não criptografia.
- Time Mark consulta endereço completo por geocodificação reversa quando há internet e inclui o endereço na foto; mantém coordenadas e precisão e informa quando o endereço não está disponível.
- Link de mapa abre o ponto pelas coordenadas.

## Importante
Os dados continuam no armazenamento local do navegador; faça backup antes de limpar os dados do site. Fotos não são incluídas no backup JSON. A geocodificação precisa de internet. Este pacote atualiza a PWA existente; teste com registros fictícios antes do uso operacional.


## Compartilhamento Telegram
No Histórico, cada registro tem o botão **Telegram**. Em iPhone/Android, use o compartilhamento do sistema para escolher Telegram, grupo e depois o tópico. A página web não seleciona automaticamente um tópico de fórum; essa escolha ocorre dentro do Telegram. Se o navegador não compartilhar a foto, ela será baixada e o texto abrirá no Telegram para envio manual.


## Copiar legenda manualmente
No Histórico, toque em **📋 Copiar legenda** para copiar o texto formatado do registro. No Telegram, anexe a foto ao grupo/tópico desejado e cole o texto no campo de legenda da própria foto antes de enviar. Se a cópia automática não estiver disponível, o app mostrará o texto para copiar manualmente.
