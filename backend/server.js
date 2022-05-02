// INIT LIBS

	const express = require('express')
	const app = express()
	const server = require('http').createServer(app)
	const io = require('socket.io')(server)

	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Credentials', 'true')
		res.header('Access-Control-Allow-Origin', req.get('origin'))
		next()
	});

	app.use(express.static('dist'))

	app.get('/', function(req, res){
		res.sendFile(__dirname + '/dist/index.html');
	})
	
	const pseudoList = [
		'Luke Skywalker',
		'Aragorn',
		'Frodon',
		'Legolas',
		'Han Solo',
		'Indiana Jones',
		'James Bond',
		'Ellen Ripley',
		'Rocky Balboa',
		'Spartacus',
		'Superman',
		'Obi-Wan Kenobi',
		'Zorro',
		'Batman',
		'IronMan',
		'Captain America',
		'Terminator',
		'Hannibal Lecter',
		'Darth Vader',
		'HAL 9000',
		'Alien',
		'Freddy Krueger',
		'The Joker',
		'Hans Gruber',
		'John McClane',
		'Harry Potter',
		'Voldemort',
		'Thor',
		'Spider-Man',
		'Black Panther',
		'Doctor Strange',
		'Hulk',
		'Jack Sparrow',
		'Neo',
		'Morpheus',
		'Trinity'
	]

	let rooms = {}

	function getPseudo(namespace){
		let tmp = pseudoList[Math.floor(Math.random()*pseudoList.length)];
		if(namespace in rooms){
			while(rooms[namespace].includes(tmp)) {
				tmp = pseudoList[Math.floor(Math.random()*pseudoList.length)];
			}
			rooms[namespace].push(tmp)
		}else{
			rooms[namespace] = [tmp]
		}
		return tmp
	}

// SOCKET *******************************

	io.of(/^\/[0-9]*/).on("connection", (socket) => {
		const namespace = socket.nsp.name

		let pseudo = getPseudo(namespace)
		socket.emit('welcome', (pseudo));

		socket.on('messageSent', (pseudo, message) => {
			let currentdate = new Date();
			socket.broadcast.emit('newMessage', pseudo, message, currentdate)
		})
	});

// Listen the Server
	server.listen(8088)
