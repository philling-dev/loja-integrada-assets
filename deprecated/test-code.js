// Script para testar a criação do código "Fix Carrinho Plugoo"
// Execute no console do browser em https://admin.widgetvpn.xyz

// Código completo do fix
const codeContent = `<style>
  /* Corrigir carrinho Plugoo */
  span.titulo.cor-secundaria.vazio-text { display: none !important; }
  .carrinho-link, .cart-icon, .header-cart { display: block !important; visibility: visible !important; }
  .cart-counter, .carrinho-contador { display: inline-block !important; min-width: 20px; text-align: center; }
  .cart-counter:empty::after { content: "0"; }
</style>

<script>
$(document).ready(function() {
  // Corrigir contador carrinho
  function updateCartCounter() {
    var cartCount = (typeof CARRINHO_PRODS !== 'undefined' && CARRINHO_PRODS.length) ? CARRINHO_PRODS.length : 0;
    $('.cart-counter, .carrinho-contador, .cart-count').text(cartCount);
    $('.carrinho-link, .cart-icon').show();
  }

  updateCartCounter();

  // Event listeners
  $(document).on('li_add_to_cart li_remove_from_cart li_change_quantity', function() {
    setTimeout(updateCartCounter, 500);
  });
});
</script>`;

// Simular o processo que o usuário faria:
console.log('=== TESTE: CRIAÇÃO DO CÓDIGO "FIX CARRINHO PLUGOO" ===');

// 1. Detectar tipo automaticamente
function detectCodeType(content) {
  const trimmed = content.trim().toLowerCase();
  if (trimmed.includes('<style>') && trimmed.includes('<script>')) return 'js'; // Mix = JS
  if (trimmed.includes('{') && trimmed.includes('}')) return 'css';
  if (trimmed.includes('function') || trimmed.includes('$(')) return 'js';
  return trimmed.includes(':') ? 'css' : 'js';
}

const detectedType = detectCodeType(codeContent);
console.log('📄 Tipo detectado:', detectedType);

// 2. Criar objeto código
const newCode = {
  id: Date.now().toString(36) + Math.random().toString(36).substr(2),
  name: 'Fix Carrinho Plugoo',
  content: codeContent,
  type: detectedType,
  location: detectedType === 'css' ? 'head' : 'footer',
  pages: 'all',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  active: true
};

console.log('📦 Código criado:', newCode);

// 3. Gerar filename e URL
const filename = `${newCode.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${newCode.id}.min.${newCode.type === 'css' ? 'css' : 'js'}`;
const singleLineCode = newCode.type === 'css' ?
  `<link rel="stylesheet" href="https://philling-dev.github.io/loja-integrada-assets/assets/${filename}">` :
  `<script src="https://philling-dev.github.io/loja-integrada-assets/assets/${filename}"></script>`;

console.log('📁 Filename:', filename);
console.log('🔗 Código para Loja Integrada:', singleLineCode);

// 4. Minificar conteúdo
function minifyCode(content, type) {
  if (type === 'css') {
    return content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comentários CSS
      .replace(/\s+/g, ' ') // Remove espaços extras
      .replace(/;\s*}/g, '}') // Remove ponto-e-vírgula antes de }
      .trim();
  } else {
    return content
      .replace(/\/\/.*$/gm, '') // Remove comentários de linha
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comentários de bloco
      .replace(/\s+/g, ' ') // Remove espaços extras
      .trim();
  }
}

const minifiedContent = minifyCode(codeContent, detectedType);
console.log('⚡ Conteúdo minificado:', minifiedContent.substring(0, 100) + '...');
console.log('📊 Tamanho original:', codeContent.length, 'bytes');
console.log('📊 Tamanho minificado:', minifiedContent.length, 'bytes');
console.log('📈 Economia:', Math.round((1 - minifiedContent.length / codeContent.length) * 100) + '%');

// 5. Salvar no localStorage (simular)
const existingCodes = JSON.parse(localStorage.getItem('loja-integrada-codes') || '[]');
existingCodes.push(newCode);
localStorage.setItem('loja-integrada-codes', JSON.stringify(existingCodes));

console.log('💾 Código salvo no localStorage');
console.log('📊 Total de códigos:', existingCodes.length);

// 6. Instruções para o usuário
console.log('\n🚀 PRÓXIMOS PASSOS:');
console.log('1. Refresh a página (Ctrl+F5)');
console.log('2. Vá em "Códigos Individuais"');
console.log('3. O código deve aparecer com conteúdo completo');
console.log('4. Clique em Deploy (☁️) para baixar arquivo minificado');
console.log('5. Upload no GitHub: https://github.com/philling-dev/loja-integrada-assets');
console.log('6. Copie a linha gerada para a Loja Integrada');

console.log('\n✅ TESTE CONCLUÍDO!');

// Retornar dados para debug
return {
  code: newCode,
  filename: filename,
  singleLineCode: singleLineCode,
  minifiedContent: minifiedContent,
  originalSize: codeContent.length,
  minifiedSize: minifiedContent.length,
  savings: Math.round((1 - minifiedContent.length / codeContent.length) * 100) + '%'
};