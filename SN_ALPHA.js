'use strict';
const Discord=require('discord.js');
const bot=new Discord.Client({
	disabledEvents: [
		'PRESENCE_UPDATE',
		'VOICE_STATE_UPDATE',
		'TYPING_START',
		'VOIVE_SERVER_UPDATE',
		'RELATIONSHIP_ADD',
		'RELATIONSHIP_REMOVE'
	]
});
const tz=require('moment-timezone');
const sql=require('sqlite');
const moment=require('moment');
sql.open('./files/dataBase.sqlite');

bot.Pound_Level='UNVERIFY';
bot.Command_Channel='404085124301324289';
bot.Timezone='America/New_York';
bot.Webhook_ID='456265335524294677';
bot.Webhook_Token='';
bot.AdminRoleID='266988240169336843';
bot.ModRoleID='339753548629671939';
bot.Whitelist='210748774673285120 365975655608745985 237254944774815745 433821771360239617 346452329974857731 210748774673285120 208639651445997568 223160456792113152 231013798494994432 379692638233690113 206594180124770305 236954939706966017 329584924573040645',

bot.PREFIX='!'
bot.NAME='SpoofNinja-ALPHA'
bot.ID='379692638233690113',
bot.TOKEN='';
bot.ENFORCER_ID='420985276358197248';
bot.OWNER_ID='329584924573040645';
bot.HOME_SERVER_ID='266738315380785152';
bot.HOME_SERVER_NAME='';
bot.GOODCOLOR='00FF00';
bot.WARNINGCOLOR='FF9900';
bot.DANGERCOLOR='#FF0000';
bot.SNIPE_IMG='https://i.imgur.com/dzvklbi.png';
bot.LEFT_IMG='https://i.imgur.com/HVRacGU.jpg?1';
bot.APPROVED_IMG='https://i.imgur.com/LVlq97j.png';
bot.WHCHAN=new Discord.WebhookClient(bot.Webhook_ID, bot.Webhook_Token);

bot.time=function(){let timeNow=new Date().getTime(); return moment.tz(timeNow,bot.Timezone).format('dddd, MMMM Do, h:mm A');}

bot.on('ready', () => {console.info('Now Checking '+bot.guilds.size+' Blacklisted Servers.');bot.user.setPresence({'status':'invisible'});});

function checkUser(userID){
	let botInServer='', userInServer='', foundServers='', index='';
	let guilds=bot.guilds.map(g => g);
	guilds.forEach((guild) => {
		userInServer=guild.members.get(userID);
		if(userInServer){foundServers+='`'+guild.name+'`,';}
	});
	foundServers=foundServers.slice(0, -1).split(',').slice(1);
	foundServers=foundServers.toString().replace(',','\n');
	return foundServers;
}

bot.on('guildMemberAdd', member => {
	//if(bot.Whitelist.indexOf(member.id)>=0){return;}
	let foundServers=checkUser(member.id), guild=member.guild, richEmbed='', uName='';
	let userInHomeServer=bot.guilds.get(bot.HOME_SERVER_ID).members.get(member.id);
	if(member.nickname){uName=member.nickname;}
	else{uName=member.user.username}
	if(!userInHomeServer){return;}
	else{
		if(member.guild.id===bot.HOME_SERVER_ID && foundServers){
			richEmbed=new Discord.RichEmbed().setColor('ff0000')
			.setTitle('❌ **'+uName+' Is In Blacklisted Servers**').setThumbnail(member.user.displayAvatarURL)
			.addField('User:', '<@'+member.id+'>', true).addField('UserID:', member.id, true)
			.addField('Blacklisted Server(s):', foundServers, false)
			.setFooter(bot.time());
			bot.WHCHAN.send(richEmbed).catch(console.error);
		}
		else{
			if(foundServers){
				richEmbed=new Discord.RichEmbed().setColor('ff0000')
				.setTitle('❌ **'+uName+' Has Joined a Blacklisted Server**').setThumbnail(member.user.displayAvatarURL)
				.addField('User:', '<@'+member.id+'>', true).addField('UserID:', member.id, true)
				.addField('Blacklisted Server(s):', foundServers, false)
				.setFooter(bot.time());
				bot.WHCHAN.send(richEmbed).catch(console.error).then(m => {
					if(member.roles.has('267727130874478597')){return;}
					else{
						sql.run(`INSERT INTO spoofninja (UserID, GuildID, BadGuildName, Punishment) VALUES (?, ?, ?, ?)`,
							[member.id, member.guild.id, member.guild.name, 'BPM_WARN']);
						setTimeout(function(){
							foundServers='';
							foundServers=checkUser(member.id);
							if(foundServers){
								sql.run(`INSERT INTO spoofninja (UserID, GuildID, BadGuildName, Punishment) VALUES (?, ?, ?, ?)`,
									[member.id, member.guild.id, member.guild.name, bot.Pound_Level]);
								return;
							}
							else{
								sql.run(`INSERT INTO spoofninja (UserID, GuildID, BadGuildName, Punishment) VALUES (?, ?, ?, ?)`,
									[member.id, member.guild.id, member.guild.name, 'LEFT_BPM']);
								return;
							}
						}, 900000);
					}
				});
			}
		}
	}
});

bot.on('guildMemberRemove', member => {
	//if(bot.Whitelist.indexOf(member.id)>=0){return;}
	let foundServers=checkUser(member.id), guild=member.guild, richEmbed='', uName='';
	let userInHomeServer=bot.guilds.get(bot.HOME_SERVER_ID).members.get(member.id);
	if(member.nickname){uName=member.nickname;}else{uName=member.user.username}
	if(!userInHomeServer){return;}
	else{
		if(foundServers){
			foundServers='**None**';
			richEmbed=new Discord.RichEmbed().setColor('ffa100')
			.setTitle('✅ **'+uName+' Has Left '+member.guild.name+'**').setThumbnail(member.user.displayAvatarURL)
			.addField('User:', '<@'+member.id+'>', true).addField('UserID:', member.id, true)
			.addField('Blacklisted Server(s):', foundServers, false)
			.setFooter(bot.time());
			return bot.WHCHAN.send(richEmbed).catch(console.error);
		}
		else{
			if(!foundServers){
				richEmbed=new Discord.RichEmbed().setColor('00ff00')
				.setTitle('✅ **'+uName+' Has Left All Blacklisted Servers**').setThumbnail(member.user.displayAvatarURL)
				.addField('User:', '<@'+member.id+'>', true).addField('UserID:', member.id, true)
				.setFooter(bot.time());
				return bot.WHCHAN.send(richEmbed).catch(console.error);
			}
		}
	}
});

bot.on('message', message => {
	let richEmbed='';
	if(!message.content.startsWith(bot.PREFIX)){return;}
	if(message.channel.id!==bot.Command_Channel){return;}
	if(message.member.roles.has(bot.AdminRoleID) || message.member.roles.has(bot.ModRoleID) || message.member.id===bot.OWNER_ID){
		let guild=message.member.guild, uName='';
		let args=message.content.split(' ').slice(1), command=message.content.split(' ')[0].slice(bot.PREFIX.length);
		if(command==='status'){
			richEmbed=new Discord.RichEmbed().setColor('00ff00')
			.setTitle('**'+bot.NAME+', Standing By.**').setThumbnail(bot.LEFT_IMG);
			return bot.WHCHAN.send(richEmbed).catch(console.error);
		}
		if(command==='help' || command==='commands'){
			let daColor=config.goodColor; daColor=daColor.slice(1); daColor='0x'+daColor;
			if(!args[0]){
				richEmbed=new Discord.RichEmbed().setColor('00ff00')
				.setTitle('**Available Commands**').setThumbnail(bot.LEFT_IMG)
				.addDescription('`'+bot.PREFIX+'check @mention or userid`\n`'+bot.PREFIX+'check @JohnDoe#1234`\n`'+bot.PREFIX+'check server`\n`'+bot.PREFIX+'check 237597448032354304`\n');
				return bot.WHCHAN.send(richEmbed).catch(console.error);
			}
		}
		if(command==='check'){
			if(bot.Whitelist.indexOf(args[0])>=0){
				richEmbed=new Discord.RichEmbed().setColor('ff0000').setDescription('That user is whitelisted.');
				return bot.WHCHAN.send(richEmbed).catch(console.error);
			}
			let member=message.guild.members.get(args[0]);
			if(member){if(member.nickname){uName=member.nickname;}else{uName=member.user.username;}}
			if(args[0]==='server' || args[0]==='all'){
				let members=message.guild.members.map(m => m.id);
				members.forEach((id) => {
					if(bot.Whitelist.indexOf(id)<0){
						let foundServers=checkUser(id);
						if(foundServers){
							setTimeout(function(){
								member=message.guild.members.get(id); foundServers=foundServers.replace(/,/g,'\n');
								if(member.nickname){uName=member.nickname;}else{uName=member.user.username}
								richEmbed=new Discord.RichEmbed().setColor('ff0000')
								.setTitle('❌ **'+uName+' Is In Blacklisted Servers**').setThumbnail(bot.SNIPE_IMG)
								.addField('User:', '<@'+member.id+'>', true).addField('UserID:', member.id, true)
								.addField('Blacklisted Servers:', foundServers, false)
								.setFooter(bot.time());
								return bot.WHCHAN.send(richEmbed).catch(console.error);
							},2000);
						}
					}
				});
			}
			else if(isNaN(args[0])===false && args[0].length===18){
				let foundServers=checkUser(args[0]);
				if(member){
					if(foundServers){
						richEmbed=new Discord.RichEmbed().setColor('ff0000')
						.setTitle('❌ **'+uName+' Is In Blacklisted Servers**').setThumbnail(bot.SNIPE_IMG)
						.addField('User:', '<@'+member.id+'>', true).addField('UserID:', member.id, true)
						.addField('Blacklisted Servers:', foundServers, false)
						.setFooter(bot.time());
						return bot.WHCHAN.send(richEmbed).catch(console.error);
					}
					else{
						richEmbed=new Discord.RichEmbed().setColor('00ff00').setThumbnail(bot.APPROVED_IMG)
						.setTitle('✅ **'+uName+' appears to be a trustworthy Trainer.**')
						.setDescription('**No memberships to blacklisted servers were found at this time.**')
						.addField('User:', '<@'+member.id+'>', true).addField('UserID:', member.id, true);
						return bot.WHCHAN.send(richEmbed).catch(console.error);
					}
				}
				else{
					bot.fetchUser(args[0]).then(user => {
						if(foundServers){
							richEmbed=new Discord.RichEmbed().setColor('ff0000')
							.setTitle('❌ **'+user.username+' Is In Blacklisted Servers**').setThumbnail(bot.SNIPE_IMG)
							.addField('User:', '<@'+user.id+'>', true).addField('UserID:', user.id, true)
							.addField('Blacklisted Servers:', foundServers, false)
							.setFooter(bot.time());
							return bot.WHCHAN.send(richEmbed).catch(console.error);
						}
						else{
							richEmbed=new Discord.RichEmbed().setColor('00ff00').setThumbnail(bot.APPROVED_IMG)
							.setTitle('✅ **'+user.username+' appears to be a trustworthy Trainer.**')
							.setDescription('**No memberships to blacklisted servers were found at this time.**')
							.addField('User:', '<@'+user.id+'>', true).addField('UserID:', user.id, true);
							return bot.WHCHAN.send(richEmbed).catch(console.error);
						}
					});
				}
			}
			else{
				richEmbed=new Discord.RichEmbed().setColor('ff0000').setDescription('That is not a valid check option.');
				return bot.WHCHAN.send(richEmbed).catch(console.error);
			}
		}
		if(command==='test'){
			sql.run(`INSERT INTO spoofninja (UserID, GuildID, BadGuildName, Punishment) VALUES (?, ?, ?, ?)`,
		    [message.member.id, message.member.guild.id, message.member.guild.name, 'SNTEST']);
			return;
		}
	}

	else{
		richEmbed=new Discord.RichEmbed().setColor('ff0000').setDescription('You do not have permission to use that command.');
		return bot.WHCHAN.send(richEmbed).catch(console.error);
	}
});
// BOT LOGIN TO DISCORD
bot.login(bot.TOKEN);
