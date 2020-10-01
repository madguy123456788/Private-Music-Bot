const ytdl = require('ytdl-core');
//const prefix = process.env.PREFIX || "!";
module.exports = {
    name: "play",
    description: "Play a Song",
    args: true,
    usage: "<Youtube URL>",
    guildOnly: true,
    execute(message, args) {
        const voiceChannel = message.member.voiceChannel;
        const voiceinformation = { stopping: false, requesters: [] };
        console.log(`[${new Date()}] Play Command Executed by ${message.author.username}`);

        //if (message.guild.voiceData) return message.reply(`Please \`${prefix}stop\` the current Song Before Playing something New!`);

        if (message.guild.voiceProcessing) return message.reply("I'm Currently Building the Song Queue! Please wait a bit and try again");

        if (!message.guild.voiceData) {
            if (!voiceChannel) return message.reply("Please join a Voice Channel Before Running this Command!");
            message.guild.voiceProcessing = true;
            console.log(`[${new Date()}] Building Song Queue for Server "${message.guild.name}"...`);

            voiceinformation.channel = voiceChannel;
            var playqueue = [ args[0] ];
            voiceinformation.queue = playqueue;
            voiceinformation.requesters.push(message.member);

            if(!ytdl.validateURL(args[0])) return message.reply("Please enter a valid Youtube URL!");

            voiceChannel.join().then(async function(connection) {
                voiceinformation.connection = connection;
                var info = await ytdl.getBasicInfo(playqueue[0]);
                var title = info.videoDetails.title;
                let stream = ytdl(playqueue[0], { filter: 'audioonly', highWaterMark: 1<<25 });
                var time = `${Math.floor(info.videoDetails.lengthSeconds / 60)}:${info.videoDetails.lengthSeconds - (Math.floor(info.videoDetails.lengthSeconds / 60) * 60)}`
                let dispatcher = connection.playStream(stream);
                voiceinformation.dispatcher = dispatcher;
                message.guild.voiceData = voiceinformation;
                message.guild.voiceProcessing = undefined;
                //message.channel.send(`**Now Playing: ${playqueue[0]}**`)
                var requester = voiceinformation.requesters[0].nickname || voiceinformation.requesters[0].user.username
                const embed = {
                	title: "Now Playing",
                	color: 0xFF0000,
                	fields: [
                			{ name: "Title", value: title || "Error Getting Title" },
                            { name: "Youtube URL", value: playqueue[0] },
                            { name: "Length", value: time },
                            { name: "Requester", value: requester }
                		],
                	timestamp: new Date(),
                	footer: { text: `${message.client.user.username} • Brought to you By ${message.member.nickname || message.member.user.username}` }
                };
                
                message.channel.send({ embed: embed });
                console.log(`[${new Date()}] Song Queue Built for Server: "${message.guild.name}". Now Playing "${title}"[${playqueue[0]}]`);
                //message.channel.send(`**Now Playing ${title || playqueue[0]}**`);

                dispatcher.on('end', () => {
                    module.exports.nextSong(message);
                });
            });
        } else {
            if(!ytdl.validateURL(args[0])) return message.reply("Please enter a valid Youtube URL!");
            if (!voiceChannel || voiceChannel != message.guild.voiceData.channel) return message.reply("Please join the Voice channel I'm in to add to the song queue")
            message.guild.voiceData.queue.push(args[0]);
            message.guild.voiceData.requesters.push(message.member);
            message.channel.send("**Song Queued!**");
        }

        process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));
    },
    nextSong: async function(message) {
        let guild = message.guild;
        if (!guild.voiceData.stopping) {
            guild.voiceData.queue.shift();
            guild.voiceData.requesters.shift();
            if (guild.voiceData.queue.length < 1) {
                guild.voiceData.channel.leave();
                guild.voiceData = undefined;
            } else {
                var info = await ytdl.getBasicInfo(guild.voiceData.queue[0]);
                var title = info.videoDetails.title;
                var time = `${Math.floor(info.videoDetails.lengthSeconds / 60)}:${info.videoDetails.lengthSeconds - (Math.floor(info.videoDetails.lengthSeconds / 60) * 60)}`
                let stream = ytdl(guild.voiceData.queue[0], { filter: 'audioonly', highWaterMark: 1<<25 });
                let dispatcher = guild.voiceData.connection.playStream(stream);
                guild.voiceData.dispatcher = dispatcher;
                var requester = guild.voiceData.requesters[0].nickname || guild.voiceData.requesters[0].user.username
                //message.channel.send(`**Now Playing: ${guild.voiceData.queue[0]}**`)
                const embed = {
                	title: "Now Playing",
                	color: 0xFF0000,
                	fields: [
                			{ name: "Title", value: title || "Error Getting Title" },
                            { name: "URL", value: guild.voiceData.queue[0] },
                            { name: "Length", value: time },
                            { name: "Requester", value: requester }
                		],
                	timestamp: new Date(),
                	footer: { text: `${message.client.user.username} • Brought to you By ${message.member.nickname || message.member.user.username}` }
                };
                
                message.channel.send({ embed: embed });
                console.log(`[${new Date()}] [${guild.name}] Now Playing Changed to "${title}"[${guild.voiceData.queue[0]}]`);
                //message.channel.send(`**Now Playing: ${title || guild.voiceData.queue[0]}**`);

                dispatcher.on('end', () => {
                    module.exports.nextSong(message);
                });
            }
        }
    }
};