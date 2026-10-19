const ALLOWED_ORIGIN = "https://borgesdoabc-art.github.io";

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-JET-Key",
      "Vary": "Origin",
      "Cache-Control": "no-store",
    },
  });
}

async function telegram(env, method, body) {
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,
    body === undefined ? {} : {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram API request failed");
  }
  return data.result;
}

async function getChatId(env) {
  if (env.TELEGRAM_CHAT_ID) return env.TELEGRAM_CHAT_ID;
  const updates = await telegram(env, "getUpdates", {
    limit: 100,
    allowed_updates: ["message"]
  });
  const messages = updates
    .map(x => x.message)
    .filter(m => m && m.chat && m.chat.type === "private");
  if (!messages.length) {
    throw new Error("Nenhuma conversa privada encontrada. Abra o bot e envie /start.");
  }
  messages.sort((a, b) => (b.date || 0) - (a.date || 0));
  return String(messages[0].chat.id);
}

function decodePhoto(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || "");
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = match[1].split("/")[1].replace("jpeg", "jpg");
  return new File([bytes], `evidencia.${ext}`, { type: match[1] });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-JET-Key",
          "Vary": "Origin",
        },
      });
    }

    const url = new URL(request.url);
    if (url.pathname === "/" && request.method === "GET") {
      return json({
        status: "online",
        service: "JET Telegram Worker",
        telegramTokenConfigured: Boolean(env.TELEGRAM_BOT_TOKEN),
        adminKeyConfigured: Boolean(env.JET_ADMIN_KEY),
      }, 200, allowedOrigin);
    }

    const routes = ["/api/test", "/api/send-report", "/api/send-record", "/api/chat-id"];
    if (!routes.includes(url.pathname) || request.method !== "POST") {
      return json({ ok: false, error: "Rota nao encontrada" }, 404, allowedOrigin);
    }
    if (origin && origin !== ALLOWED_ORIGIN) {
      return json({ ok: false, error: "Origem nao permitida" }, 403, allowedOrigin);
    }
    if (!env.TELEGRAM_BOT_TOKEN || !env.JET_ADMIN_KEY) {
      return json({ ok: false, error: "Segredos do Worker nao configurados" }, 500, allowedOrigin);
    }
    if (request.headers.get("X-JET-Key") !== env.JET_ADMIN_KEY) {
      return json({ ok: false, error: "Chave de acesso incorreta" }, 401, allowedOrigin);
    }

    try {
      if (url.pathname === "/api/chat-id") {
        const chatId = await getChatId(env);
        return json({ ok: true, chat_id: chatId }, 200, allowedOrigin);
      }

      const payload = await request.json().catch(() => ({}));
      const chatId = await getChatId(env);

      if (url.pathname === "/api/test") {
        await telegram(env, "sendMessage", {
          chat_id: chatId,
          text: String(payload.message || "JET Produção conectado com sucesso. 🟢").slice(0, 4000),
        });
        return json({ ok: true, message: "Mensagem de teste enviada ao Telegram." }, 200, allowedOrigin);
      }

      if (url.pathname === "/api/send-report") {
        const text = String(payload.text || "").trim();
        if (!text) return json({ ok: false, error: "Relatorio vazio." }, 400, allowedOrigin);
        const chunks = text.match(/[\s\S]{1,3900}/g) || [];
        for (const chunk of chunks) {
          await telegram(env, "sendMessage", { chat_id: chatId, text: chunk });
        }
        return json({ ok: true, message: "Relatorio enviado ao Telegram." }, 200, allowedOrigin);
      }

      const caption = String(payload.text || "Ocorrencia JET").slice(0, 1000);
      const photo = decodePhoto(payload.photoDataUrl);
      if (photo) {
        const form = new FormData();
        form.append("chat_id", chatId);
        form.append("caption", caption);
        form.append("photo", photo);
        const response = await fetch(
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
          { method: "POST", body: form }
        );
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.description || "Falha ao enviar foto");
        }
      } else {
        await telegram(env, "sendMessage", {
          chat_id: chatId,
          text: caption.slice(0, 4000)
        });
      }
      return json({ ok: true, message: "Ocorrencia enviada ao Telegram." }, 200, allowedOrigin);
    } catch (error) {
      return json({ ok: false, error: error.message || "Erro ao comunicar com Telegram." }, 502, allowedOrigin);
    }
  },
};
