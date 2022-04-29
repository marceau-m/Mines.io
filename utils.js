const fileSystem = require('fs')

/**
 * Détermine et inscrit le leaderboard en cours (top 5 de tous les joueurs connectés)
 * dans le fichier leaderboard.json
 * 
 * @param {Object} players : Dictionnaire des joueurs en jeu : {"username": {"position": ___,
 * 															    			 "size": ___,
 * 															    			 "color": ___ }, ... }
 * @returns {Object} res : Dictionnaire des joueurs du top 5 : {"players": [{"username": ___,
 * 															    	"size": ___ }, ... ]}
 */
 const update_leaderboard = (players) => {
	let sizeArr = []
	let res = {}
	res["players"] = []

	for (const [key, value] of Object.entries(players)) {
		sizeArr.push([key, value["size"]])
	}

	// Tri des joueurs selon leur taille décroissante
	sizeArr.sort((a,b) => {
		let size_a = a[1]
		let size_b = b[1]
		if (size_a > size_b) {
			return -1
		}
		if (size_a < size_b) {
			return 1
		}
		return 0
	})

	// On ne retient que les 5 premiers
	let end = 5
	if (sizeArr.length<5)
		end = sizeArr.length
	for(let i=0;i<end;i++){
		let username = sizeArr[i][0]
		let size = sizeArr[i][1]
		res["players"].push({"username":username, "size": size})
	}
	
	// Inscription dans le fichier leaderboard.json
	let data = JSON.stringify(res)
	fileSystem.writeFile("./leaderboard.json", data, err=>{
		if(err){
		  console.log("Error writing file" ,err)
		} else {
		  console.log('JSON data is written to the file successfully')
		}
	   })

	return res
}

module.exports = {update_leaderboard}