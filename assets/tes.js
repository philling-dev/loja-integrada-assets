
(function () {\n if (!window.location.pathname.includes("/contato-suporte")) return;
 const blocoHTML = `
 <div id="bloco-download-suporte" style="text-align:left; padding:20px 0; margin:0;">
 <h2 style="font-size:28px; font-weight:700; color:#000; margin-bottom:6px;">
 Ferramenta de Suporte Remoto
 </h2>
 <p style="font-size:17px; color:#444; margin-bottom:20px;">
 Aplicação oficial de suporte técnico Araponto
 </p>
 <a href="https:
 style="display:inline-block; background-color:#B31500; color:#fff;
 font-size:16px; font-weight:600; padding:12px 36px;
 border-radius:6px; text-decoration:none;
 box-shadow:0 3px 6px rgba(0,0,0,0.25);
 transition:background-color 0.3s ease;">
 Download
 </a>
 </div>
 `;
 const obs = new MutationObserver(() => {\n const h1 = document.querySelector("h1");
 const p = document.querySelector("h1 + p");
 if (h1 && h1.textContent.trim().toLowerCase() === "não existem produtos nessa categoria") {\n const parent = h1.closest(".conteudo.span9, .caixa-destaque, main, .container") || h1.parentElement;
 h1.remove();
 if (p && /você está tentando acessar/i.test(p.textContent)) p.remove();
 const botaoCompras = parent.querySelector('a.botao.secundario[title*="compras"], a[href*="araponto.com"]');
 if (botaoCompras) botaoCompras.remove();
 const alvo = parent || document.querySelector(".conteudo.span9") || document.body;
 if (alvo && !document.getElementById("bloco-download-suporte")) {\n alvo.insertAdjacentHTML("afterbegin", blocoHTML);
 }\n obs.disconnect();
 }
 });
 obs.observe(document.body, {\n childList: true, subtree: true });
})();