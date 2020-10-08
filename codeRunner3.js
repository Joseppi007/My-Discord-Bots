const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const Canvas = require("canvas"); // make images
var GifEncoder = require('gif-encoder'); // make moving images (gifs)
const token = fs.readFileSync('./token.txt', 'UTF-8');
const prefix = '!'; // The character before the commands
var width = 400;  // Canvas width
var height = 225; // Canvas height
var globals = {}; // Global variubles so code can do different things each run

let headers = [];

function toBaseTen(base, value) { // Convert a string of a number in a base to base 10
	const symbols = '0123456789abcdefghijklmnopqrstuvwxyz';
	var v = (value+"").toLowerCase().split('');
	v=v.map(e=>symbols.indexOf(e));
	v.reverse();
	var accumulator = 0;
	for (let i = 0; i < v.length; i++) {
		accumulator+=Math.pow(base,i)*v[i];
	}
	return accumulator;
}

function toBase(base, value, digits=0) { // Convert a base 10 number to a base as a string
	const symbols = '0123456789abcdefghijklmnopqrstuvwxyz';
	var output = "";
	var v = value;
	var length = Math.floor(Math.log(value)/Math.log(base))+1;
	for (let i = 0; i < Math.max(length,digits); i++) {
		let number = v%base;
		output+=symbols[number];
		v-=number;
		v/=base;
	}
	return(output.split('').reverse().reduce((a,b)=>(a+b),""));//Returns output in reverse
}

function colorToValues(color) { // Turns a hex color into integers
	if (color.length==4) {
		return {r:toBaseTen(16,color[1])*17,g:toBaseTen(16,color[2])*17,b:toBaseTen(16,color[3])*17};
	}else if (color.length==7) {
		return {r:toBaseTen(16,color[1]+color[2]),g:toBaseTen(16,color[3]+color[4]),b:toBaseTen(16,color[5]+color[6])};
	}else{
		return {r:0,g:0,b:0};//Impropper color input
	}
}
function valuesToColor(values) { // Turns three r g b numbers into a hex color
	let v = values;
	v.r = Math.round(v.r);
	v.g = Math.round(v.g);
	v.b = Math.round(v.b);
	v.r = Math.min(v.r,255);
	v.g = Math.min(v.g,255);
	v.b = Math.min(v.b,255);
	v.r = Math.max(v.r,0);
	v.g = Math.max(v.g,0);
	v.b = Math.max(v.b,0);
	return('#'+toBase(16,v.r,2)+toBase(16,v.g,2)+toBase(16,v.b,2));
}
function startImage(clear=false) { // Create a canvas
	const canvas = Canvas.createCanvas(width, height);
	const context = canvas.getContext('2d');
	context.fillStyle = '#000';
	if (!clear) {
		context.fillRect(0, 0, width, height);
	}
	return(canvas);
}
function startGif (framerate=10) { // start up a gif
	// init gif stuff
	var gif = new GifEncoder(width, height);
	gif.setRepeat(0); // Repeat infinity times
	gif.setFrameRate(framerate);
	
	// Output collection
	var file = fs.createWriteStream('image.gif');
	gif.pipe(file);
	
	gif.writeHeader(); // I don't know what this does, but I think we need it.
	
	return gif;
}
function gifAddFrame (gif,/*pixels*/ctx/*canvas object's context 2d*/) { // add a frame to a gif
	//gif.addFrame(pixels); // I want to change this. Right now, pixels should be formatted [r,g,b,a,r,g,b,a,r,g,b,a, ... r,g,b,a]
						    // My plan is to add a canvas' ctx 2d. This'll do for now.
	//The new thing:
	gif.addFrame(ctx.getImageData(0,0,width,height).data);
}
function loadText (filename) { // Load a text file (filename.txt) from the CodeRunnerSaves folder
	return fs.readFileSync('./CodeRunnerSaves/'+filename+'.txt', 'UTF-8');
}
function saveText (filename, write="") { // Save a text file (filename.txt) to the CodeRunnerSaves folder
	fs.writeFileSync('./CodeRunnerSaves/'+filename+'.txt', write);
}
function headText (filename) { // Load a text file (filename.txt) from the CodeRunnerSaves folder and make it a header
	headers.push(loadText(filename));
}
function run(codeText,msg) {
	
	function showImage(canvas) { // Turn a canvas into an image and attach it
		const buffer = canvas.toBuffer('image/png');
		fs.writeFileSync('./image.png', buffer);
		attachment = new Discord.MessageAttachment('./image.png');//('https://i.imgur.com/w3duR07.png');
		msg.channel.send(attachment);
	}
	
	function showGif (gif) {
		gif.finish();
		attachment = new Discord.MessageAttachment('./image.gif');
		msg.channel.send(attachment);
	}
	
	function getRole (name) { // Get a role
		var role = msg.member.guild.roles.cache.find(role => role.name === name);
		msg.member.roles.add(role);
	} // https://stackoverflow.com/questions/49599732/add-user-to-role-with-newest-discord-js
	
	return_values = []; // Create an array for return values - Make a return value with a line like this ('2+2')
	
	if (headers.length>0) {
		codeText = headers.reduce((a,h)=>(a+h))+codeText;//Append headers to codeText
	}
	
	function say (something) { // Used in code rather than console.log because Discord is not the console.
		return_values.push(something);
	}
	
	try{eval(codeText);}catch (error){say("An error has occured. "+error);} // Run the code - Yeah, it's that easy.
	
	console.log(return_values);
	return_values = return_values.filter(val=>(val!=undefined)); // Get rid of undefined lines
	messageToSend = return_values.reduce((a,b)=>{return (a=="")?b:(a+"\n"+b);},""); // Return each value in sequence
	console.log(messageToSend);
	if (messageToSend!="") {msg.channel.send(messageToSend);}
}

bot.on("ready",()=>{console.log("The bot has gone online.\nThat's fun!")}); // Outputted to console to alert readyness
bot.on("message",msg=>{ // When the bot gets a message

	if (msg.content.slice(0,prefix.length)==prefix) { // Check for the prefix
		let lines = msg.content.split("\n"); // Split each new line
		let args = lines[0].slice(prefix.length).split(" "); // Split each word of the first line
		let code;
		let return_values;
		let codeText;
		let messageToSend;
		switch (args[0].toLowerCase()) { // Check for commands
			case "run": // On the "run" command
				code = lines.filter(line=>true); // Copy code block
				code.pop(); // Get rid of the last line ('```')
				code = code.slice(2); // Get rid of the first and second line ('!run\n```javascript')
				codeText = code.reduce((textSoFar,codeLine)=>{return textSoFar+codeLine+"\n"},""); // Make code back into one piece
				run(codeText,msg);
				break;
			case "header": // On the "header" command -- Run this code before all run commands -- classes and functions
				code = lines.filter(line=>true); // Copy code block
				code.pop(); // Get rid of the last line ('```')
				code = code.slice(2); // Get rid of the first and second line ('!run\n```javascript')
				return_values = []; // Create an array for return values - Make a return value with a line like this ('2+2')
				codeText = code.reduce((textSoFar,codeLine)=>{return textSoFar+codeLine+"\n"},""); // Make code back into one piece
				headers.push(codeText);
				break;
			case "reset": // Empty headers
				headers=[];
				globals = {};
				break;
			case "example":
				msg.channel.send("\\!run\n\\`\\`\\`javascript\nlet canvas = startImage();\nlet context = canvas.getContext('2d');\ncontext.fillStyle=valuesToColor({r:200,g:100,b:150});\ncontext.font = \"30px Arial\";\ncontext.fillText(\"Hello World\",10,40);\nshowImage(canvas);\n\\`\\`\\`");
				break;
			case "docs":
			case "help":
				msg.channel.send(fs.readFileSync('codeRunner3doc.txt', 'UTF-8'));
				break;
			default: // On an invalid command - try running as function
				args_copy = args.filter(a=>true);
				args_copy = args_copy.slice(1); // Get rid of the 0th element
				let codeToRun = (args[0]+"("+((args_copy.length==0)?"":args_copy.reduce((a,b)=>(a+","+b)))+");"); // Generate code to run
				console.log(codeToRun);
				try{run(codeToRun,msg);}catch{msg.channel.send("Use the !run or !header command, followed by a javascript code block.\n!reset to clear headers\n!example");}
				break;
		}
	}
});
bot.login(token); // Start the bot up