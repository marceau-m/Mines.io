'use strict';

const express = require('express');
const socketIO = require('socket.io');
const fileSystem = require('fs')
const utils = require('./utils.js')

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use(express.static(__dirname))
  .use(express.json())
  .get('/', (req, res) => res.sendFile('/login.html', { root: __dirname }))
  .get('/test', (req, res) => res.sendFile('/Game.html', { root: __dirname }))
  .get('/death', (req, res) => res.sendFile('/GameOver.html', { root: __dirname }))

  // --- API ---
  .get('/api', (req, res) => res.sendFile('/docs.html', { root: __dirname }))
  .get('/leaderboard', (req,res) => {
	// Renvoie le leaderboard
	  utils.update_leaderboard(players)
	  fileSystem.readFile('./leaderboard.json', 'utf8', (err, data) => {
		res.set('Content-Type', 'application/json');  
		res.status(200).json(JSON.parse(data))
	  })
  })
  .get('/users', (req,res) => {
	// Renvoie la liste des joueurs
	res.status(200).json(players)
  })
  .get('/users/:name', (req,res) => {
	// Renvoie la liste des joueurs
	res.status(200).json(players[req.params.name])
  })
  .post('/users', (req,res) => {
	// Ajoute un joueur et renvoie la nouvelle liste des joueurs
	let name = Object.entries(req.body)[0][0]
	let prop = Object.entries(req.body)[0][1]
	players[name] = prop
	console.log("New player " + JSON.stringify(req.body) + " created successfully!")
	res.status(200).json(players)
  })
  .put('/users/:name', (req,res) => {
	// Modifie les propriétés d'un joueur et renvoie le joueur modifié
	let name = req.params.name
	players[name]["position"] = req.body.position
	players[name]["size"] = req.body.size
	players[name]["color"] = req.body.color
	console.log("Player " + name + " modified successfully!")
	res.status(200).json(players[name])
  })
  .delete('/users/:name', (req,res) => {
	// Supprime un joueur et renvoie la nouvelle liste des joueurs
	let name = req.params.name
	delete players[name]
	console.log("Player " + name + " deleted successfully!")
	res.status(200).json(players)
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

var players = {};
var foods = [[5,5],[5,-5]];
//taille du terrain
let size = 4000;

for(let i=0; i<size*size/5000; i++){
	foods.push([Math.floor(Math.random()*size-size/2),Math.floor(Math.random()*size-size/2)]);
}
//console.log(foods);
const vitesse = (size)=>{}

io.on('connection', function (socket) {
  //permet de creer un nouveau joueur
	socket.on('newPlayer', function (infPlayer) {
		players[infPlayer['name']] = {"position":[Math.floor(Math.random()*size-size/2),Math.floor(Math.random()*size-size/2)],"size":30,"color":infPlayer['color'],"time":new Date()};
	});
  	// On donne les donnée joeurs
	socket.emit('recupererInfos', players);
	// On donne les foods
	socket.emit('recupererFoods', foods);

	// login
	socket.on('Credential', function (cred){
		console.log(cred.pseudo)
		console.log(cred.color)
	});
	
    // Quand on reçoit une nouvelle coo
	socket.on('newPacket', function (packet) {
		//update position
		var prev_time=players[packet["name"]]["time"]
		players[packet["name"]]["time"]=new Date()
		var delta_t=players[packet["name"]]["time"]-prev_time
		players[packet["name"]]["position"][0] += packet["direction"][0] * 30*delta_t/1000 * 20/Math.sqrt(players[packet['name']]["size"]);
		players[packet["name"]]["position"][1] += packet["direction"][1] * 30*delta_t/1000 * 20/Math.sqrt(players[packet['name']]["size"]);

		//check bordure terrain
		if (players[packet["name"]]["position"][0] > size/2){
			players[packet["name"]]["position"][0] = size/2
		}
		if (players[packet["name"]]["position"][1] > size/2){
			players[packet["name"]]["position"][1] = size/2
		}
		if (players[packet["name"]]["position"][0] < -size/2){
			players[packet["name"]]["position"][0] = -size/2
		}
		if (players[packet["name"]]["position"][1] < -size/2){
			players[packet["name"]]["position"][1] = -size/2
		}

		//check for food
		foods.forEach(e =>{
			if ((Math.sqrt((e[0]-players[packet["name"]]["position"][0])**2 + (e[1]-players[packet["name"]]["position"][1])**2)) < players[packet["name"]]["size"]/2){
				foods = foods.filter(function(f) { return f !== e })
				foods.push([Math.floor(Math.random()*size-size/2),Math.floor(Math.random()*size-size/2)]);
				players[packet["name"]]["size"] += 0.3;	
			}
		})

		//check for collision
		for (var player in players){
			if (player != packet["name"] && players[packet["name"]]){
				if ((Math.sqrt((players[player]["position"][0]-players[packet["name"]]["position"][0])**2 + (players[player]["position"][1]-players[packet["name"]]["position"][1])**2)) < (players[player]["size"] + 0.9*players[packet["name"]]["size"])/2){
					if (players[packet["name"]]["size"] <= players[player]["size"]){
						players[player]["size"]=Math.sqrt(Math.pow(players[player]["size"],2)+Math.pow(players[packet["name"]]["size"],2));
						socket.emit('goDeath',"req");
						delete players[packet["name"]];
					}
				}
				}
			}
		

		// On envoie à tous les clients connectés 
		socket.emit('recupererInfos', players);
		socket.emit('recupererFoods', foods);
		socket.emit('sendPacket')
	});
});



