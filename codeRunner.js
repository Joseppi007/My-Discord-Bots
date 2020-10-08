const Discord = require("discord.js");
const bot = new Discord.Client();
const token = "NzE3MDEzODY3OTE3NzM4MDA5.Xteyog.0Jfdl_jNI4pQuJDgr8UoG4B03x4";
const prefix = '!'; // The character before the commands

let headers = [];

bot.on("ready",()=>{console.log("The bot has gone online.")}); // Outputted to console to alert readyness
bot.on("message",msg=>{ // When the bot gets a message
	if (msg.content.slice(0,prefix.length)==prefix) { // Check for the prefix
		let lines = msg.content.split("\n"); // Split each new line
		let args = lines[0].toLowerCase().slice(prefix.length).split(" "); // Split each word of the first line
		let code;
		let return_values;
		let codeText;
		let messageToSend;
		switch (args[0]) { // Check for commands
			case "run": // On the "run" command
				code = lines.filter(line=>true); // Copy code block
				code.pop(); // Get rid of the last line ('```')
				code = code.slice(2); // Get rid of the first and second line ('!run\n```javascript')
				return_values = []; // Create an array for return values - Make a return value with a line like this ('2+2')
				codeText = code.reduce((textSoFar,codeLine)=>{return textSoFar+codeLine+"\n"},""); // Make code back into one piece
				if (headers.length>0) {
					codeText = headers.reduce((a,h)=>(a+h))+codeText;//Append headers to codeText
				}
				
				function say (something) { // Used in code rather than console.log because Discord is not the console.
					return_values.push(something);
				}
				try{eval(codeText);}catch{say("An error has occured.");} // Run the code - Yeah, it's that easy.
				
				console.log(return_values);
				return_values = return_values.filter(val=>(val!=undefined)); // Get rid of undefined lines
				messageToSend = return_values.reduce((a,b)=>{return (a=="")?b:(a+"\n"+b);},""); // Return each value in sequence
				console.log(messageToSend);
				msg.channel.send(messageToSend);
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
				break;
			default: // On an invalid command
				msg.channel.send("Use the !run or !header command, followed by a javascript code block.");
				break;
		}
	}
});
bot.login(token); // Start the bot up