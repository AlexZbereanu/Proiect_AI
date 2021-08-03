const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const brain = require('brain.js')
const mysql = require('mysql');
const app = express();

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    port: 3306,
    database: "training"
});

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

var net = new brain.NeuralNetwork();
var info=[]; // ! pentru scriere in bd
var data ; // ! pentru citire din bd

app.get('/', (req,res) => {
    res.render('index');
});

app.get('/chestionar', (req, res) => {
	res.render('chestionar', {intrebari: listaIntrebari});
});

app.get('/articole', (req, res) => {
    res.render('articole', {});
});

app.get('/index', (req, res) => {
    res.render('index', {});
});

app.get('/despre', (req, res) => {
    res.render('despre', {});
});

app.get('/contact', (req, res) => {
    res.render('contact', {});
});

app.get('/covid', (req, res) => {
    res.render('covid', {});
});

app.get('/covid1', (req, res) => {
    res.render('covid1', {});
});

app.get('/flu', (req, res) => {
    res.render('flu', {});
});

app.get('/seama', (req, res) => {
    res.render('seama', {});
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
        miros = 0.0;
    }else{
        miros = 1.0;
    }

    if(JSON.stringify(req.body.type3) == "\"Da\""){
        frisoane = 0.0;
    }else{
        frisoane = 1.0;
    }
    
    if(JSON.stringify(req.body.type4) == "\"Da\""){
        probResp = 0.0;
    }else{
        probResp = 1.0;
    }

    if(JSON.stringify(req.body.type5) == "\"Da\""){
        DCap = 0.0;
    }else{
        DCap = 1.0;
    }
        
    const getData = async() => {
        net.train(data, {log: true});
    }
    //console.log(net.run({a:varsta, b:gust, c:miros, d: frisoane, e: probResp, f: DCap}));

    getData().then(result =  net.run({a:varsta, b:gust, c:miros, d: frisoane, e: probResp, f: DCap}));
    if(result.h <= 0.25){
        out = "O probabilitate foarte mare sa suferiti de covid!";
    }
    else if(result.h > 0.25 & result.h <= 0.75){
        out = "O probabilitate foarte mare sa suferiti de o simpla raceala!";
    }else{
        out = "Sunteti sanatos!";
    }
    
    res.render('harta', {result: out});
	
});

app.get('/adaugare_date',(req,res)=>{

    fs.readFile('training.txt', (err, data) => {
        if (err) throw err;
        var array = data.toString().split("\n")
        for (let i=0;i<array.length;i++) {
            let temp = array[i].split(" ")
            info[i]=[]
            for (let j=0;j<temp.length;j++){
                info[i][j] = temp[j];
            }
            con.query("INSERT INTO `simptone`( `varsta`, `gust`, `miros`, `frisoane`, `probleme_respiratorii`, `dureri_de_cap`, `output`)\
            VALUES ('" + info[i][0] + "','" + info[i][1] + "','" + info[i][2] + "','" + info[i][3] + "','" + info[i][4] + "','" + info[i][5] + "','" + info[i][6] + "')", (err, result) => {
                if (err) throw err;
            })
            
        }
    })
    res.redirect('/extragere_date');
})

app.get('/error',(req,res)=>{
    res.send("some error");
    
})
app.get('/extragere_date',(req,res)=>{
    var date ='[';
    const promise = new Promise((resolve,reject)=>{
        con.query("SELECT  `varsta`, `gust`, `miros`, `frisoane`, `probleme_respiratorii`, `dureri_de_cap`, `output` FROM `simptone` WHERE 1",(err,result)=>{
            if(err) reject(err);
            informatii=JSON.parse(JSON.stringify(result))
            //console.log(informatii.length)
            for(let i=0;i<informatii.length-1;i++){
                let inputt = {
                    "a": informatii[i].varsta,
                    "b": informatii[i].gust,
                    "c": informatii[i].miros,
                    "d": informatii[i].frisoane,
                    "e": informatii[i].probleme_respiratorii,
                    "f": informatii[i].dureri_de_cap
                }
                let outputt={
                    "h": informatii[i].output
                }
    
                date += '{'; 
                date += '\"input\":';
                date += (JSON.stringify(inputt));
                date +=',';
                date +='\"output\":';
                date += (JSON.stringify(outputt));
                date +='},';
                //console.log(date);   
                
            }
            let inputt = {
                "a": informatii[informatii.length-1].varsta,
                "b": informatii[informatii.length-1].gust,
                "c": informatii[informatii.length-1].miros,
                "d": informatii[informatii.length-1].frisoane,
                "e": informatii[informatii.length-1].probleme_respiratorii,
                "f": informatii[informatii.length-1].dureri_de_cap
            }
            let outputt={
                "h": informatii[informatii.length-1].output
            }
    
            date += '{'; 
            date += '\"input\":';
            date += (JSON.stringify(inputt));
            date +=',';
            date +='\"output\":';
            date += (JSON.stringify(outputt));
            date +='}]';
            //console.log(date);
           // console.log("in promise ")
            //data=JSON.parse(JSON.stringify(date));
           // console.log(date);
            resolve(date)
        })
    }).then(value=>{
        //console.log("in primul then ")
        //console.log(value)
    
    
        data=JSON.parse(value);
        
        //console.log(data);
    
    }).then( () =>{ 
       // console.log("in al doilea then");
        //console.log(data);
        res.redirect('/chestionar')

    })
    .catch(err=>{
        console.log(err)
        res.redirect('/error')
    });    
})

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:${port}`));