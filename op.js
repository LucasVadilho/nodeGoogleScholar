
const fs = require('fs');

async function loadJSON(arquivo){
	return new Promise((resolve, reject) => {
		fs.readFile(arquivo, "utf8", (e, data) => {
			if(e) reject(e);
			resolve(JSON.parse(data));
		});
	});
}

const ARQUIVO_DADOS = "dados/UFABC.json";
const ARQUIVO_STATUS = "dados/status.json";

let data;
let status;
bora();

async function bora(){
	data = await loadJSON(ARQUIVO_DADOS);
	status = await loadJSON(ARQUIVO_STATUS);
	
	//resetArtigos();
	let numArtigos = 0;
	for(let i = 0; i < data.pesquisadores.length; i++){
		let pesquisador = data.pesquisadores[i];
		numArtigos += pesquisador.artigos.length;
		console.log(pesquisadorToString(pesquisador));
	}
	
	console.log(`\nStatus: cstart = ${status.cstart}, numPesquisador = ${status.numPesquisador}`);
	console.log(`No total ${numArtigos} artigos foram obtidos.`)
}

function pesquisadorToString(pesquisador){
	return `${pesquisador.artigos.length} artigos\t| ${pesquisador.nome}`;
}

function resetArtigos(){
	for(let i = 0; i < data.pesquisadores.length; i++){
		data.pesquisadores[i].artigos = [];
	}

	salvarResultados();
}

function salvarResultados(){
	return new Promise((resolve, reject) => {
		let d = new Date(Date.now());
		data.ultimoUpdate = d.toJSON();

		fs.writeFile(ARQUIVO_STATUS, JSON.stringify(status), e => {if(e) reject(e)});
		fs.writeFile(ARQUIVO_DADOS, JSON.stringify(data), e => {if(e) reject(e)});

		console.log("Salvo");
		resolve();
	});
}