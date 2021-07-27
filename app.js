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
    
	console.log(req.body);
    
    var result ; //"Varsta: " + JSON.stringify(req.body.type0) +
     //"<br> Gust: " + JSON.stringify(req.body.type1) +
      //"<br> Frisoane: " + JSON.stringify(req.body.type2) +
       //"<br> Miros: " + JSON.stringify(req.body.type3) +
       //"<br> Probleme respiratorii: " + JSON.stringify(req.body.type4) +
       //"<br> Durere de cap: " + JSON.stringify(req.body.type5) ;

    const getData = async() => {
        net.train(data, {log: true});
    }

    getData().then(result =  net.run({a:1.0, b:0.0}).h);
    
    res.render('harta', {result: result});
	
});

app.get('/harta', (req, res) =>{
    res.render('harta');
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:${port}`));