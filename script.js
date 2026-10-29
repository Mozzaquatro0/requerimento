/* ==========================================================================
   1. CARREGAMENTO INICIAL E RECUPERAÇÃO DE RASCUNHO (LOCALSTORAGE)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {

    // Lista COMPLETA de campos monitorados (inclui dependentes, subJudice, existeVaga)
    const campos = [
        "nomeCompleto", "nomeGuerra", "idt", "cpf", "graduacao", "subunidade",
        "numInfo", "secaoInfo", "numEB", "funcao", "comportamento",
        "dataNascimento", "taf", "dependentes", "subJudice", "existeVaga",
        "pgCmtRegimento", "nomeCmtRegimento", "pgCmtEsqd", "nomeCmtEsqd"
    ];

    campos.forEach(id => {
        const valorSalvo = localStorage.getItem(id);
        const elemento = document.getElementById(id);
        if (valorSalvo && elemento) elemento.value = valorSalvo;
        if (elemento) {
            elemento.addEventListener("input",  () => localStorage.setItem(id, elemento.value));
            elemento.addEventListener("change", () => localStorage.setItem(id, elemento.value));
        }
        
		// ============================================================================
		// VALIDAÇÃO EM TEMPO REAL — feedback visual nos campos
		// ============================================================================
		const regrasTempoReal = {
			cpf: {
				regex: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
				extra: (v) => validarCPF(v),
				msg: "CPF inválido"
			},
			idt: {
				regex: /^\d{3}\.\d{3}\.\d{3}-\d{1}$/,
				msg: "Idt inválida"
			},
			numEB: {
				regex: /^\d{5}\.\d{6}\/\d{4}-\d{2}$/,
				msg: "NUP inválido"
			},
			nomeCompleto: {
				extra: (v) => v.length >= 10 && v === v.toUpperCase() && /^[A-ZÀ-Ú\s]+$/.test(v),
				msg: "Nome completo em MAIÚSCULAS (mín. 10 letras)"
			},
			nomeGuerra: {
				extra: (v) => v.length >= 2 && v === v.toUpperCase(),
				msg: "Nome de guerra em MAIÚSCULAS"
			}
		};

Object.keys(regrasTempoReal).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const regra = regrasTempoReal[id];

    const validar = () => {
        const v = el.value.trim();
        if (v === "") {
            el.classList.remove("campo-valido", "campo-invalido");
            return;
        }
        let ok = true;
        if (regra.regex) ok = ok && regra.regex.test(v);
        if (regra.extra) ok = ok && regra.extra(v);
        el.classList.toggle("campo-valido", ok);
        el.classList.toggle("campo-invalido", !ok);
        el.title = ok ? "" : regra.msg;
    };

    el.addEventListener("input", validar);
    el.addEventListener("blur", validar);
});
    });

    // Vigência padrão (não-técnico): 01/03 do próximo ano
    const proximoAno = new Date().getFullYear() + 1;
    const campoVig = document.getElementById("dataInicioReen");
    if (campoVig) campoVig.value = `01/03/${proximoAno}`;

    // Restaura o estado do checkbox de militar técnico
    const isTecnicoSalvo = localStorage.getItem("isTecnico") === "true";
    const chk = document.getElementById("isTecnico");
    if (chk) {
        chk.checked = isTecnicoSalvo;
        toggleTipoPraca();

        setTimeout(() => {
            if (isTecnicoSalvo) {
                const dt = document.getElementById("dataPracaCompleta");
                const salvo = localStorage.getItem("dataPracaCompleta");
                if (dt && salvo) dt.value = salvo;
                calcularReengajamentoTecnico();
            } else {
                const ano = document.getElementById("anoPraca");
                const salvo = localStorage.getItem("anoPraca");
                if (ano && salvo) ano.value = salvo;
            }
        }, 50);
    }
});

// Persistência de campos dinâmicos (praça)
document.addEventListener("change", (e) => {
    if (e.target.id === "dataPracaCompleta" || e.target.id === "anoPraca") {
        localStorage.setItem(e.target.id, e.target.value);
    }
});
document.addEventListener("input", (e) => {
    if (e.target.id === "dataPracaCompleta" || e.target.id === "anoPraca") {
        localStorage.setItem(e.target.id, e.target.value);
    }
});

/* ==========================================================================
   2. MÁSCARAS DE ENTRADA EM TEMPO REAL
   ========================================================================== */
document.getElementById('cpf').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

document.getElementById('idt').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    value = value
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1})$/, '$1-$2');
    e.target.value = value;
});

document.getElementById('numEB').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // remove tudo que não é dígito
    if (value.length > 17) value = value.slice(0, 17); // 5 + 6 + 4 + 2 = 17 dígitos

    let formatado = '';

    if (value.length > 0)  formatado += value.substring(0, 5);                       // 64664
    if (value.length > 5)  formatado += '.' + value.substring(5, 11);                // .000942
    if (value.length > 11) formatado += '/' + value.substring(11, 15);               // /2024
    if (value.length > 15) formatado += '-' + value.substring(15, 17);               // -42

    e.target.value = formatado;
});

/* ==========================================================================
   VALIDAÇÃO DE CPF (dígito verificador)
   ========================================================================== */
function validarCPF(cpfFormatado) {
    const cpf = cpfFormatado.replace(/\D/g, "");
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // todos dígitos iguais

    // Valida 1º dígito
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    // Valida 2º dígito
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[10])) return false;

    return true;
}

/* ==========================================================================
   3. MODAIS
   ========================================================================== */
function abrirModal(idModal) {
    document.getElementById(idModal).style.display = "flex";
}
function fecharModal(idModal) {
    document.getElementById(idModal).style.display = "none";
}
function fecharModalComCliqueFora(event, idModal) {
    if (event.target.id === idModal) fecharModal(idModal);
}

/* ==========================================================================
   4. TIPO DE PRAÇA (Combatente × Técnico)
   ========================================================================== */
function toggleTipoPraca() {
    const isTecnico     = document.getElementById("isTecnico").checked;
    const containerPraca = document.getElementById("containerDataPraca");
    const campoVig       = document.getElementById("dataInicioReen");
    const proximoAno     = new Date().getFullYear() + 1;

    localStorage.setItem("isTecnico", isTecnico);

    if (isTecnico) {
        containerPraca.innerHTML =
            '<input type="date" id="dataPracaCompleta" required>';
        const dt = document.getElementById("dataPracaCompleta");
        const salvo = localStorage.getItem("dataPracaCompleta");
        if (dt && salvo) dt.value = salvo;

        if (campoVig) {
            const tecSalvo = localStorage.getItem("dataInicioReen_Tecnico");
            if (tecSalvo) {
                const p = tecSalvo.split("-");
                campoVig.value = `${p[2]}/${p[1]}/${p[0]}`;
            } else {
                campoVig.value = "";
            }
        }
        calcularReengajamentoTecnico();
    } else {
        containerPraca.innerHTML =
            '<input type="number" id="anoPraca" min="1950" max="2030" placeholder="Ano de Incorporação (Fixo 1º Março)" required>';
        const ano = document.getElementById("anoPraca");
        const salvo = localStorage.getItem("anoPraca");
        if (ano && salvo) ano.value = salvo;

        if (campoVig) campoVig.value = `01/03/${proximoAno}`;
    }
}

function calcularReengajamentoTecnico() {
    const campoData = document.getElementById("dataPracaCompleta");
    if (!campoData || !campoData.value) return;

    const partes = campoData.value.split("-"); // YYYY-MM-DD
    if (partes.length !== 3) return;

    const proximoAno = new Date().getFullYear() + 1;
    const dataExibicaoBR = `${partes[2]}/${partes[1]}/${proximoAno}`;

    const campoVig = document.getElementById("dataInicioReen");
    if (campoVig) campoVig.value = dataExibicaoBR;

    localStorage.setItem(
        "dataInicioReen_Tecnico",
        `${proximoAno}-${partes[1]}-${partes[2]}`
    );
}

/* ==========================================================================
   5. AJUSTE DE FONTE DA ASSINATURA DO CMT DO REGIMENTO
   ========================================================================== */
function ajustarFonteAssinatura(nomeCmt, pgCmt) {
    const box = document.getElementById("assinaturaCmtBox");
    if (!box) return;

    box.textContent = `${(nomeCmt || "").toUpperCase()} – ${pgCmt || ""}`;

    const documento = document.getElementById("documentoPronto");
    const displayOriginal = documento.style.display;

    // Torna visível temporariamente para medir
    documento.style.display = "block";
    box.style.fontSize = "10.5pt";

    // Mede largura útil do quadro-despacho
    const quadro = box.closest(".quadro-despacho");
    let larguraUtil = 100;
    if (quadro) {
        const estilos = window.getComputedStyle(quadro);
        larguraUtil = quadro.clientWidth
            - parseFloat(estilos.paddingLeft || 0)
            - parseFloat(estilos.paddingRight || 0)
            - 4;
    }

    let tamanho = 10.5;
    let seguranca = 0;
    while (box.scrollWidth > larguraUtil && tamanho > 6.5 && seguranca < 50) {
        tamanho -= 0.2;
        box.style.fontSize = `${tamanho.toFixed(1)}pt`;
        seguranca++;
    }

    // Restaura display
    documento.style.display = displayOriginal;
}

/* ==========================================================================
   6. HELPERS DE FORMATAÇÃO
   ========================================================================== */

// Destaca o Nome de Guerra dentro do Nome Completo
function gerarNomeComDestaque(nomeCompleto, nomeGuerra) {
    const nomeCompUpper   = (nomeCompleto || "").toUpperCase();
    const nomeGuerraUpper = (nomeGuerra  || "").toUpperCase().trim();
    if (!nomeGuerraUpper) return nomeCompUpper;

    if (nomeCompUpper.includes(nomeGuerraUpper)) {
        return nomeCompUpper.replace(
            nomeGuerraUpper,
            `<span class="nome-guerra-negrito">${nomeGuerraUpper}</span>`
        );
    }

    const partesGuerra = nomeGuerraUpper.split(/\s+/).filter(p => p.length > 0);
    const partesCompleto = nomeCompUpper.split(/\s+/);

    const resultado = partesCompleto.map(palavra => {
        const corresponde = partesGuerra.some(part => {
            if (part.length === 1) return palavra.startsWith(part);
            return palavra === part;
        });
        if (corresponde) {
            const partLetra = partesGuerra.find(
                part => part.length === 1 && palavra.startsWith(part)
            );
            if (partLetra) {
                return `<span class="nome-guerra-negrito">${palavra.charAt(0)}</span>${palavra.slice(1)}`;
            }
            return `<span class="nome-guerra-negrito">${palavra}</span>`;
        }
        return palavra;
    });
    return resultado.join(" ");
}

// Converte YYYY-MM-DD para "1º de março de 2026" / "02 de março de 2026"
function formatarDataPorExtenso(dataStr) {
    if (!dataStr) return "";
    const meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const partes = dataStr.split("-");
    if (partes.length !== 3) return dataStr;

    const diaNum = parseInt(partes[2], 10);
    const mes    = meses[parseInt(partes[1], 10) - 1];
    const ano    = partes[0];

    if (diaNum === 1) return `1º de ${mes} de ${ano}`;

    let diaStr = diaNum.toString();
    if (diaNum < 10) diaStr = `0${diaNum}`;
    return `${diaStr} de ${mes} de ${ano}`;
}

/* ==========================================================================
   7. GERAÇÃO DO DOCUMENTO
   ========================================================================== */
function gerarRequerimento(event) {
    event.preventDefault();

    // ============================================================
    // VALIDAÇÕES — aborta antes de gerar se algo estiver errado
    // ============================================================
    const erros = [];
    const foco = [];

    // helper: verifica e empurra erro
    const exigir = (condicao, campoId, mensagem) => {
        if (!condicao) {
            erros.push(mensagem);
            if (campoId) foco.push(campoId);
        }
    };

    // ---- referências ----
    const nomeCompleto   = document.getElementById("nomeCompleto").value.trim();
    const nomeGuerra     = document.getElementById("nomeGuerra").value.trim();
    const graduacao      = document.getElementById("graduacao").value;
    const idt            = document.getElementById("idt").value.trim();
    const cpf            = document.getElementById("cpf").value.trim();
    const subunidade     = document.getElementById("subunidade").value.trim();
    const funcao         = document.getElementById("funcao").value.trim();
    const numInfo        = document.getElementById("numInfo").value.trim();
    const secaoInfo      = document.getElementById("secaoInfo").value.trim();
    const numEB          = document.getElementById("numEB").value.trim();
    const comportamento  = document.getElementById("comportamento").value;
    const dataNascimento = document.getElementById("dataNascimento").value;
    const taf            = document.getElementById("taf").value.trim();
    const dependentes    = document.getElementById("dependentes").value.trim();
    const subJudice      = document.getElementById("subJudice").value;
    const existeVaga     = document.getElementById("existeVaga").value;
    const pgCmtRegimento = document.getElementById("pgCmtRegimento").value.trim();
    const nomeCmtRegimento = document.getElementById("nomeCmtRegimento").value.trim();
    const pgCmtEsqd      = document.getElementById("pgCmtEsqd").value.trim();
    const nomeCmtEsqd    = document.getElementById("nomeCmtEsqd").value.trim();
    const isTecnico      = document.getElementById("isTecnico").checked;

    // ---- NOME COMPLETO ----
    exigir(nomeCompleto.length >= 10, "nomeCompleto",
        "Nome completo muito curto (mínimo 10 caracteres).");
    exigir(nomeCompleto === nomeCompleto.toUpperCase(), "nomeCompleto",
        "Nome completo deve estar em LETRAS MAIÚSCULAS.");
    exigir(/^[A-ZÀ-Ú\s]+$/.test(nomeCompleto), "nomeCompleto",
        "Nome completo deve conter apenas letras e espaços.");

    // ---- NOME DE GUERRA ----
    exigir(nomeGuerra.length >= 2 && nomeGuerra.length <= 30, "nomeGuerra",
        "Nome de guerra inválido (2 a 30 caracteres).");
    exigir(nomeGuerra === nomeGuerra.toUpperCase(), "nomeGuerra",
        "Nome de guerra deve estar em LETRAS MAIÚSCULAS.");
    // Nome de guerra precisa aparecer no nome completo
    const nomeGuerraLimpo = nomeGuerra.replace(/\s+/g, " ");
    const partes = nomeGuerraLimpo.split(" ");
    const todasNoNome = partes.every(p => nomeCompleto.includes(p));
    exigir(todasNoNome, "nomeGuerra",
        "Nome de guerra deve conter palavras presentes no nome completo.");

    // ---- IDT ----
    exigir(/^\d{3}\.\d{3}\.\d{3}-\d{1}$/.test(idt), "idt",
        "Idt inválida. Formato esperado: 000.000.000-0.");

    // ---- CPF (formato + dígito verificador) ----
    exigir(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf), "cpf",
        "CPF inválido. Formato esperado: 000.000.000-00.");
    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) {
        exigir(validarCPF(cpf), "cpf", "CPF com dígito verificador inválido.");
    }

    // ---- SUBUNIDADE ----
    exigir(subunidade.length >= 2 && subunidade.length <= 30, "subunidade",
        "Subunidade inválida (2 a 30 caracteres).");

    // ---- FUNÇÃO ----
    exigir(funcao.length >= 3 && funcao.length <= 60, "funcao",
        "Função interna inválida (3 a 60 caracteres).");

    // ---- INFO ----
    exigir(/^\d{1,4}$/.test(numInfo), "numInfo",
        "Número da Info deve ser numérico (1 a 4 dígitos).");

    // ---- SEÇÃO ----
    exigir(secaoInfo.length >= 2 && secaoInfo.length <= 20, "secaoInfo",
        "Seção/Fração emissora inválida (2 a 20 caracteres).");

    // ---- NUP ----
    exigir(/^\d{5}\.\d{6}\/\d{4}-\d{2}$/.test(numEB), "numEB",
        "NUP inválido. Formato esperado: 00000.000000/0000-00.");

    // ---- TAF ----
    exigir(taf.length >= 1 && taf.length <= 3, "taf",
        "Menção do TAF inválida (1 a 3 caracteres — ex: B, R, MB).");
    exigir(/^[A-Za-z]+$/.test(taf), "taf",
        "Menção do TAF deve conter apenas letras.");

    // ---- DEPENDENTES ----
    exigir(/^\d{1,2}$/.test(dependentes), "dependentes",
        "Número de dependentes deve ser numérico (0 a 99).");
    if (/^\d+$/.test(dependentes)) {
        const n = parseInt(dependentes, 10);
        exigir(n >= 0 && n <= 20, "dependentes",
            "Número de dependentes deve estar entre 0 e 20.");
    }

    // ---- DATA DE NASCIMENTO ----
    if (!dataNascimento) {
        erros.push("Data de nascimento é obrigatória.");
        foco.push("dataNascimento");
    } else {
        const nasc = new Date(dataNascimento + "T00:00:00");
        const hoje = new Date();
        const idade = Math.floor((hoje - nasc) / (365.25 * 24 * 3600 * 1000));
        exigir(idade >= 17 && idade <= 70, "dataNascimento",
            `Idade inválida (${idade} anos). Militar deve ter entre 17 e 70 anos.`);
    }

    // ---- DATA DE PRAÇA ----
    if (isTecnico) {
        const dtTec = document.getElementById("dataPracaCompleta");
        if (!dtTec || !dtTec.value) {
            erros.push("Data de praça é obrigatória para militar técnico.");
            foco.push("dataPracaCompleta");
        } else {
            const praca = new Date(dtTec.value + "T00:00:00");
            const hoje = new Date();
            exigir(praca <= hoje, "dataPracaCompleta",
                "Data de praça não pode ser no futuro.");
            exigir(praca.getFullYear() >= 1950, "dataPracaCompleta",
                "Data de praça não pode ser anterior a 1950.");
        }
    } else {
        const anoPraca = document.getElementById("anoPraca");
        const ano = parseInt(anoPraca ? anoPraca.value : "", 10);
        exigir(!isNaN(ano) && ano >= 1950 && ano <= new Date().getFullYear(),
            "anoPraca",
            "Ano de incorporação inválido (1950 até o ano atual).");
    }

    // ---- COMANDANTES ----
    exigir(pgCmtRegimento.length >= 3, "pgCmtRegimento",
        "Posto/Grad do Cmt do Regimento inválido.");
    exigir(nomeCmtRegimento.length >= 10, "nomeCmtRegimento",
        "Nome do Cmt do Regimento muito curto (mínimo 10 caracteres).");
    exigir(pgCmtEsqd.length >= 3, "pgCmtEsqd",
        "Posto/Grad do Cmt do Esqd inválido.");
    exigir(nomeCmtEsqd.length >= 10, "nomeCmtEsqd",
        "Nome do Cmt do Esqd muito curto (mínimo 10 caracteres).");

    // ---- REGRAS DE NEGÓCIO ----
    // Sd EV não pode ter "Reengajamento" (é sempre Engajamento)
    // já tratado no código
    // Cabo / Sd EP nunca são "Engajamento" — é Reengajamento
    // (informativo — não bloqueia)

    // ============================================================
    // SE HOUVE ERROS, ABORTA E MOSTRA
    // ============================================================
    if (erros.length > 0) {
        const lista = erros.map(e => "• " + e).join("\n");
        alert("Corrija os seguintes campos antes de gerar o documento:\n\n" + lista);

        // Destaca o primeiro campo com erro
        if (foco[0]) {
            const el = document.getElementById(foco[0]);
            if (el) {
                el.focus();
                el.style.borderColor = "#c0392b";
                el.style.boxShadow = "0 0 0 3px rgba(192,57,43,0.2)";
                setTimeout(() => {
                    el.style.borderColor = "";
                    el.style.boxShadow = "";
                }, 2500);
            }
        }
        return; // NÃO gera o documento
    }

    // ============================================================
    // A PARTIR DAQUI, O CÓDIGO ORIGINAL DE GERAÇÃO
    // ============================================================

    // Termo: Reengajamento (Cabo, Sd EP) × Engajamento (Sd EV)
    let termoEngajamento = "Reengajamento";
    if (graduacao === "Soldado EV") termoEngajamento = "Engajamento";
    const termoEngajamentoMinusculo = termoEngajamento.toLowerCase();

    /* ---------- DATA DE VIGÊNCIA (ano atual + 1) ---------- */
    const anoVigencia = new Date().getFullYear() + 1;
    let dataInicioReen;
    if (isTecnico) {
        const dtTec = document.getElementById("dataPracaCompleta").value;
        if (dtTec) {
            const p = dtTec.split("-");
            dataInicioReen = `${anoVigencia}-${p[1]}-${p[2]}`;
        } else {
            dataInicioReen = `${anoVigencia}-03-01`;
        }
    } else {
        dataInicioReen = `${anoVigencia}-03-01`;
    }

    /* ---------- DATA DE PRAÇA ---------- */
    let dataPracaFormatada = "";
    if (isTecnico) {
        const dtCompleta = document.getElementById("dataPracaCompleta").value;
        if (dtCompleta) {
            const p = dtCompleta.split("-");
            dataPracaFormatada = `${p[2]}/${p[1]}/${p[0]}`;
        }
    } else {
        const anoPraca = document.getElementById("anoPraca").value;
        dataPracaFormatada = `01/03/${anoPraca}`;
    }

    /* ---------- DATA ATUAL POR EXTENSO ---------- */
    const hoje = new Date();
    const dataHojeStr = `${hoje.getDate()} de ${
        ["janeiro","fevereiro","março","abril","maio","junho",
         "julho","agosto","setembro","outubro","novembro","dezembro"][hoje.getMonth()]
    } de ${hoje.getFullYear()}`;

    /* ---------- NOME COM DESTAQUE ---------- */
    const nomeComDestaqueHtml = gerarNomeComDestaque(nomeCompleto, nomeGuerra);

    /* ---------- INJEÇÃO NO DOCUMENTO ---------- */
    document.querySelectorAll(".print-nome-destaque").forEach(el => el.innerHTML = nomeComDestaqueHtml);
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
    document.querySelectorAll(".print-pg-cmt-esqd").forEach(el => el.innerText = pgCmtEsqd);
    document.querySelectorAll(".print-nome-cmt-esqd").forEach(el => el.innerText = nomeCmtEsqd.toUpperCase());
    document.querySelectorAll(".print-termo-eng").forEach(el => el.innerText = termoEngajamento);
    document.querySelectorAll(".print-termo-eng-minusculo").forEach(el => el.innerText = termoEngajamentoMinusculo);

    ajustarFonteAssinatura(nomeCmtRegimento, pgCmtRegimento);

    // Nome sugerido do PDF
    const tituloOriginal = document.title;
    document.title = `Requerimento do ${graduacao} ${nomeGuerra.toUpperCase()}`;
    const restaurarTitulo = () => {
        document.title = tituloOriginal;
        window.removeEventListener("afterprint", restaurarTitulo);
    };
    window.addEventListener("afterprint", restaurarTitulo);

    window.print();
}
