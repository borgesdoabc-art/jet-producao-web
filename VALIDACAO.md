# Validação do pacote

Verificações realizadas ao preparar o pacote:
- Sintaxe JavaScript de `app.js`, `timemark.js` e `sw.js`.
- Referências de IDs HTML utilizadas pelos scripts.
- JSON do manifesto PWA.
- Presença dos arquivos essenciais da aplicação.

Teste manual recomendado após publicação:
1. Abrir com PIN 3633.
2. Iniciar e encerrar um turno.
3. Criar um registro com GPS e foto.
4. Fazer Time Mark após capturar GPS; verificar se data/hora/endereço/coordenadas aparecem na imagem.
5. Exportar backup e confirmar `photosIncluded: true` no JSON.
6. Importar o mesmo backup e confirmar que os registros duplicados são ignorados.
7. Confirmar navegação no histórico, métricas e funcionamento offline após abrir uma vez online.
