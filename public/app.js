// API base URL
const API_URL = '/api';

// Cache local para respostas (usado nos relatórios)
let respostasCache = [];

// Funções da API
async function getRespostas() {
    try {
        const response = await fetch(`${API_URL}/respostas`);
        if (!response.ok) throw new Error('Erro ao buscar respostas');
        respostasCache = await response.json();
        return respostasCache;
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

async function salvarResposta(dados) {
    try {
        const response = await fetch(`${API_URL}/respostas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) throw new Error('Erro ao salvar resposta');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

async function limparTodasRespostas() {
    try {
        const response = await fetch(`${API_URL}/respostas`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Erro ao limpar respostas');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// Coletar dados do formulário
function coletarDadosFormulario(form) {
    const formData = new FormData(form);
    const dados = {};

    // Questão 11 - Radio simples
    dados.q11 = formData.get('q11');

    // Questão 12 - Checkboxes múltiplos
    dados.q12 = formData.getAll('q12');

    // Questão 13 - Radio com campo "outro"
    dados.q13 = formData.get('q13');
    if (dados.q13 === 'Outro') {
        const outro = formData.get('q13_outro');
        if (outro) {
            dados.q13 = `Outro: ${outro}`;
        }
    }

    // Questão 14 - Duas perguntas radio
    dados.q14_dialogo = formData.get('q14_dialogo');
    dados.q14_formato = formData.get('q14_formato');

    // Questão 15 - Checkboxes com campo "outra"
    dados.q15 = formData.getAll('q15');
    const outra15 = formData.get('q15_outra');
    if (dados.q15.includes('Outra') && outra15) {
        const index = dados.q15.indexOf('Outra');
        dados.q15[index] = `Outra: ${outra15}`;
    }

    // Questão 16 - Tabela de avaliação
    dados.q16 = {
        estrutura: formData.get('q16_estrutura'),
        vinculo: formData.get('q16_vinculo'),
        carga: formData.get('q16_carga'),
        fluxo: formData.get('q16_fluxo'),
        sistematizacao: formData.get('q16_sistematizacao')
    };

    return dados;
}

// Event listener para o formulário
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pesquisaForm');

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;

            try {
                const dados = coletarDadosFormulario(form);
                await salvarResposta(dados);

                // Mostrar mensagem de sucesso
                const successMsg = document.getElementById('successMessage');
                successMsg.style.display = 'block';

                // Limpar formulário
                form.reset();

                // Esconder mensagem após 3 segundos
                setTimeout(() => {
                    successMsg.style.display = 'none';
                }, 3000);

                // Scroll para o topo
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
                alert('Erro ao enviar resposta. Tente novamente.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Funções para relatórios
function contarRespostas(respostas, campo) {
    const contagem = {};

    respostas.forEach(resposta => {
        const valor = resposta[campo];

        if (Array.isArray(valor)) {
            valor.forEach(item => {
                contagem[item] = (contagem[item] || 0) + 1;
            });
        } else if (valor) {
            contagem[valor] = (contagem[valor] || 0) + 1;
        }
    });

    return contagem;
}

function contarRespostasQ16(respostas, subcampo) {
    const contagem = {};

    respostas.forEach(resposta => {
        if (resposta.q16 && resposta.q16[subcampo]) {
            const valor = resposta.q16[subcampo];
            contagem[valor] = (contagem[valor] || 0) + 1;
        }
    });

    return contagem;
}

function gerarGraficoBarras(containerId, dados) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = Object.values(dados).reduce((a, b) => a + b, 0);

    if (total === 0) {
        container.innerHTML = '<div class="no-data">Sem dados para exibir</div>';
        return;
    }

    let html = '<div class="bar-chart">';

    // Ordenar por valor decrescente
    const sortedEntries = Object.entries(dados).sort((a, b) => b[1] - a[1]);

    sortedEntries.forEach(([label, count]) => {
        const percentage = (count / total * 100).toFixed(1);
        const barWidth = Math.max(percentage, 5); // Mínimo de 5% para visibilidade

        html += `
            <div class="bar-item">
                <span class="bar-label">${label}</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${barWidth}%">
                        <span class="bar-value">${count} (${percentage}%)</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

async function exportarCSV() {
    const respostas = await getRespostas();

    if (respostas.length === 0) {
        alert('Não há dados para exportar');
        return;
    }

    // Cabeçalho do CSV
    const headers = [
        'ID',
        'Data Envio',
        'Q11 - Autonomia',
        'Q12 - Instrumentos',
        'Q13 - Viés',
        'Q14 - Diálogo Multidisciplinar',
        'Q14 - Formato Relação',
        'Q15 - Planejamento',
        'Q16 - Estrutura Física',
        'Q16 - Vínculo Empregatício',
        'Q16 - Carga Horária',
        'Q16 - Fluxo de Trabalho',
        'Q16 - Sistematização'
    ];

    // Dados
    const rows = respostas.map(r => [
        r.id,
        r.dataEnvio,
        r.q11 || '',
        (r.q12 || []).join('; '),
        r.q13 || '',
        r.q14_dialogo || '',
        r.q14_formato || '',
        (r.q15 || []).join('; '),
        r.q16?.estrutura || '',
        r.q16?.vinculo || '',
        r.q16?.carga || '',
        r.q16?.fluxo || '',
        r.q16?.sistematizacao || ''
    ]);

    // Criar CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pesquisa_respostas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

async function exportarJSON() {
    const respostas = await getRespostas();

    if (respostas.length === 0) {
        alert('Não há dados para exportar');
        return;
    }

    const blob = new Blob([JSON.stringify(respostas, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pesquisa_respostas_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

async function confirmarLimpeza() {
    if (confirm('Tem certeza que deseja apagar todas as respostas? Esta ação não pode ser desfeita.')) {
        try {
            await limparTodasRespostas();
            location.reload();
        } catch (error) {
            alert('Erro ao limpar dados');
        }
    }
}
