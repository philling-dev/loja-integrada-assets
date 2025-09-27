#!/bin/bash

# 🛡️ SCRIPT DE VALIDAÇÃO DO SISTEMA v2.0
# Dashboard Admin WidgetVPN
# DEVE ser executado ANTES de qualquer backup

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 VALIDAÇÃO DO SISTEMA - Dashboard Admin WidgetVPN${NC}"
echo -e "${BLUE}📅 $(date)${NC}"
echo ""

# Contador de testes
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=6

# Array para armazenar falhas
FAILURES=()

# Função para teste com resultado
test_result() {
    local test_name="$1"
    local command="$2"
    local expected="$3"

    echo -ne "${YELLOW}⏳ Testando: $test_name...${NC}"

    if result=$(eval "$command" 2>/dev/null); then
        if [[ "$result" == *"$expected"* ]] || [[ -z "$expected" ]]; then
            echo -e " ${GREEN}✅ PASSOU${NC}"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e " ${RED}❌ FALHOU${NC} (resultado: $result)"
            FAILURES+=("$test_name: Resultado inesperado '$result'")
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e " ${RED}❌ FALHOU${NC} (erro de execução)"
        FAILURES+=("$test_name: Erro de execução")
        ((TESTS_FAILED++))
        return 1
    fi
}

echo -e "${BLUE}🧪 EXECUTANDO TESTES DE VALIDAÇÃO...${NC}"
echo ""

# Teste 1: Verificar se o arquivo principal existe
test_result "Arquivo index.html existe" \
    "test -f admin/index.html && echo 'existe'" \
    "existe"

# Teste 2: Verificar se tem o tamanho correto (> 1000 linhas = funcional)
test_result "Arquivo index.html com tamanho adequado" \
    "wc -l admin/index.html | awk '{if(\$1 > 1000) print \"ok\"; else print \"pequeno\"}'" \
    "ok"

# Teste 3: Verificar conectividade com GitHub Pages
test_result "Conectividade GitHub Pages" \
    "curl -s -o /dev/null -w \"%{http_code}\" \"https://philling-dev.github.io/loja-integrada-assets/assets/index.json\"" \
    "200"

# Teste 4: Verificar conectividade e resposta básica do GitHub Pages
test_result "GitHub Pages respondendo com dados" \
    "curl -s \"https://philling-dev.github.io/loja-integrada-assets/assets/index.json\" | grep -q '\"id\"' && echo 'ok' || echo 'erro'" \
    "ok"

# Teste 5: Verificar API Analytics
test_result "API Analytics funcional" \
    "env REQUEST_METHOD=GET php api/analytics.php 2>/dev/null | grep -q '\"total\"' && echo 'ok' || echo 'erro'" \
    "ok"

# Teste 6: Verificar estrutura de diretórios críticos
test_result "Estrutura de diretórios" \
    "test -d admin && test -d api && test -d scripts && echo 'ok'" \
    "ok"

echo ""
echo -e "${BLUE}📊 RELATÓRIO DE VALIDAÇÃO${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ SISTEMA VALIDADO COM SUCESSO!${NC}"
    echo -e "${GREEN}📊 Testes: $TESTS_PASSED/$TOTAL_TESTS passaram${NC}"
    echo ""
    echo -e "${GREEN}🛡️ SISTEMA APTO PARA BACKUP${NC}"
    echo -e "${BLUE}🔄 Você pode executar: npm run backup:dual${NC}"
    echo ""

    # Registrar validação no log
    echo "$(date): Sistema validado com sucesso - $TESTS_PASSED/$TOTAL_TESTS testes passaram" >> logs/validation.log

    exit 0
else
    echo -e "${RED}❌ SISTEMA COM PROBLEMAS!${NC}"
    echo -e "${RED}📊 Testes: $TESTS_PASSED/$TOTAL_TESTS passaram, $TESTS_FAILED falharam${NC}"
    echo ""
    echo -e "${RED}🚨 FALHAS DETECTADAS:${NC}"
    for failure in "${FAILURES[@]}"; do
        echo -e "${RED}   • $failure${NC}"
    done
    echo ""
    echo -e "${RED}⛔ SISTEMA NÃO APTO PARA BACKUP${NC}"
    echo -e "${YELLOW}🔧 Corrija os problemas antes de fazer backup${NC}"
    echo ""

    # Registrar falha no log
    echo "$(date): Sistema com falhas - $TESTS_FAILED/$TOTAL_TESTS testes falharam" >> logs/validation.log

    exit 1
fi