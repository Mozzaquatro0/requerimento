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
    
    

    const nomeCompleto   = document.getElementById("nomeCompleto").value;
    const nomeGuerra     = document.getElementById("nomeGuerra").value;
    const graduacao      = document.getElementById("graduacao").value;
    const idt            = document.getElementById("idt").value;
    const cpf            = document.getElementById("cpf").value;
    const subunidade     = document.getElementById("subunidade").value;
    const funcao         = document.getElementById("funcao").value;
    const numInfo        = document.getElementById("numInfo").value;
    const secaoInfo      = document.getElementById("secaoInfo").value;
    const numEB          = document.getElementById("numEB").value;
    const comportamento  = document.getElementById("comportamento").value;
    const dataNascimento = document.getElementById("dataNascimento").value;
    const taf            = document.getElementById("taf").value;
    const dependentes    = document.getElementById("dependentes").value;
    const subJudice      = document.getElementById("subJudice").value;
    const existeVaga     = document.getElementById("existeVaga").value;
    const pgCmtRegimento = document.getElementById("pgCmtRegimento").value;
    const nomeCmtRegimento = document.getElementById("nomeCmtRegimento").value;
    const pgCmtEsqd      = document.getElementById("pgCmtEsqd").value;
    const nomeCmtEsqd    = document.getElementById("nomeCmtEsqd").value;

    // Termo: Reengajamento (Cabo, Sd EP) × Engajamento (Sd EV)
    let termoEngajamento = "Reengajamento";
    if (graduacao === "Soldado EV") termoEngajamento = "Engajamento";
    const termoEngajamentoMinusculo = termoEngajamento.toLowerCase();

	/* ---------- DATA DE VIGÊNCIA (formato YYYY-MM-DD) ---------- */
	// Regra: sempre "ano atual + 1". Para militar TÉCNICO, o dia e o mês
	// seguem a data de praça; para não-técnico, fixo em 01/03.
	const anoVigencia = new Date().getFullYear() + 1;
	let dataInicioReen;

	if (document.getElementById("isTecnico").checked) {
		const dataPraca = document.getElementById("dataPracaCompleta").value; // YYYY-MM-DD
		if (dataPraca) {
			const p = dataPraca.split("-"); // [ano, mes, dia]
			dataInicioReen = `${anoVigencia}-${p[1]}-${p[2]}`;
		} else {
			dataInicioReen = `${anoVigencia}-03-01`;
		}
	} else {
		dataInicioReen = `${anoVigencia}-03-01`;
	}

    /* ---------- DATA DE PRAÇA (dd/mm/aaaa) ---------- */
    let dataPracaFormatada = "";
    if (document.getElementById("isTecnico").checked) {
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


	// Ajusta fonte da assinatura do Cmt do Regimento
	ajustarFonteAssinatura(nomeCmtRegimento, pgCmtRegimento);

	// ===== NOME SUGERIDO DO ARQUIVO PDF =====
	// O navegador usa o <title> como nome default em "Salvar como PDF"
	const tituloOriginal = document.title;
	document.title = `Requerimento do ${graduacao} ${nomeGuerra.toUpperCase()}`;

	const restaurarTitulo = () => {
		document.title = tituloOriginal;
		window.removeEventListener("afterprint", restaurarTitulo);
	};
	window.addEventListener("afterprint", restaurarTitulo);

	// Abre o diálogo de impressão (Salvar como PDF)
	window.print();
}
