const { exec } = require('child_process');
const chalk = require('chalk');
const BuildSystem = require('./build.js');

class DeploySystem {
    constructor() {
        this.builder = new BuildSystem();
    }

    async deploy(commitMessage = 'Update assets') {
        console.log(chalk.blue('🚀 Iniciando processo de deploy...'));

        try {
            // 1. Build dos assets
            console.log(chalk.yellow('📦 Executando build...'));
            await this.builder.build();

            // 2. Commit e push
            console.log(chalk.yellow('📤 Fazendo commit e push...'));
            await this.gitCommitAndPush(commitMessage);

            // 3. Sucesso
            console.log(chalk.green('✅ Deploy concluído com sucesso!'));
            console.log(chalk.blue('🌐 GitHub Pages será atualizado em alguns minutos...'));
            console.log(chalk.gray('   URL: https://philling-dev.github.io/loja-integrada-assets/'));

        } catch (error) {
            console.error(chalk.red('❌ Erro durante o deploy:'), error);
            process.exit(1);
        }
    }

    async gitCommitAndPush(message) {
        return new Promise((resolve, reject) => {
            const commands = [
                'git add .',
                `git commit -m "${message}

🔄 Assets atualizados automaticamente
⚡ Minificação CSS/JS aplicada
🌐 Pronto para GitHub Pages"`,
                'git push origin main'
            ];

            const executeCommand = (cmd, callback) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error && !error.message.includes('nothing to commit')) {
                        console.error(chalk.red(`Erro executando: ${cmd}`));
                        console.error(stderr);
                        callback(error);
                        return;
                    }
                    if (stdout) console.log(chalk.gray(stdout.trim()));
                    callback(null);
                });
            };

            let currentCommand = 0;
            const executeNext = () => {
                if (currentCommand >= commands.length) {
                    resolve();
                    return;
                }

                executeCommand(commands[currentCommand], (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    currentCommand++;
                    executeNext();
                });
            };

            executeNext();
        });
    }

    async checkGitStatus() {
        return new Promise((resolve) => {
            exec('git status --porcelain', (error, stdout) => {
                if (error) {
                    resolve(false);
                    return;
                }
                resolve(stdout.trim().length > 0);
            });
        });
    }
}

// CLI Usage
if (require.main === module) {
    const deployer = new DeploySystem();
    const commitMessage = process.argv[2] || 'Update Loja Integrada assets';

    deployer.deploy(commitMessage).catch((error) => {
        console.error(chalk.red('Deploy failed:'), error);
        process.exit(1);
    });
}

module.exports = DeploySystem;