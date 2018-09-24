const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');
const util = require('util');
let $;

const BASE_URL = "https://scholar.google.com.br";
const URL_ORGANIZACAO = "/citations?view_op=view_org&hl=en&org=";

const NUM_MAX_PESQUISADORES = 5000;

const ORGANIZACAO = {
	id: "13217906292402142721",
	nome: "Universidade Federal do ABC",
	sigla: "UFABC"
};

/*const ORGANIZACAO = {
	id: "4833850012421173011",
	nome: "Universidade de São Paulo",
	sigla: "USP"
};*/

async function getRequest(url){	
	return new Promise((resolve, reject) => {
		https.get(url, res => {
			res.setEncoding("binary");
			let body = "";

			res.on('data', (data) => body += data);
			res.on('end', () => {
				resolve(body);
			});
			res.on('error', (e) => reject(e));
		}).on('error', (e) => reject(e));
	});
}

async function organizacaoParaJSON(body, json){
	return new Promise((resolve, reject) => {
		$ = cheerio.load(body);
		let pesquisadores = $(".gsc_oai_name > a").toArray();
		
		let proximaPagina = $(".gs_btnPR").attr("onclick");
		if(proximaPagina != null){
			proximaPagina = proximaPagina
			.replace("window.location='", "")
			.replace("'", "")
			.replace(/\\x3d/g, "=")
			.replace(/\\x26/g, "&");
		}

		json.proximaPagina = proximaPagina;

		for(let i = 0; i < pesquisadores.length; i++){
			json.pesquisadores.push({
				nome : pesquisadores[i].children[0].data,
				url : $(pesquisadores[i]).attr("href")
			});
		}
		resolve(json);
	});
}

async function bora(){
	let d = new Date(Date.now());

	let dados = {
		id: ORGANIZACAO.id,
		nome: ORGANIZACAO.nome,
		sigla: ORGANIZACAO.sigla,
		dataCriacao: d.toJSON();
		ultimoUpdate: d.toJSON(),
		proximaPagina: URL_ORGANIZACAO + ORGANIZACAO.id,
		pesquisadores: []
	};

	while(dados.proximaPagina != null && dados.pesquisadores.length < NUM_MAX_PESQUISADORES){
		console.log("Path: " + dados.proximaPagina + "\n" + "#Pesquisadores: " + dados.pesquisadores.length + "\n");

		let resposta = await getRequest(BASE_URL + dados.proximaPagina);
		dados = await organizacaoParaJSON(resposta, dados);
	}

	console.log("Acabou. #Pesquisadores obtidos: " + dados.pesquisadores.length);
	
	let nome = `${dados.sigla}_${d.toDateString()}(${d.getHours()}h${d.getMinutes()}min${d.getMinutes()}s).json`;
	fs.writeFile("dados/" + nome, JSON.stringify(dados), (e) => {if(e) console.error(e)});
}

bora();