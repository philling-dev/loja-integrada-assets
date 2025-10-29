# Segurança do Sistema

## Sistema de Autenticação

O Dashboard WidgetVPN agora possui um sistema de autenticação implementado para proteger o acesso administrativo.

### Arquivos de Autenticação

- **admin/login.html** - Página de login com interface profissional
- **api/auth.php** - API de autenticação com sessões PHP
- **admin/index.html** - Dashboard protegido com verificação de sessão

### Fluxo de Autenticação

1. Usuário acessa `admin/index.html`
2. Sistema verifica sessão via `api/auth.php?action=check`
3. Se não autenticado, redireciona para `admin/login.html`
4. Após login bem-sucedido, cria sessão e permite acesso
5. Botão "Sair" destrói sessão e retorna ao login

### Credenciais

**IMPORTANTE**: As credenciais estão hardcoded no arquivo `api/auth.php` (linhas 14-17).

```php
$CREDENTIALS = [
    'username' => 'GuilhermeCampos',
    'password' => '*Gui84871431'
];
```

### Segurança Adicional Recomendada

1. **Mover credenciais para variáveis de ambiente**
2. **Implementar rate limiting** para prevenir brute force
3. **Adicionar hash de senha** (bcrypt/argon2)
4. **Implementar 2FA** (autenticação de dois fatores)
5. **Logs de tentativas de login**
6. **Timeout de sessão** após inatividade

### Endpoints da API

- `POST /api/auth.php` - Login (body: `{username, password}`)
- `GET /api/auth.php?action=check` - Verificar autenticação
- `GET /api/auth.php?action=logout` - Logout

### Implementação

- **Data**: 13/10/2025
- **Versão**: v1.3.0
- **Backup**: Tag `backup-safe-pre-login` criada antes da implementação
- **Arquivos modificados**:
  - `admin/login.html` (novo)
  - `api/auth.php` (novo)
  - `admin/index.html` (adicionado verificação + botão logout)

### Teste do Sistema

1. Acesse `admin/index.html` - deve redirecionar para login
2. Faça login com as credenciais
3. Acesse o dashboard normalmente
4. Clique em "Sair" - deve retornar ao login
5. Tente acessar `admin/index.html` novamente - deve redirecionar

### Restauração

Se houver problemas, restaure o backup:

```bash
git reset --hard backup-safe-pre-login
git push origin main --force-with-lease
```
