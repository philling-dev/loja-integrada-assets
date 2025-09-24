const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');

class DevServer {
    constructor() {
        this.port = 8080;
        this.adminDir = path.resolve(__dirname, '../admin');
        this.server = null;
    }

    async start() {
        console.log(chalk.blue('🚀 Iniciando servidor de desenvolvimento...'));

        try {
            // Verificar se admin/index.html existe
            const indexPath = path.join(this.adminDir, 'index.html');
            if (!await fs.pathExists(indexPath)) {
                throw new Error('Arquivo admin/index.html não encontrado!');
            }

            // Criar servidor HTTP simples
            this.server = http.createServer(async (req, res) => {
                await this.handleRequest(req, res);
            });

            // Iniciar servidor
            this.server.listen(this.port, () => {
                console.log(chalk.green(`✅ Servidor rodando em: http://localhost:${this.port}`));
                console.log(chalk.yellow('📁 Servindo arquivos do diretório: admin/'));
                console.log(chalk.gray('   Pressione Ctrl+C para parar'));

                // Abrir no navegador (opcional)
                this.openBrowser();
            });

            // Tratar erros do servidor
            this.server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.error(chalk.red(`❌ Porta ${this.port} já está em uso!`));
                    console.log(chalk.yellow('💡 Tente uma porta diferente ou pare o processo que está usando essa porta.'));
                } else {
                    console.error(chalk.red('❌ Erro no servidor:'), err);
                }
                process.exit(1);
            });

            // Tratar Ctrl+C
            process.on('SIGINT', () => {
                console.log(chalk.yellow('\n🛑 Parando servidor...'));
                this.server.close(() => {
                    console.log(chalk.green('✅ Servidor parado!'));
                    process.exit(0);
                });
            });

        } catch (error) {
            console.error(chalk.red('❌ Erro ao iniciar servidor:'), error.message);
            process.exit(1);
        }
    }

    async handleRequest(req, res) {
        try {
            let filePath = req.url === '/' ? '/index.html' : req.url;

            // Remover query string
            filePath = filePath.split('?')[0];

            // Resolver path completo
            const fullPath = path.join(this.adminDir, filePath);

            // Verificar se arquivo existe
            if (!await fs.pathExists(fullPath)) {
                this.send404(res, filePath);
                return;
            }

            // Verificar se é um arquivo
            const stats = await fs.stat(fullPath);
            if (!stats.isFile()) {
                this.send404(res, filePath);
                return;
            }

            // Determinar content-type
            const contentType = this.getContentType(filePath);

            // Ler e enviar arquivo
            const content = await fs.readFile(fullPath);

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content);

            // Log da requisição
            console.log(chalk.gray(`${new Date().toISOString()} - ${req.method} ${req.url} - 200`));

        } catch (error) {
            console.error(chalk.red('❌ Erro ao processar requisição:'), error);
            this.send500(res);
        }
    }

    getContentType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject'
        };
        return mimeTypes[ext] || 'text/plain';
    }

    send404(res, filePath) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>404 - Não Encontrado</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #e74c3c; }
    </style>
</head>
<body>
    <h1 class="error">404 - Arquivo Não Encontrado</h1>
    <p>O arquivo <code>${filePath}</code> não foi encontrado.</p>
    <a href="/">← Voltar ao início</a>
</body>
</html>`;

        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);

        console.log(chalk.red(`${new Date().toISOString()} - GET ${filePath} - 404`));
    }

    send500(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>500 - Erro do Servidor</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #e74c3c; }
    </style>
</head>
<body>
    <h1 class="error">500 - Erro Interno do Servidor</h1>
    <p>Ocorreu um erro interno no servidor.</p>
    <a href="/">← Voltar ao início</a>
</body>
</html>`;

        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    openBrowser() {
        const url = `http://localhost:${this.port}`;
        const platform = process.platform;

        let command;
        if (platform === 'win32') {
            command = 'start';
        } else if (platform === 'darwin') {
            command = 'open';
        } else {
            command = 'xdg-open';
        }

        try {
            spawn(command, [url], { detached: true, stdio: 'ignore' });
        } catch (error) {
            console.log(chalk.yellow(`💡 Abra manualmente: ${url}`));
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const server = new DevServer();
    server.start();
}

module.exports = DevServer;