const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const brain = require('brain.js')

const app = express();

const port = 6789;

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

/*
 	citire intrebari din fisierul json
*/
const fs = require('fs');
let rawdata = fs.readFileSync('intrebari.json');
let intrebare = JSON.parse(rawdata);
let listaIntrebari = [];
for(var i=0; i < intrebare.intrebari.length;i++)
	listaIntrebari.push(intrebare.intrebari[i])

// 1=> sanatos    0.5=> racit,    0 => covid
var data = [{ input: {a: 1.0, b: 1.0}, output:{h: 1.0}},
    { input: {a: 1.0, b: 0.0}, output:{h: 0.5}},
    { input: {a: 0.0, b: 0.0}, output:{h: 0.0} }
]

var net = new brain.NeuralNetwork();

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req,res) => {
    res.render('index');
});

app.get('/chestionar', (req, res) => {
	res.render('chestionar', {intrebari: listaIntrebari});
});


app.post('/rezultat-chestionar', (req, res) => {
    
	let gust, miros, frisoane, probResp, DCap, varsta;
    let out = "";
    let result ;

    if(JSON.stringify(req.body.type0) == "\"sub 20 ani\""){
        varsta = 20;
    }else if(JSON.stringify(req.body.type0) == "\"intre 20 si 50 ani\""){
        varsta = 35;
    }else{
        varsta = 50;
    }

    if(JSON.stringify(req.body.type1) == "\"Nu\""){
        gust = 0.0;
    }else{
        gust = 1.0;
    }

    if(JSON.stringify(req.body.type2) == "\"Nu\""){
        frisoane = 0.0;
    }else{
        frisoane = 1.0;
    }
    if(JSON.stringify(req.body.type3) == "\"Nu\""){
        miros = 0.0;
    }else{
        miros = 1.0;
    }
    
    if(JSON.stringify(req.body.type4) == "\"Nu\""){
        probResp = 0.0;
    }else{
        probResp = 1.0;
    }
    if(JSON.stringify(req.body.type5) == "\"Nu\""){
        DCap = 0.0;
    }else{
        DCap = 1.0;
    }
        
    const getData = async() => {
        net.train(data, {log: true});
    }

    getData().then(result =  net.run({a:gust, b:miros}).h);
    if(result <= 0.25){
        out = "O probabilitate foarte mare sa suferiti de covid!";
    }
    else if(result > 0.25 & result <= 0.75){
        out = "O probabilitate foarte mare sa suferiti de o simpla raceala!";
    }else{
        out = "Sunteti sanatos!";
    }
    
    res.render('harta', {result: out});
	
});


app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:${port}`));