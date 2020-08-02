const { prefix } = require("../config.json")
module.exports = {
    name: "skip",
    description: "Skip the Current Song",
    guildOnly: true,
    execute(message, args) {
        console.log(`[${new Date()}] Skip Command Executed by ${message.author.username}`)
        let guild = message.guild;
        if (!guild.voiceData) return message.reply("Nothing is Playing at the Moment!");
        if (guild.voiceData.queue.length < 2) return message.reply(`There are no more songs in the queue! please use \`${prefix}stop\` instead!`);
        let dispatcher = guild.voiceData.dispatcher;
        dispatcher.destroy();
    }
}