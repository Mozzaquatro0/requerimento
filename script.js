// ==========================================================================
// 1. CARREGAMENTO INICIAL E RECUPERAÇÃO DE RASCUNHO (LOCALSTORAGE)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Lista de todos os IDs de campos que serão monitorados e salvos
    const campos = ["nomeCompleto", "nomeGuerra", "idt", "cpf", "graduacao", "subunidade", "numInfo", "secaoInfo", "numEB", "funcao", "comportamento", "dataNascimento", "taf", "pgCmtRegimento", "nomeCmtRegimento", "pgCmtEsqd", "nomeCmtEsqd"];


    
    // Varre a lista, recupera o rascunho anterior e adiciona o evento de salvar ao digitar
    campos.forEach(id => {
        const valorSalvo = localStorage.getItem(id);
        const elemento = document.getElementById(id);
        if (valorSalvo && elemento) { elemento.value = valorSalvo; }
        if (elemento) {
            elemento.addEventListener("input", () => localStorage.setItem(id, elemento.value));
            elemento.addEventListener("change", () => localStorage.setItem(id, elemento.value));
        }
        
		// Calcula automaticamente o dia 1º de Março do próximo ano
		const anoAtual = new Date().getFullYear();
		const proximoAno = anoAtual + 1;
		// Formato técnico interno para o motor do sistema (YYYY-MM-DD)
		const dataCalculadaTecnica = `${proximoAno}-03-01`; 

		// Exibe a data formatada de forma amigável no input travado da tela
		document.getElementById("dataInicioReen").value = `01/03/${proximoAno}`;

    });

    // Restaura o estado específico do checkbox de militar técnico e gera o input correspondente
    const isTecnicoSalvo = localStorage.getItem("isTecnico") === "true";
    const chk = document.getElementById("isTecnico");
    if (chk) {
        chk.checked = isTecnicoSalvo;
        toggleTipoPraca();
        
        // Pequeno atraso para garantir que o container HTML foi criado antes de injetar o valor
        setTimeout(() => {
            if (isTecnicoSalvo) {
                const dt = document.getElementById("dataPracaCompleta");
                if (dt && localStorage.getItem("dataPracaCompleta")) dt.value = localStorage.getItem("dataPracaCompleta");
            } else {
                const ano = document.getElementById("anoPraca");
                if (ano && localStorage.getItem("anoPraca")) ano.value = localStorage.getItem("anoPraca");
            }
        }, 100);
    }
});

// Captura as alterações nos inputs de praça que são gerados de forma dinâmica na tela
document.addEventListener("change", (e) => {
    if (e.target.id === "dataPracaCompleta" || e.target.id === "anoPraca") localStorage.setItem(e.target.id, e.target.value);
});
document.addEventListener("input", (e) => {
    if (e.target.id === "dataPracaCompleta" || e.target.id === "anoPraca") localStorage.setItem(e.target.id, e.target.value);
});

// ==========================================================================
// 2. MÁSCARAS DE ENTRADA DE DADOS EM TEMPO REAL
// ==========================================================================
document.getElementById('cpf').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove letras
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

document.getElementById('idt').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove letras
    if (value.length > 10) value = value.slice(0, 10);
    value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1})$/, '$1-$2');
    e.target.value = value;
});

// ==========================================================================
// 3. CONTROLE DOS MODAIS DE TUTORIAIS INTERNOS
// ==========================================================================
function abrirModal(idModal) { document.getElementById(idModal).style.display = "flex"; }
function fecharModal(idModal) { document.getElementById(idModal).style.display = "none"; }
function fecharModalComCliqueFora(event, idModal) { if (event.target.id === idModal) fecharModal(idModal); }

// Altera a interface entre Ano de Incorporação (Combatente) ou Calendário Completo (Técnico)
function toggleTipoPraca() {
    const isTecnico = document.getElementById("isTecnico").checked;
    const containerPraca = document.getElementById("containerDataPraca");
    const containerVigencia = document.getElementById("containerVigencia");
    const anoAtual = new Date().getFullYear();
    const proximoAno = anoAtual + 1;
    
    localStorage.setItem("isTecnico", isTecnico);
    
    if (isTecnico) {
        containerPraca.innerHTML = '<input type="date" id="dataPracaCompleta" onchange="calcularReengajamentoTecnico()" required>';
        // Mantém como tipo text para podermos exibir no formato correto DD/MM/AAAA sem travar
        containerVigencia.innerHTML = `
            <label>Início do Engajamento/Reengajamento (Azul 🔵):</label>
            <input type="text" id="dataInicioReen" placeholder="Selecione a data de praça acima" style="background-color: #e9ecef; font-weight: bold; color: #1e4620;" disabled>`;
    } else {
        containerPraca.innerHTML = '<input type="number" id="anoPraca" min="1950" max="2030" placeholder="Ano de Incorporação (Fixo 1º Março)" required>';
        containerVigencia.innerHTML = `
            <label>Início do Engajamento/Reengajamento (Azul 🔵):</label>
            <input type="text" id="dataInicioReen" value="01/03/${proximoAno}" style="background-color: #e9ecef; font-weight: bold; color: #1e4620;" disabled>`;
    }
}

function calcularReengajamentoTecnico() {
    const dataPraca = document.getElementById("dataPracaCompleta").value; // Recebe o formato nativo YYYY-MM-DD
    if (!dataPraca) return;
    
    // partes[0] = Ano (YYYY), partes[1] = Mês (MM), partes[2] = Dia (DD)
    const partes = dataPraca.split("-");
    const proximoAno = new Date().getFullYear() + 1;
    
    // MONTAGEM CORRETA: Dia / Mês / Ano
    const dataExibicaoBR = `${partes[2]}/${partes[1]}/${proximoAno}`;
    
    const campoVigencia = document.getElementById("dataInicioReen");
    if (campoVigencia) {
        campoVigencia.value = dataExibicaoBR;
        // Salva a estrutura técnica em segundo plano para o motor de tradução por extenso
        localStorage.setItem("dataInicioReen_Tecnico", `${proximoAno}-${partes[1]}-${partes[2]}`);
    }
}

function ajustarFonteAssinatura(nomeCmt, pgCmt) {
    const box = document.getElementById("assinaturaCmtBox");
    if (!box) return;

    // Monta a string limpa idêntica ao regulamento militar
    const textoCompletoAssinatura = `${nomeCmt.toUpperCase()} – ${pgCmt}`;
    box.innerText = textoCompletoAssinatura;

    // Torna o documento temporariamente visível para o cálculo preciso de pixels
    const documento = document.getElementById("documentoPronto");
    const estadoOriginalDisplay = documento.style.display;
    documento.style.display = "block";

    // Reseta o tamanho para o padrão inicial regulamentar
    box.style.fontSize = "10.5pt";

    // Mede a largura interna útil exata do quadrado de despacho, descontando as margens e paddings
    const quadroPai = box.parentElement.parentElement;
    const estilosQuadro = window.getComputedStyle(quadroPai);
    const paddingEsquerdo = parseFloat(estilosQuadro.paddingLeft);
    const paddingDireito = parseFloat(estilosQuadro.paddingRight);
    
    // Espaço real de escrita útil dentro do quadrado preto
    const larguraMaximaPermitida = quadroPai.clientWidth - paddingEsquerdo - paddingDireito - 6; 

    let tamanhoAtual = 10.5;

    // Reduz o tamanho de forma agressiva enquanto o texto for maior que o espaço físico permitido
    while (box.scrollWidth > larguraMaximaPermitida && tamanhoAtual > 6.5) {
        tamanhoAtual -= 0.2; // Encolhe milimetricamente até caber com segurança nas bordas
        box.style.fontSize = `${tamanhoAtual}pt`;
    }

    // Devolve o documento ao seu estado original oculto antes do comando window.print
    documento.style.display = estadoOriginalDisplay;
}




// ==========================================================================
// 4. MOTO DE PROCESSAMENTO E FORMATAÇÃO DE TEXTO MILITAR
// ==========================================================================

// Destaca com a tag strong apenas os pedaços/iniciais que compõem o Nome de Guerra
function gerarNomeComDestaque(nomeCompleto, nomeGuerra) {
    let nomeCompUpper = nomeCompleto.toUpperCase();
    const nomeGuerraUpper = nomeGuerra.toUpperCase();
    const partesGuerra = nomeGuerraUpper.split(/\s+/).filter(part => part.length > 0);
    
    // Se digitou o nome de guerra contínuo e ele existe na mesma ordem, substitui direto
    if (nomeCompUpper.includes(nomeGuerraUpper) && nomeGuerraUpper.length > 0) {
        return nomeCompUpper.replace(nomeGuerraUpper, `<span class="nome-guerra-negrito">${nomeGuerraUpper}</span>`);
    }
    
    // Caso contrário (Ex: "W MOZZAQUATRO"), varre palavra por palavra do nome completo
    const partesCompleto = nomeCompUpper.split(/\s+/);
    const resultado = partesCompleto.map(palavra => {
        const corresponde = partesGuerra.some(part => {
            if (part.length === 1) return palavra.startsWith(part); // Destaca a inicial se coincidir
            return palavra === part; // Destaca o sobrenome completo
        });
        if (corresponde) {
            const partLetra = partesGuerra.find(part => part.length === 1 && palavra.startsWith(part));
            if (partLetra) return `<span class="nome-guerra-negrito">${palavra.charAt(0)}</span>${palavra.slice(1)}`;
            return `<span class="nome-guerra-negrito">${palavra}</span>`;
        }
        return palavra;
    });
    return resultado.join(" ");
}

// Converte datas padrões (YYYY-MM-DD) em formato literal com tratamento ordinal para o dia 1º e zero à esquerda para dias menores que 10
function formatarDataPorExtenso(dataStr) {
    if(!dataStr) return "";
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const partes = dataStr.split("-"); // O input tipo data retorna YYYY-MM-DD
    
    let diaNum = parseInt(partes[2], 10);
    const mes = meses[parseInt(partes[1], 10) - 1];
    const ano = partes[0];
    
    // Regra 1: Se o dia for exatamente 1, aplica o formato ordinal "1º"
    if (diaNum === 1) {
        return `1º de ${mes} de ${ano}`;
    }
    
    // Regra 2: Se o dia for menor que 10 (de 2 a 9), acrescenta o "0" na frente
    let diaStr = diaNum.toString();
    if (diaNum < 10) {
        diaStr = `0${diaNum}`;
    }
    
    // Retorna o formato final para os demais dias (Ex: 02 de março, 27 de fevereiro)
    return `${diaStr} de ${mes} de ${ano}`;
}



// ==========================================================================
// 5. GATILHO DO BOTÃO GERAR E DISPARO DA TELA DE IMPRESSÃO
// ==========================================================================
function gerarRequerimento(event) {
    event.preventDefault(); // Evita que a página recarregue ao enviar o formulário

    // Captura os valores de todos os inputs
    const nomeCompleto = document.getElementById("nomeCompleto").value;
    const nomeGuerra = document.getElementById("nomeGuerra").value;
    const graduacao = document.getElementById("graduacao").value;
    const idt = document.getElementById("idt").value;
    const cpf = document.getElementById("cpf").value;
    const subunidade = document.getElementById("subunidade").value;
    const funcao = document.getElementById("funcao").value;
    // Obtém o ano calculado dinamicamente com base no ano corrente
const anoVigenciaCalculado = new Date().getFullYear() + 1;
const dataInicioReen = `${anoVigenciaCalculado}-03-01`; // Passa o formato YYYY-MM-DD para a função de extenso

    const numInfo = document.getElementById("numInfo").value;
    const secaoInfo = document.getElementById("secaoInfo").value;
    const numEB = document.getElementById("numEB").value;
    const comportamento = document.getElementById("comportamento").value;
    const dataNascimento = document.getElementById("dataNascimento").value;
    const taf = document.getElementById("taf").value;
    const dependentes = document.getElementById("dependentes").value;
	const subJudice = document.getElementById("subJudice").value;
	const existeVaga = document.getElementById("existeVaga").value;
	const pgCmtRegimento = document.getElementById("pgCmtRegimento").value;
	const nomeCmtRegimento = document.getElementById("nomeCmtRegimento").value;
	const pgCmtEsqd = document.getElementById("pgCmtEsqd").value;
	const nomeCmtEsqd = document.getElementById("nomeCmtEsqd").value;
	// Define dinamicamente se é Engajamento ou Reengajamento com base na Graduação
    let termoEngajamento = "Reengajamento";
    if (graduacao === "Soldado EV") {
        termoEngajamento = "Engajamento";
    }
    const termoEngajamentoMinusculo = termoEngajamento.toLowerCase();



    // Processa a regra da Data de Praça (🟡 Amarelo)
        // Processamento da Data de Praça (Amarelo 🟡) para o papel de impressão
    let dataPracaFormatada = "";
    if (document.getElementById("isTecnico").checked) {
        const dtCompleta = document.getElementById("dataPracaCompleta").value; // Recebe YYYY-MM-DD
        if(dtCompleta) {
            const p = dtCompleta.split("-");
            // Inverte as posições do array de forma fixa: p[2] (Dia) / p[1] (Mês) / p[0] (Ano)
            dataPracaFormatada = `${p[2]}/${p[1]}/${p[0]}`; 
        }
    } else {
        dataPracaFormatada = `01/03/${document.getElementById("anoPraca").value}`;
    }


    // Processa e gera a Data Atual por Extenso (🍷 Vinho)
    const hoje = new Date();
    const dataHojeStr = `${hoje.getDate()} de ${["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][hoje.getMonth()]} de ${hoje.getFullYear()}`;

    // Processa a regra do Nome com destaque no Nome de Guerra
    const nomeComDestaqueHtml = gerarNomeComDestaque(nomeCompleto, nomeGuerra);

    // Injeta os dados formatados nas classes correspondentes do espelho de impressão A4
    document.querySelectorAll(".print-nome-destaque").forEach(el => el.innerHTML = nomeComDestaqueHtml);
    document.querySelectorAll(".print-nome-guerra-topo").forEach(el => el.innerText = nomeGuerra.toUpperCase());
    
    document.querySelectorAll(".print-grad").forEach(el => el.innerText = graduacao);
    document.querySelectorAll(".print-grad-caps").forEach(el => el.innerText = graduacao.toUpperCase());
    document.querySelectorAll(".print-idt").forEach(el => el.innerText = idt);
    document.querySelectorAll(".print-cpf").forEach(el => el.innerText = cpf);
    document.querySelectorAll(".print-su").forEach(el => el.innerText = subunidade.toUpperCase());
    document.querySelectorAll(".print-funcao").forEach(el => el.innerText = funcao);
    document.querySelectorAll(".print-info").forEach(el => el.innerText = numInfo);
    document.querySelectorAll(".print-secao").forEach(el => el.innerText = secaoInfo.toUpperCase());
    document.querySelectorAll(".print-eb").forEach(el => el.innerText = numEB);
    document.querySelectorAll(".print-comportamento").forEach(el => el.innerText = comportamento);
    document.querySelectorAll(".print-taf-val").forEach(el => el.innerText = taf.toUpperCase());
    
    document.querySelectorAll(".print-data-corrente").forEach(el => el.innerText = dataHojeStr);
    document.querySelectorAll(".print-data-vigencia").forEach(el => el.innerText = formatarDataPorExtenso(dataInicioReen));
    document.querySelectorAll(".print-data-incorporacao").forEach(el => el.innerText = dataPracaFormatada);
    document.querySelectorAll(".print-nasc").forEach(el => el.innerText = formatarDataPorExtenso(dataNascimento));
    document.querySelectorAll(".print-subjudice").forEach(el => el.innerText = subJudice);
	document.querySelectorAll(".print-vaga").forEach(el => el.innerText = existeVaga);
	document.querySelectorAll(".print-dependentes").forEach(el => el.innerText = dependentes);
	document.querySelectorAll(".print-pg-cmt-reg").forEach(el => el.innerText = pgCmtRegimento);
	document.querySelectorAll(".print-nome-cmt-reg").forEach(el => el.innerText = nomeCmtRegimento.toUpperCase());
	document.querySelectorAll(".print-pg-cmt-esqd").forEach(el => el.innerText = pgCmtEsqd);
	document.querySelectorAll(".print-nome-cmt-esqd").forEach(el => el.innerText = nomeCmtEsqd.toUpperCase());
	    // ... todas as suas linhas de document.querySelectorAll().forEach ...
    document.querySelectorAll(".print-nasc").forEach(el => el.innerText = formatarDataPorExtenso(dataNascimento));
    ajustarFonteAssinatura(nomeCmtRegimento, pgCmtRegimento);
    
    document.querySelectorAll(".print-termo-eng").forEach(el => el.innerText = termoEngajamento);
    document.querySelectorAll(".print-termo-eng-minusculo").forEach(el => el.innerText = termoEngajamentoMinusculo);
    









    // Abre a tela nativa do aparelho para salvar como PDF ou mandar para a impressora
    window.print();
}
