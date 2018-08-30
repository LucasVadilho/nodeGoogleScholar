const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');
const util = require('util');
let $;

const BASE_URL = "https://scholar.google.com.br";
const URL_ORGANIZACAO = BASE_URL + "/citations?view_op=view_org&hl=en&org=";
const ORGANIZACAO = {
	id: "13217906292402142721",
	nome: "Universidade Federal do ABC",
	sigla: "UFABC"
};

async function getRequest(url){	
	return new Promise((resolve, reject) => {
		https.get(url, res => {
			let body = "";
			//console.log(res.statusCode);
			//console.log(res.headers);

			res.on('data', (data) => body += data);
			res.on('end', () => {
				//fs.appendFile('teste.html', body, (e) => reject(e));
				resolve(body);
			});
			res.on('error', (e) => reject(e));
		}).on('error', (e) => reject(e));
	});
}

/*async function organizacaoParaJSON(body, organizacao){
	return new Promise(resolve => {
		$ = cheerio.load(body);
		let pesquisadores = $(".gsc_oai_name > a").toArray();
		
		let proximaPagina = $(".gs_btnPR").attr("onclick")
			.replace("window.location='", "")
			.replace("'", "")
			.replace(/\\x3d/g, "=")
			.replace(/\\x26/g, "&");

		let json = {
			id : ORGANIZACAO.id,
			proximaPagina : proximaPagina,
			pesquisadores : []
		};

		for(let i = 0; i < pesquisadores.length; i++){
			json.pesquisadores.push({
				nome : pesquisadores[i].children[0].data,
				url : $(pesquisadores[i]).attr("href")
			});
			//console.log(json);
			//console.log(pesquisadores[i].children[0].data + " | " + $(pesquisadores[i]).attr("href"));
		}
		//console.log(json);
		resolve(json);
	});
}*/

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
			//console.log(json);
			//console.log(pesquisadores[i].children[0].data + " | " + $(pesquisadores[i]).attr("href"));
		}
		//console.log(json);
		resolve(json);
	});
}

bora();

async function bora(){
	let d = new Date(Date.now());

	let dados = {
		id : ORGANIZACAO.id,
		nome : ORGANIZACAO.nome,
		sigla: ORGANIZACAO.sigla,
		data : d.toJSON(),
		proximaPagina : "/citations?view_op=view_org&org=" + ORGANIZACAO.id,
		pesquisadores : []
	};

	for(let i = 0; i < 1; i++){
	//while(dados.proximaPagina != null){
		console.log("Path: " + dados.proximaPagina + "\n" + "#Pesquisadores: " + dados.pesquisadores.length + "\n");

		let resposta = await getRequest(BASE_URL + dados.proximaPagina);
		dados = await organizacaoParaJSON(resposta, dados);
		
	/*getRequest(dados.proximaPagina)
		.then(response => organizacaoParaJSON(response, dados))
		.then(async json => {
			console.log(json);
			dados = await json;
		})
		.catch(e => console.error(e));*/
	}

	console.log("Acabou. #Pesquisadores obtidos: " + dados.pesquisadores.length);
	
	let nome = `${d.toDateString()}(${dados.sigla}).json`;// + ".json"; //`${dateToString(d)}(${dados.id}).json`;
	fs.appendFile("dados/" + nome, JSON.stringify(dados), (e) => console.error(e));
}

/*getRequest(url)
	.then(response => organizacaoParaJSON(response))
	.then(json => console.log(data = json))
	.catch(e => console.error(e));

/*
	});

	//let w = await
	return https.get(url, res => {
		let body = "";
		//console.log(res.statusCode);
		//console.log(res.headers);

		res.on('data', data => {
			body += data;
		});

		res.on('end', () => {
			$ = cheerio.load(body);
			let pesquisadores = $(".gsc_oai_name > a").toArray();
			let json = [];

			for(let i = 0; i < pesquisadores.length; i++){
				json.push({nome : pesquisadores[i].children[0].data, url : $(pesquisadores[i]).attr("href")});
				//console.log(json);
				//console.log(pesquisadores[i].children[0].data + " | " + $(pesquisadores[i]).attr("href"));
			}

			//return json;
		});
	}).on('error', e => console.log(e))
}

function extrairOrgInfo(body){
	$ = cheerio.load(body);
	
	let pesquisadores = $(".gsc_oai_name > a").toArray();
	let json;

	for(let i = 0; i < pesquisadores.length; i++){
		//json.push({nome : pesquisadores[i].children[0].data, url : $(pesquisadores[i]).attr("href")});
		console.log(pesquisadores[i].children[0].data + " | " + $(pesquisadores[i]).attr("href"));
	}

	return json;
}

let url =  URL_ORGANIZACAO + "13217906292402142721";
let k = await getRequest(url);//.then(body => console.log(body));
console.log(k);


//$(".gs_btnPR").click()

https.get('https://scholar.google.com.br/citations?view_op=view_org&hl=pt-BR&org=13217906292402142721', res => {
	//console.log(res.statusCode);
	//console.log(res.headers);

	let body = '';
	res.on('data', data => {
		body += data;
	});

	res.on('end', () => {
		fs.appendFile('teste.html', body);
		tai(body);
	});
}).on('error', e => console.log(e));

function tai(body){
	$ = cheerio.load(body);
	
	let k = $(".gsc_oai_name > a").toArray();

	for(let i = 0; i < k.length; i++){
	console.log();
		console.log(k[i].children[0].data + " | " + $(k[i]).attr("href"));
	}
}

//https://scholar.google.com.br/citations?view_op=view_org&org=13217906292402142721*/