/* ==========================================================================
   CONFIGURAÇÃO INSTITUCIONAL E CAMINHO DO BRASÃO (MESMA PASTA DO PROJETO)
   ========================================================================== */
const CAMINHO_BRASAO = "brasao.png";
// Opcional: se quiser que funcione 100% automático até abrindo com duplo clique (file://) sem servidor,
// cole abaixo o código Base64 do seu brasao.png (ex: "data:image/png;base64,iVBORw0KGgo...")
const BRASAO_BASE64 = "";
let brasaoDataUrlCache = null;

/* ==========================================================================
   1. CARREGAMENTO INICIAL, AUTO-UPPERCASE E LOCALSTORAGE
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {

    const campos = [
        "nomeCompleto", "nomeGuerra", "idt", "cpf", "graduacao", "subunidade",
        "numInfo", "secaoInfo", "numEB", "funcao", "comportamento",
        "dataNascimento", "taf", "dependentes", "subJudice", "existeVaga",
        "pgCmtRegimento", "nomeCmtRegimento", "pgCmtEsqd", "nomeCmtEsqd"
    ];

    // Campos que devem ser convertidos para CAIXA ALTA automaticamente ao digitar
    const camposCaixaAlta = ["nomeCompleto", "nomeGuerra", "nomeCmtRegimento", "nomeCmtEsqd", "taf"];

    camposCaixaAlta.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => {
            const pos = el.selectionStart;
            const upper = el.value.toUpperCase();
            if (el.value !== upper) {
                el.value = upper;
                if (typeof pos === "number") el.setSelectionRange(pos, pos);
            }
        });
    });

    // Recuperação e persistência no localStorage
    campos.forEach(id => {
        const valorSalvo = localStorage.getItem(id);
        const elemento = document.getElementById(id);
        if (valorSalvo !== null && elemento) elemento.value = valorSalvo;
        if (elemento) {
            elemento.addEventListener("input",  () => localStorage.setItem(id, elemento.value));
            elemento.addEventListener("change", () => localStorage.setItem(id, elemento.value));
        }
    });

    // Validação em tempo real (fora do loop de campos — sem duplicar listeners)
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
                el.title = "";
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
        if (el.value.trim() !== "") validar();
    });

    // Vigência padrão (não-técnico): 01/03 do próximo ano
    const proximoAno = new Date().getFullYear() + 1;
    const campoVig = document.getElementById("dataInicioReen");
    if (campoVig) campoVig.value = `01/03/${proximoAno}`;

    // Restaura estado do checkbox de Militar Técnico
    const isTecnicoSalvo = localStorage.getItem("isTecnico") === "true";
    const chk = document.getElementById("isTecnico");
    if (chk) {
        chk.checked = isTecnicoSalvo;
        toggleTipoPraca();
    }


});

/* ==========================================================================
   2. MÁSCARAS DE ENTRADA EM TEMPO REAL
   ========================================================================== */
document.getElementById("cpf").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    e.target.value = value;
});

document.getElementById("idt").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    value = value
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1})$/, "$1-$2");
    e.target.value = value;
});

document.getElementById("numEB").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 17) value = value.slice(0, 17);

    let formatado = "";
    if (value.length > 0)  formatado += value.substring(0, 5);
    if (value.length > 5)  formatado += "." + value.substring(5, 11);
    if (value.length > 11) formatado += "/" + value.substring(11, 15);
    if (value.length > 15) formatado += "-" + value.substring(15, 17);

    e.target.value = formatado;
});

/* ==========================================================================
   3. VALIDAÇÃO DE CPF (DÍGITO VERIFICADOR)
   ========================================================================== */
function validarCPF(cpfFormatado) {
    const cpf = cpfFormatado.replace(/\D/g, "");
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i], 10) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[9], 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i], 10) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[10], 10)) return false;

    return true;
}

/* ==========================================================================
   4. MODAIS E LIMPEZA RÁPIDA DE NOVO MILITAR
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

function limparDadosMilitar() {
    if (!confirm("Deseja limpar os dados do militar atual para preencher um novo requerimento?\n\n(Os dados dos Comandantes, Subunidade e Seção serão mantidos.)")) {
        return;
    }

    const camposLimpar = [
        "nomeCompleto", "nomeGuerra", "idt", "cpf",
        "numInfo", "numEB", "funcao", "dataNascimento",
        "taf", "dependentes", "anoPraca", "dataPracaCompleta", "dataInicioReen_Tecnico"
    ];

    camposLimpar.forEach(id => {
        localStorage.removeItem(id);
        const el = document.getElementById(id);
        if (el) {
            el.value = "";
            el.classList.remove("campo-valido", "campo-invalido");
            el.title = "";
        }
    });

    document.getElementById("graduacao").value = "Cabo";
    document.getElementById("comportamento").value = "Bom";
    document.getElementById("subJudice").value = "Não";
    document.getElementById("existeVaga").value = "Sim";

    localStorage.setItem("graduacao", "Cabo");
    localStorage.setItem("comportamento", "Bom");
    localStorage.setItem("subJudice", "Não");
    localStorage.setItem("existeVaga", "Sim");

    const chk = document.getElementById("isTecnico");
    if (chk) {
        chk.checked = false;
        toggleTipoPraca();
    }

    document.getElementById("nomeCompleto").focus();
}

/* ==========================================================================
   5. TIPO DE PRAÇA (COMBATENTE × MILITAR TÉCNICO)
   ========================================================================== */
function toggleTipoPraca() {
    const isTecnico      = document.getElementById("isTecnico").checked;
    const containerPraca = document.getElementById("containerDataPraca");
    const campoVig       = document.getElementById("dataInicioReen");
    const proximoAno     = new Date().getFullYear() + 1;

    localStorage.setItem("isTecnico", isTecnico);

    if (isTecnico) {
        containerPraca.innerHTML = '<input type="date" id="dataPracaCompleta" required>';
        const dt = document.getElementById("dataPracaCompleta");
        const salvo = localStorage.getItem("dataPracaCompleta");
        if (dt) {
            if (salvo) dt.value = salvo;
            dt.addEventListener("change", () => {
                localStorage.setItem("dataPracaCompleta", dt.value);
                calcularReengajamentoTecnico();
            });
            dt.addEventListener("input", () => {
                localStorage.setItem("dataPracaCompleta", dt.value);
                calcularReengajamentoTecnico();
            });
        }

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
        if (ano) {
            if (salvo) ano.value = salvo;
            ano.addEventListener("input",  () => localStorage.setItem("anoPraca", ano.value));
            ano.addEventListener("change", () => localStorage.setItem("anoPraca", ano.value));
        }

        if (campoVig) campoVig.value = `01/03/${proximoAno}`;
    }
}

function calcularReengajamentoTecnico() {
    const campoData = document.getElementById("dataPracaCompleta");
    if (!campoData || !campoData.value) return;

    const partes = campoData.value.split("-");
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
   6. HELPERS DE FORMATAÇÃO DE TEXTO E DATAS
   ========================================================================== */
function gerarNomeComDestaqueHTML(nomeCompleto, nomeGuerra) {
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

    return partesCompleto.map(palavra => {
        const corresponde = partesGuerra.some(part => {
            if (part.length === 1) return palavra.startsWith(part);
            return palavra === part;
        });
        if (corresponde) {
            const partLetra = partesGuerra.find(part => part.length === 1 && palavra.startsWith(part));
            if (partLetra) {
                return `<span class="nome-guerra-negrito">${palavra.charAt(0)}</span>${palavra.slice(1)}`;
            }
            return `<span class="nome-guerra-negrito">${palavra}</span>`;
        }
        return palavra;
    }).join(" ");
}

// Retorna array de trechos para pdfmake destacando o Nome de Guerra em negrito
function gerarPartesNomePdfMake(nomeCompleto, nomeGuerra) {
    const nomeCompUpper   = (nomeCompleto || "").toUpperCase().trim();
    const nomeGuerraUpper = (nomeGuerra  || "").toUpperCase().trim();
    if (!nomeGuerraUpper) return [nomeCompUpper];

    const idx = nomeCompUpper.indexOf(nomeGuerraUpper);
    if (idx !== -1) {
        const partes = [];
        const antes  = nomeCompUpper.slice(0, idx);
        const depois = nomeCompUpper.slice(idx + nomeGuerraUpper.length);
        if (antes)  partes.push(antes);
        partes.push({ text: nomeGuerraUpper, bold: true });
        if (depois) partes.push(depois);
        return partes;
    }

    const partesGuerra   = nomeGuerraUpper.split(/\s+/).filter(p => p.length > 0);
    const partesCompleto = nomeCompUpper.split(/\s+/);
    const resultado = [];

    partesCompleto.forEach((palavra, i) => {
        if (i > 0) resultado.push(" ");
        const corresponde = partesGuerra.some(part => {
            if (part.length === 1) return palavra.startsWith(part);
            return palavra === part;
        });
        if (corresponde) {
            const partLetra = partesGuerra.find(part => part.length === 1 && palavra.startsWith(part));
            if (partLetra) {
                resultado.push({ text: palavra.charAt(0), bold: true }, palavra.slice(1));
            } else {
                resultado.push({ text: palavra, bold: true });
            }
        } else {
            resultado.push(palavra);
        }
    });

    return resultado;
}

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
    const diaStr = diaNum < 10 ? `0${diaNum}` : `${diaNum}`;
    return `${diaStr} de ${mes} de ${ano}`;
}

function obterDataHojePorExtenso() {
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm   = String(hoje.getMonth() + 1).padStart(2, "0");
    const dd   = String(hoje.getDate()).padStart(2, "0");
    return formatarDataPorExtenso(`${yyyy}-${mm}-${dd}`);
}

/* ==========================================================================
   7. VALIDAÇÃO CENTRALIZADA DOS DADOS DO FORMULÁRIO
   ========================================================================== */
function coletarEValidarDados() {
    const erros = [];
    const foco  = [];

    const exigir = (condicao, campoId, mensagem) => {
        if (!condicao) {
            erros.push(mensagem);
            if (campoId) foco.push(campoId);
        }
    };

    const nomeCompleto     = document.getElementById("nomeCompleto").value.trim().toUpperCase();
    const nomeGuerra       = document.getElementById("nomeGuerra").value.trim().toUpperCase();
    const graduacao        = document.getElementById("graduacao").value;
    const idt              = document.getElementById("idt").value.trim();
    const cpf              = document.getElementById("cpf").value.trim();
    const subunidade       = document.getElementById("subunidade").value.trim();
    const funcao           = document.getElementById("funcao").value.trim();
    const numInfo          = document.getElementById("numInfo").value.trim();
    const secaoInfo        = document.getElementById("secaoInfo").value.trim();
    const numEB            = document.getElementById("numEB").value.trim();
    const comportamento    = document.getElementById("comportamento").value;
    const dataNascimento   = document.getElementById("dataNascimento").value;
    const taf              = document.getElementById("taf").value.trim().toUpperCase();
    const dependentes      = document.getElementById("dependentes").value.trim();
    const subJudice        = document.getElementById("subJudice").value;
    const existeVaga       = document.getElementById("existeVaga").value;
    const pgCmtRegimento   = document.getElementById("pgCmtRegimento").value.trim();
    const nomeCmtRegimento = document.getElementById("nomeCmtRegimento").value.trim().toUpperCase();
    const pgCmtEsqd        = document.getElementById("pgCmtEsqd").value.trim();
    const nomeCmtEsqd      = document.getElementById("nomeCmtEsqd").value.trim().toUpperCase();
    const isTecnico        = document.getElementById("isTecnico").checked;

    exigir(nomeCompleto.length >= 10, "nomeCompleto", "Nome completo muito curto (mínimo 10 caracteres).");
    exigir(/^[A-ZÀ-Ú\s]+$/.test(nomeCompleto), "nomeCompleto", "Nome completo deve conter apenas letras e espaços.");

    exigir(nomeGuerra.length >= 2 && nomeGuerra.length <= 30, "nomeGuerra", "Nome de guerra inválido (2 a 30 caracteres).");
    const partesGuerra = nomeGuerra.replace(/\s+/g, " ").split(" ");
    const todasNoNome = partesGuerra.every(p => nomeCompleto.includes(p));
    exigir(todasNoNome, "nomeGuerra", "Nome de guerra deve conter palavras presentes no nome completo.");

    exigir(/^\d{3}\.\d{3}\.\d{3}-\d{1}$/.test(idt), "idt", "Idt inválida. Formato esperado: 000.000.000-0.");

    exigir(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf), "cpf", "CPF inválido. Formato esperado: 000.000.000-00.");
    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) {
        exigir(validarCPF(cpf), "cpf", "CPF com dígito verificador inválido.");
    }

    exigir(subunidade.length >= 2 && subunidade.length <= 30, "subunidade", "Subunidade inválida (2 a 30 caracteres).");
    exigir(funcao.length >= 3 && funcao.length <= 60, "funcao", "Função interna inválida (3 a 60 caracteres).");
    exigir(/^\d{1,4}$/.test(numInfo), "numInfo", "Número da Info deve ser numérico (1 a 4 dígitos).");
    exigir(secaoInfo.length >= 2 && secaoInfo.length <= 20, "secaoInfo", "Seção/Fração emissora inválida (2 a 20 caracteres).");
    exigir(/^\d{5}\.\d{6}\/\d{4}-\d{2}$/.test(numEB), "numEB", "NUP inválido. Formato esperado: 00000.000000/0000-00.");

    exigir(taf.length >= 1 && taf.length <= 3 && /^[A-Z]+$/.test(taf), "taf", "Menção do TAF inválida (ex: B, R, MB).");
    exigir(/^\d{1,2}$/.test(dependentes) && parseInt(dependentes, 10) >= 0 && parseInt(dependentes, 10) <= 20,
        "dependentes", "Número de dependentes deve estar entre 0 e 20.");

    if (!dataNascimento) {
        erros.push("Data de nascimento é obrigatória.");
        foco.push("dataNascimento");
    } else {
        const nasc = new Date(dataNascimento + "T00:00:00");
        const idade = Math.floor((new Date() - nasc) / (365.25 * 24 * 3600 * 1000));
        exigir(idade >= 17 && idade <= 70, "dataNascimento", `Idade inválida (${idade} anos). Militar deve ter entre 17 e 70 anos.`);
    }

    let dataInicioReen = "";
    let dataPracaFormatada = "";
    const anoVigencia = new Date().getFullYear() + 1;

    if (isTecnico) {
        const dtTec = document.getElementById("dataPracaCompleta");
        if (!dtTec || !dtTec.value) {
            erros.push("Data de praça é obrigatória para militar técnico.");
            foco.push("dataPracaCompleta");
        } else {
            const praca = new Date(dtTec.value + "T00:00:00");
            exigir(praca <= new Date(), "dataPracaCompleta", "Data de praça não pode ser no futuro.");
            exigir(praca.getFullYear() >= 1950, "dataPracaCompleta", "Data de praça não pode ser anterior a 1950.");
            const p = dtTec.value.split("-");
            dataInicioReen = `${anoVigencia}-${p[1]}-${p[2]}`;
            dataPracaFormatada = `${p[2]}/${p[1]}/${p[0]}`;
        }
    } else {
        const anoPracaEl = document.getElementById("anoPraca");
        const ano = parseInt(anoPracaEl ? anoPracaEl.value : "", 10);
        exigir(!isNaN(ano) && ano >= 1950 && ano <= new Date().getFullYear(),
            "anoPraca", "Ano de incorporação inválido (1950 até o ano atual).");
        dataInicioReen = `${anoVigencia}-03-01`;
        dataPracaFormatada = `01/03/${ano}`;
    }

    exigir(pgCmtRegimento.length >= 2, "pgCmtRegimento", "Posto/Grad do Cmt do Regimento inválido.");
    exigir(nomeCmtRegimento.length >= 10, "nomeCmtRegimento", "Nome do Cmt do Regimento muito curto (mínimo 10 caracteres).");
    exigir(pgCmtEsqd.length >= 2, "pgCmtEsqd", "Posto/Grad do Cmt do Esqd inválido.");
    exigir(nomeCmtEsqd.length >= 10, "nomeCmtEsqd", "Nome do Cmt do Esqd muito curto (mínimo 10 caracteres).");

    if (erros.length > 0) {
        alert("Corrija os seguintes campos antes de gerar o documento:\n\n" + erros.map(e => "• " + e).join("\n"));
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
        return null;
    }

    const termoEngajamento = graduacao === "Soldado EV" ? "Engajamento" : "Reengajamento";

    return {
        nomeCompleto,
        nomeGuerra,
        graduacao,
        graduacaoCaps: graduacao.toUpperCase(),
        idt,
        cpf,
        subunidade,
        subunidadeUpper: subunidade.toUpperCase(),
        funcao,
        numInfo,
        secaoInfo,
        secaoInfoUpper: secaoInfo.toUpperCase(),
        numEB,
        comportamento,
        dataNascimentoExtenso: formatarDataPorExtenso(dataNascimento),
        taf,
        dependentes,
        subJudice,
        existeVaga,
        pgCmtRegimento,
        nomeCmtRegimento,
        pgCmtEsqd,
        nomeCmtEsqd,
        dataVigenciaExtenso: formatarDataPorExtenso(dataInicioReen),
        dataPracaFormatada,
        dataHojeExtenso: obterDataHojePorExtenso(),
        termoEngajamento,
        termoEngajamentoMinusculo: termoEngajamento.toLowerCase()
    };
}

/* ==========================================================================
   8. GERAÇÃO VETORIAL DO PDF VIA PDFMAKE (100% IDÊNTICO NO iOS, ANDROID E PC)
   ========================================================================== */
function criarDocDefinition(dados, nomeFonte, brasaoDataUrl) {
    const textoAssinaturaCmt = `${dados.nomeCmtRegimento} – ${dados.pgCmtRegimento}`;
    let fontSizeCmt = 10;
    if (textoAssinaturaCmt.length > 34) {
        fontSizeCmt = Math.max(6.8, Number((10 * (34 / textoAssinaturaCmt.length)).toFixed(1)));
    }

    const amparoLegal = "Tal solicitação encontra amparo no art. 7º e art. 8º da Portaria nº 257, de 30 de abril de 2009 (Aprova as Instruções Gerais para Prorrogação do Tempo de Serviço Militar de Cabos e Soldados IG 10-06), alterada pela Portaria nº 380 de 29 de maio de 2012 e inciso XLIV do art.21 da Portaria nº 816, de 19 de dezembro de 2003 (Regulamento Interno e dos Serviços Gerais - RISG).";

    return {
        pageSize: "A4",
        // Margens: Esquerda 2cm (56.7pt), Superior 1cm (28.35pt), Direita 2cm (56.7pt), Inferior 1.5cm (42.5pt)
        pageMargins: [56.7, 28.35, 56.7, 42.5],
        images: brasaoDataUrl ? { brasao: brasaoDataUrl } : {},
        defaultStyle: {
            font: nomeFonte,
            fontSize: 12,
            lineHeight: 1.25,
            color: "#000000"
        },
        content: [
            /* ======================== PÁGINA 1 ======================== */
            ...(brasaoDataUrl ? [{
                image: "brasao",
                width: 56,
                alignment: "center",
                margin: [0, 0, 0, 5]
            }] : []),
            {
                text: [
                    "MINISTÉRIO DA DEFESA\n",
                    "EXÉRCITO BRASILEIRO\n",
                    "CMS-3ª DE - 6ª Bda Inf Bld\n",
                    "4° REGIMENTO DE CARROS DE COMBATE\n",
                    "(2ª RC TRANSP/1940)\n",
                    "REGIMENTO PASSO DO ROSÁRIO"
                ],
                alignment: "center",
                bold: true,
                fontSize: 11.5,
                lineHeight: 1.15,
                margin: [0, 0, 0, 14]
            },
            {
                table: {
                    widths: ["51%", "49%"],
                    body: [[
                        {
                            border: [false, false, false, false],
                            margin: [0, 2, 6, 0],
                            stack: [
                                { text: "Requerimento", bold: true, margin: [0, 0, 0, 2] },
                                { text: [{ text: "EB: ", bold: true }, dados.numEB], margin: [0, 0, 0, 14] },
                                {
                                    text: [
                                        `Do ${dados.graduacao} `,
                                        ...gerarPartesNomePdfMake(dados.nomeCompleto, dados.nomeGuerra)
                                    ]
                                }
                            ]
                        },
                        {
                            border: [true, true, true, true],
                            margin: [6, 5, 6, 5],
                            stack: [
                                { text: "DESPACHO", bold: true, alignment: "center", fontSize: 10.5, margin: [0, 0, 0, 8] },
                                {
                                    text: "(  ) Deferido, concedo por 12 (doze) meses a contar de ____/____/______.",
                                    fontSize: 10,
                                    lineHeight: 1.2,
                                    margin: [0, 0, 0, 8]
                                },
                                {
                                    text: "(  ) Indeferido.",
                                    fontSize: 10,
                                    margin: [0, 0, 0, 18]
                                },
                                {
                                    text: textoAssinaturaCmt,
                                    bold: true,
                                    alignment: "center",
                                    fontSize: fontSizeCmt,
                                    margin: [0, 0, 0, 1]
                                },
                                {
                                    text: "Cmt 4° RCC",
                                    alignment: "center",
                                    fontSize: 10
                                }
                            ]
                        }
                    ]]
                },
                layout: {
                    hLineWidth: () => 1.2,
                    vLineWidth: () => 1.2,
                    hLineColor: () => "#000000",
                    vLineColor: () => "#000000"
                },
                margin: [0, 0, 0, 16]
            },
            {
                text: "Ao Sr Comandante do 4º Regimento de Carros de Combate",
                margin: [0, 0, 0, 6]
            },
            {
                text: [{ text: "Objeto: ", bold: true }, `${dados.termoEngajamento} de praça.`],
                margin: [0, 0, 0, 10]
            },
            {
                text: [
                    "1. ",
                    ...gerarPartesNomePdfMake(dados.nomeCompleto, dados.nomeGuerra),
                    `, Idt ${dados.idt} e CPF ${dados.cpf}, ${dados.graduacao}, servindo no 4° Regimento de Carros de Combate (Rosário do Sul-RS), requer a Vossa Senhoria, ${dados.termoEngajamentoMinusculo} por um ano, a contar de ${dados.dataVigenciaExtenso}.`
                ],
                alignment: "justify",
                leadingIndent: 56.7,
                margin: [0, 0, 0, 8]
            },
            {
                text: `2. ${amparoLegal}`,
                alignment: "justify",
                leadingIndent: 56.7,
                margin: [0, 0, 0, 8]
            },
            {
                text: "3. É a primeira vez que requer.",
                alignment: "justify",
                leadingIndent: 56.7,
                margin: [0, 0, 0, 8]
            },
            {
                text: "Nestes termos, pede deferimento.",
                alignment: "justify",
                leadingIndent: 56.7,
                margin: [0, 0, 0, 32]
            },
            {
                text: `Rosário do Sul, ${dados.dataHojeExtenso}.`,
                alignment: "right",
                margin: [0, 0, 0, 52]
            },
            {
                stack: [
                    { text: "____________________________________________________", bold: true, alignment: "center", margin: [0, 0, 0, 2] },
                    {
                        text: [
                            ...gerarPartesNomePdfMake(dados.nomeCompleto, dados.nomeGuerra),
                            { text: ` - ${dados.graduacaoCaps}`, bold: true }
                        ],
                        alignment: "center"
                    }
                ],
                pageBreak: "after"
            },

            /* ======================== PÁGINA 2 ======================== */
            ...(brasaoDataUrl ? [{
                image: "brasao",
                width: 56,
                alignment: "center",
                margin: [0, 0, 0, 5]
            }] : []),
            {
                text: [
                    "MINISTÉRIO DA DEFESA\n",
                    "EXÉRCITO BRASILEIRO\n",
                    "4° REGIMENTO DE CARROS DE COMBATE\n",
                    "REGIMENTO PASSO DO ROSÁRIO"
                ],
                alignment: "center",
                bold: true,
                fontSize: 11.5,
                lineHeight: 1.15,
                margin: [0, 0, 0, 10]
            },
            {
                text: `Rosário do Sul, RS, ${dados.dataHojeExtenso}`,
                alignment: "right",
                margin: [0, 0, 0, 10]
            },
            {
                text: [
                    { text: "Info n° ", bold: true }, `${dados.numInfo} - ${dados.secaoInfoUpper} / ${dados.subunidadeUpper} / 4° RCC\n`,
                    { text: "Do ", bold: true }, `Comandante do ${dados.subunidadeUpper}\n`,
                    { text: "Ao ", bold: true }, "Sr Comandante do 4° Regimento de Carros de Combate"
                ],
                margin: [0, 0, 0, 8]
            },
            {
                text: [{ text: "Assunto: ", bold: true }, "Prorrogação de tempo de serviço"],
                margin: [0, 0, 0, 10]
            },
            {
                text: [
                    `1. Requerimento em que o ${dados.graduacao} `,
                    ...gerarPartesNomePdfMake(dados.nomeCompleto, dados.nomeGuerra),
                    `, servindo nesta Subunidade, requer ${dados.termoEngajamentoMinusculo} por um ano, a contar de ${dados.dataVigenciaExtenso}.`
                ],
                alignment: "justify",
                leadingIndent: 56.7,
                margin: [0, 0, 0, 8]
            },
            {
                text: ["2. ", { text: "INFORMAÇÃO", bold: true }],
                margin: [0, 0, 0, 4]
            },
            {
                text: "a. Amparo do Requerente:",
                margin: [28.35, 0, 0, 4]
            },
            {
                text: amparoLegal.replace("IG 10-06", "- IG 10-06"),
                alignment: "justify",
                leadingIndent: 28.35,
                margin: [28.35, 0, 0, 8]
            },
            {
                text: "b. Estudo Fundamentado",
                margin: [28.35, 0, 0, 4]
            },
            {
                text: "1) Dados informativos sobre o requerente:",
                margin: [42.5, 0, 0, 4]
            },
            {
                margin: [42.5, 0, 0, 8],
                fontSize: 11,
                lineHeight: 1.22,
                stack: [
                    { text: ["- Nome: ", ...gerarPartesNomePdfMake(dados.nomeCompleto, dados.nomeGuerra)] },
                    { text: `- Graduação: ${dados.graduacao}` },
                    { text: `- Identidade: ${dados.idt}` },
                    { text: `- Função: ${dados.funcao}` },
                    { text: `- Data de Praça: ${dados.dataPracaFormatada}` },
                    { text: `- Data de Nascimento: ${dados.dataNascimentoExtenso}` },
                    { text: `- Está classificado no comportamento: ${dados.comportamento}` },
                    { text: `- Está sub-judice em fórum militar ou civil: ${dados.subJudice}` },
                    { text: `- Existe vaga na Unidade no NB na QM correspondente: ${dados.existeVaga}` },
                    { text: `- Menção do último TAF: "${dados.taf}"` },
                    { text: `- Número de dependentes: ${dados.dependentes}` }
                ]
            },
            {
                text: "2) Apreciação",
                margin: [42.5, 0, 0, 4]
            },
            {
                text: `O requerente pleiteia ${dados.termoEngajamentoMinusculo} por um ano a contar de ${dados.dataVigenciaExtenso}, havendo coerência entre o que solicita e os dispositivos citados como amparo.`,
                alignment: "justify",
                leadingIndent: 28.35,
                margin: [42.5, 0, 0, 0],
                pageBreak: "after"
            },

            /* ======================== PÁGINA 3 ======================== */
            {
                text: `(Info n° ${dados.numInfo} - ${dados.secaoInfoUpper} / ${dados.subunidadeUpper} / 4° RCC, de ${dados.dataHojeExtenso} - EB ${dados.numEB}.......2/2)`,
                fontSize: 10,
                alignment: "center",
                margin: [0, 0, 0, 22]
            },
            {
                text: ["3. ", { text: "PARECER", bold: true }],
                margin: [0, 0, 0, 14]
            },
            {
                canvas: [
                    { type: "line", x1: 0, y1: 18,  x2: 481.8, y2: 18,  lineWidth: 0.8, lineColor: "#000000" },
                    { type: "line", x1: 0, y1: 44,  x2: 481.8, y2: 44,  lineWidth: 0.8, lineColor: "#000000" },
                    { type: "line", x1: 0, y1: 70,  x2: 481.8, y2: 70,  lineWidth: 0.8, lineColor: "#000000" },
                    { type: "line", x1: 0, y1: 96,  x2: 481.8, y2: 96,  lineWidth: 0.8, lineColor: "#000000" }
                ],
                margin: [0, 0, 0, 22]
            },
            {
                text: "4. O presente requerimento permaneceu _______ dia(s) nesta OM para fins de informação e encaminhamento.",
                margin: [0, 0, 0, 56]
            },
            {
                stack: [
                    { text: `${dados.nomeCmtEsqd} - ${dados.pgCmtEsqd}`, bold: true, alignment: "center", margin: [0, 0, 0, 2] },
                    { text: `Comandante do ${dados.subunidadeUpper}`, bold: true, alignment: "center" }
                ]
            }
        ]
    };
}

function baixarBlobPdf(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 15000);
}

// Converte qualquer Blob ou URL de imagem em Data URL PNG puro (exigido pelo pdfMake)
function converterFonteParaPngDataUrl(srcUrl, revogarDepois = false) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                const pngDataUrl = canvas.toDataURL("image/png");
                if (revogarDepois) URL.revokeObjectURL(srcUrl);
                resolve(pngDataUrl);
            } catch (err) {
                if (revogarDepois) URL.revokeObjectURL(srcUrl);
                resolve(null);
            }
        };
        img.onerror = () => {
            if (revogarDepois) URL.revokeObjectURL(srcUrl);
            resolve(null);
        };
        img.src = srcUrl;
    });
}

async function carregarBrasaoDataUrl() {
    if (brasaoDataUrlCache) return brasaoDataUrlCache;

    // 1. Se o Base64 do brasão estiver embutido no código, usa direto (funciona online e offline via file://)
    if (BRASAO_BASE64 && BRASAO_BASE64.startsWith("data:image/")) {
        brasaoDataUrlCache = BRASAO_BASE64;
        return brasaoDataUrlCache;
    }

    // 2. Carregamento automático do arquivo brasao.png na mesma pasta (GitHub Pages / Intranet / Servidor Local)
    try {
        const resp = await fetch(CAMINHO_BRASAO);
        if (resp.ok) {
            const blob = await resp.blob();
            const objUrl = URL.createObjectURL(blob);
            const pngDataUrl = await converterFonteParaPngDataUrl(objUrl, true);
            if (pngDataUrl) {
                brasaoDataUrlCache = pngDataUrl;
                return brasaoDataUrlCache;
            }
        }
    } catch (e) {
        // Segue para fallback
    }

    // 3. Fallback via XMLHttpRequest / Image
    try {
        const blobXhr = await new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", CAMINHO_BRASAO, true);
            xhr.responseType = "blob";
            xhr.onload = () => resolve((xhr.status === 200 || xhr.status === 0) ? xhr.response : null);
            xhr.onerror = () => resolve(null);
            xhr.send();
        });
        if (blobXhr) {
            const objUrl = URL.createObjectURL(blobXhr);
            const pngDataUrl = await converterFonteParaPngDataUrl(objUrl, true);
            if (pngDataUrl) {
                brasaoDataUrlCache = pngDataUrl;
                return brasaoDataUrlCache;
            }
        }
    } catch (e) {
        // Ignora
    }

    const pngDireto = await converterFonteParaPngDataUrl(CAMINHO_BRASAO, false);
    if (pngDireto) {
        brasaoDataUrlCache = pngDireto;
        return brasaoDataUrlCache;
    }

    return null;
}

async function carregarFonteTinosNoVfs() {
    if (pdfMake.vfs && pdfMake.vfs["Tinos-Regular.ttf"]) {
        return true;
    }

    const base = "https://cdn.jsdelivr.net/gh/google/fonts@main/apache/tinos";
    const arquivos = {
        "Tinos-Regular.ttf": `${base}/Tinos-Regular.ttf`,
        "Tinos-Bold.ttf": `${base}/Tinos-Bold.ttf`,
        "Tinos-Italic.ttf": `${base}/Tinos-Italic.ttf`,
        "Tinos-BoldItalic.ttf": `${base}/Tinos-BoldItalic.ttf`
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    try {
        pdfMake.vfs = pdfMake.vfs || {};
        const entradas = Object.entries(arquivos);
        await Promise.all(entradas.map(async ([nome, url]) => {
            const resp = await fetch(url, { signal: controller.signal });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const buffer = await resp.arrayBuffer();
            let bin = "";
            const bytes = new Uint8Array(buffer);
            const chunk = 0x8000;
            for (let i = 0; i < bytes.length; i += chunk) {
                bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
            }
            pdfMake.vfs[nome] = btoa(bin);
        }));
        clearTimeout(timer);
        return true;
    } catch (e) {
        clearTimeout(timer);
        return false;
    }
}

async function gerarPdfComPdfMake(dados) {
    const btn = document.getElementById("btnGerarPdf");
    const textoOriginalBtn = btn ? btn.innerText : "";
    if (btn) {
        btn.disabled = true;
        btn.innerText = "⏳ Gerando PDF Oficial...";
    }

    const restaurarBotao = () => {
        if (btn) {
            btn.disabled = false;
            btn.innerText = textoOriginalBtn;
        }
    };

    try {
        const [tinosDisponivel, brasaoDataUrl] = await Promise.all([
            carregarFonteTinosNoVfs(),
            carregarBrasaoDataUrl()
        ]);

        pdfMake.fonts = {
            Tinos: {
                normal: "Tinos-Regular.ttf",
                bold: "Tinos-Bold.ttf",
                italics: "Tinos-Italic.ttf",
                bolditalics: "Tinos-BoldItalic.ttf"
            },
            Roboto: {
                normal: "Roboto-Regular.ttf",
                bold: "Roboto-Medium.ttf",
                italics: "Roboto-Italic.ttf",
                bolditalics: "Roboto-MediumItalic.ttf"
            }
        };

        let fonteEscolhida = null;
        if (tinosDisponivel && pdfMake.vfs && pdfMake.vfs["Tinos-Regular.ttf"]) {
            fonteEscolhida = "Tinos";
        } else if (pdfMake.vfs && pdfMake.vfs["Roboto-Regular.ttf"]) {
            fonteEscolhida = "Roboto";
        }

        if (!fonteEscolhida) {
            restaurarBotao();
            preencherDocumentoHTML(dados);
            return;
        }

        const nomeArquivo = `Requerimento do ${dados.graduacao} ${dados.nomeGuerra}.pdf`;
        const docDefinition = criarDocDefinition(dados, fonteEscolhida, brasaoDataUrl);

        // pdfmake 0.2.x exige callback em getBlob(cb)
        pdfMake.createPdf(docDefinition).getBlob((blob) => {
            baixarBlobPdf(blob, nomeArquivo);
            restaurarBotao();
        });
    } catch (err) {
        console.error("Erro ao gerar PDF com pdfMake, alternando para impressão nativa:", err);
        restaurarBotao();
        preencherDocumentoHTML(dados);
    }
}

/* ==========================================================================
   9. FALLBACK DE IMPRESSÃO NATIVA (OFFLINE / IMPRESSÃO DIRETA)
   ========================================================================== */
function ajustarFonteAssinaturaHTML(nomeCmt, pgCmt) {
    const box = document.getElementById("assinaturaCmtBox");
    if (!box) return;
    const texto = `${(nomeCmt || "").toUpperCase()} – ${pgCmt || ""}`;
    box.textContent = texto;

    let tamanho = 10.5;
    if (texto.length > 32) {
        tamanho = Math.max(6.5, Number((10.5 * (32 / texto.length)).toFixed(1)));
    }
    box.style.fontSize = `${tamanho}pt`;
}

function preencherDocumentoHTML(dados) {
    const nomeComDestaqueHtml = gerarNomeComDestaqueHTML(dados.nomeCompleto, dados.nomeGuerra);

    document.querySelectorAll(".print-nome-destaque").forEach(el => el.innerHTML = nomeComDestaqueHtml);
    document.querySelectorAll(".print-grad").forEach(el => el.innerText = dados.graduacao);
    document.querySelectorAll(".print-grad-caps").forEach(el => el.innerText = dados.graduacaoCaps);
    document.querySelectorAll(".print-idt").forEach(el => el.innerText = dados.idt);
    document.querySelectorAll(".print-cpf").forEach(el => el.innerText = dados.cpf);
    document.querySelectorAll(".print-su").forEach(el => el.innerText = dados.subunidadeUpper);
    document.querySelectorAll(".print-funcao").forEach(el => el.innerText = dados.funcao);
    document.querySelectorAll(".print-info").forEach(el => el.innerText = dados.numInfo);
    document.querySelectorAll(".print-secao").forEach(el => el.innerText = dados.secaoInfoUpper);
    document.querySelectorAll(".print-eb").forEach(el => el.innerText = dados.numEB);
    document.querySelectorAll(".print-comportamento").forEach(el => el.innerText = dados.comportamento);
    document.querySelectorAll(".print-taf-val").forEach(el => el.innerText = dados.taf);
    document.querySelectorAll(".print-data-corrente").forEach(el => el.innerText = dados.dataHojeExtenso);
    document.querySelectorAll(".print-data-vigencia").forEach(el => el.innerText = dados.dataVigenciaExtenso);
    document.querySelectorAll(".print-data-incorporacao").forEach(el => el.innerText = dados.dataPracaFormatada);
    document.querySelectorAll(".print-nasc").forEach(el => el.innerText = dados.dataNascimentoExtenso);
    document.querySelectorAll(".print-subjudice").forEach(el => el.innerText = dados.subJudice);
    document.querySelectorAll(".print-vaga").forEach(el => el.innerText = dados.existeVaga);
    document.querySelectorAll(".print-dependentes").forEach(el => el.innerText = dados.dependentes);
    document.querySelectorAll(".print-pg-cmt-esqd").forEach(el => el.innerText = dados.pgCmtEsqd);
    document.querySelectorAll(".print-nome-cmt-esqd").forEach(el => el.innerText = dados.nomeCmtEsqd);
    document.querySelectorAll(".print-termo-eng").forEach(el => el.innerText = dados.termoEngajamento);
    document.querySelectorAll(".print-termo-eng-minusculo").forEach(el => el.innerText = dados.termoEngajamentoMinusculo);

    ajustarFonteAssinaturaHTML(dados.nomeCmtRegimento, dados.pgCmtRegimento);

    const tituloOriginal = document.title;
    document.title = `Requerimento do ${dados.graduacao} ${dados.nomeGuerra}`;
    const restaurarTitulo = () => {
        document.title = tituloOriginal;
        window.removeEventListener("afterprint", restaurarTitulo);
    };
    window.addEventListener("afterprint", restaurarTitulo);

    window.print();
}

/* ==========================================================================
   10. PONTOS DE ENTRADA (SUBMIT E BOTÃO FALLBACK)
   ========================================================================== */
function gerarRequerimento(event) {
    event.preventDefault();
    const dados = coletarEValidarDados();
    if (!dados) return;

    if (typeof pdfMake !== "undefined") {
        gerarPdfComPdfMake(dados);
    } else {
        preencherDocumentoHTML(dados);
    }
}

function gerarModoImpressao() {
    const dados = coletarEValidarDados();
    if (!dados) return;
    preencherDocumentoHTML(dados);
}
