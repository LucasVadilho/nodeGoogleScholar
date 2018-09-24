const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');
const util = require('util');

const BASE_URL = "https://scholar.google.com.br";
const URL_ORGANIZACAO = BASE_URL + "/citations?view_op=view_org&hl=en&org=";
const NUM_MAX_PESQUISADORES = 2;
const NUM_MAX_ARTIGOS = 2;
const STEP_SIZE = 100;

const ARTIGOS_POR_PESQUISADOR = 100;

const ORGANIZACAO = {
	id: "13217906292402142721",
	nome: "Universidade Federal do ABC",
	sigla: "UFABC"
};

const ARQUIVO_DADOS = "dados/UFABC.json";
const ARQUIVO_STATUS = "dados/status.json";

async function peraAe(intervalo){
	return new Promise(resolve => {
		setTimeout(resolve, intervalo);
	});
}

function randomWait(){
	return Math.ceil(Math.random() * 2 * 60  * 1000); 
}

async function getRequest(url){
	let tempo = randomWait();

	console.log(`Request em (${tempo/1000}s): ${url}`);
	await peraAe(tempo);

	return new Promise((resolve, reject) => {
		https.get(url, res => {
			res.setEncoding("binary");
			let body = "";

			res.on('data', (data) => body += data);
			res.on('end', () => {
				if(body.length < 1000){
					reject(new Error("Google provavelmente está de mal humor(Resposta muito pequena)"));
				}
				resolve(body);
			});
			res.on('error', (e) => reject(e));
		}).on('error', (e) => reject(e));
	});
}

async function loadJSON(arquivo){
	return new Promise((resolve, reject) => {
		fs.readFile(arquivo, "utf8", (e, data) => {
			if(e) reject(e);
			resolve(JSON.parse(data));
		});
	});
}


let data;
let status;

async function bora(){
	data = await loadJSON(ARQUIVO_DADOS);
	status = await loadJSON(ARQUIVO_STATUS);
	
	while(status.numPesquisador < data.pesquisadores.length){
		try{
			await getPesquisadorJSON(data.pesquisadores[status.numPesquisador]);
		} catch(e) {
			console.log(e);
			break;
		}
		
		console.log(`(${(status.numPesquisador + 1)}/${data.pesquisadores.length}) dos pesquisadores`);
		
		await salvarResultados();
		status.numPesquisador++;
		status.cstart = 0;
	}

	console.log("Gracefull exit");
}

async function getPesquisadorJSON(pesquisador){
	let error = false;

	let i = parseInt(status.cstart);
	let btnMais;

	do{
		let url = `${BASE_URL}${pesquisador.url}&cstart=${i}&pagesize=${STEP_SIZE}`;
		let request;
		
		try{
			request = await getRequest(url);
		} catch(e){
			error = e;
			break;
		}

		let $ = cheerio.load(request);

		if(i == 0){
			pesquisador.metricas = htmlToMetricasJSON($);
		}

		//pesquisador.artigos = pesquisador.artigos.concat(await htmlToArtigosJSON($, pesquisador));
		try{
			await htmlToArtigosJSON($, pesquisador);
		} catch(e){
			error = e;
			break;
		}

		btnMais = $("#gsc_bpf_more");
		i += STEP_SIZE;
	} while(pesquisador.artigos.length < ARTIGOS_POR_PESQUISADOR && btnMais.attr("disabled") != "disabled");

	console.log(`${pesquisador.artigos.length} artigos do ${pesquisador.nome} foram obtidos.`);

	return new Promise((resolve, reject) => {
		if(error) reject(error);
		resolve();
	});
}

async function htmlToArtigosJSON($, pesquisador){
	let error = false;

	let i = 0;
	let inicio = status.cstart;

	let linhas = $(".gsc_a_tr");

	while(i <  linhas.length && pesquisador.artigos.length < ARTIGOS_POR_PESQUISADOR){
				
		let url = $(linhas[i]).find("a").attr("data-href");
		let titulo = $(linhas[i]).find(".gsc_a_t > a").text();
		let ano = $(linhas[i]).find(".gsc_a_y > span").text();
		let numCitacoes = $(linhas[i]).find(".gsc_a_c > a").text();
		let citacoesLink = $(linhas[i]).find(".gsc_a_c > a").attr("href");

		let response;
		try{
			response = await getRequest(BASE_URL + url);
		} catch (e){
			error = e;
			break;
		}

		$ = cheerio.load(response);
		let autores = $(".gsc_vcd_value")[0].children[0].data.replace(/, /g, ",").split(",");

		pesquisador.artigos.push({
			url: url,
			titulo: titulo,
			autores: autores,
			ano: ano,
			numCitacoes: numCitacoes,
			citacoesLink: citacoesLink
		});

		i++;
		status.cstart++;
		await salvarResultados();

		console.log(`Temos ${pesquisador.artigos.length} artigos do(a) ${pesquisador.nome}`);
	}
	
	return new Promise((resolve, reject) => {
		if(error) reject(error);
		resolve();
	});
}

function htmlToMetricasJSON($){
	metricas = $(".gsc_rsb_std");

	return({
		numCitacoes: {
			allTime: metricas[0].children[0].data,
			recent: metricas[1].children[0].data
		},
		h: {
			allTime: metricas[2].children[0].data,
			recent: metricas[3].children[0].data
		},
		i10: {
			allTime: metricas[4].children[0].data,
			recent: metricas[5].children[0].data
		}
	});
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

process.on('SIGINT', async () => {
	console.log("Alguém apertou ctrl-c");
	process.exit();
});

bora();
// k();
// async function k(){
// 	let r = await getRequest("https://scholar.google.com.br/citations?user=tVWiGicAAAAJ&hl=pt-BR&oe=ASCII&cstart=0&pagesize=100");
// 	let $ = cheerio.load(r);
// 	g = await htmlToArtigosJSON($);
// 	console.log(g[0].titulo);
// 	console.log(g[1].titulo);
// }