# JET Produção — sistema completo

PWA estática para operação em celular, atualizada a partir dos arquivos do projeto fornecido.

## Recursos
- PIN de entrada padrão `3633` e opção de restaurá-lo sem apagar registros.
- Registros operacionais com categoria, identificação, turno, motivo, observações, GPS e foto.
- Controle de turno: iniciar/encerrar, registrar eventos no histórico e calcular duração.
- Histórico com busca, filtro por categoria e mês, detalhes, exclusão e métricas mensais.
- Time Mark com câmera, GPS obrigatório antes da captura, endereço reverso quando disponível, carimbo gravado na imagem, prévia, download, compartilhamento e gravação no histórico.
- Legenda formatada para Telegram, compartilhamento nativo da foto e relatório diário copiável.
- Backup JSON v2 com fotos, GPS e endereços; importação de backups anteriores; duplicatas ignoradas.
- PWA com manifesto e cache offline dos arquivos estáticos.

## Publicar pelo Android
1. Baixe e extraia este ZIP.
2. Abra o repositório `borgesdoabc-art/jet-producao-web`.
3. Na raiz, toque em **Add file → Upload files** e selecione todos os arquivos extraídos, substituindo os arquivos de mesmo nome.
4. Confirme **Commit changes** na branch `main`.
5. Aguarde o GitHub Pages atualizar. Se a versão antiga persistir, feche e reabra o site ou limpe o cache do site.

## Notas importantes
- Os dados ficam no IndexedDB do navegador e não sincronizam automaticamente entre dispositivos. Faça backup regularmente.
- O PIN é uma barreira de interface; não criptografa os dados e não substitui autenticação corporativa.
- O backup com fotos pode ficar grande; guarde cópias em local seguro e teste a restauração.
- O endereço depende de internet e de serviços externos. Se a geocodificação falhar, as coordenadas GPS continuam disponíveis.
- O navegador não consegue escolher automaticamente um grupo ou tópico do Telegram. Confirme o destino e o envio dentro do Telegram.
- Teste com registros fictícios e faça um backup antes de substituir arquivos ou apagar dados.


### Relatório completo de encerramento de turno
O botão **Copiar relatório do turno** monta o relatório no formato de encerramento de patrulhamento, agrupa ocorrências por alarme, descarregado, fora de zona e vandalismo, inclui observações, total de tarefas, pontos organizados e evidências fotográficas. Veículo e agente padrão configurados: `URL9G77` e `Jonathan Borges`.
