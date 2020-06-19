const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const YouTube = require("simple-youtube-api");
const { prefix, token, youtube_api_key } = require('./config.json');

client.on('ready', () => {
  console.log(`としてログイン ${client.user.tag}！`);
  console.log(client.guilds.cache.size);
  client.user.setActivity(`${prefix}助けて // ${prefix}help`, { type: 'PLAYING' });
});

const youtube = new YouTube(youtube_api_key);
const queue = new Map();
const { Util } = require("discord.js");

client.on('message', async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.split(" ");
  const searchString = args.slice(1).join(" ");
  const url = args[1] ? args[1].replace(/<(.+)>/g, "$1") : "";
  const serverQueue = queue.get(msg.guild.id);

  let command = msg.content.toLowerCase().split(" ")[0];
  command = command.slice(prefix.length);

  if (command === "演奏する" || command === "play") {
      const voiceChannel = msg.member.voice.channel;
      if (!voiceChannel) return msg.channel.send("音楽モジュールを使用するには、音声チャンネルにいる必要があります！");
      const permissions = voiceChannel.permissionsFor(msg.client.user);
      if (!permissions.has("CONNECT")) {
          return msg.channel.send("申し訳ありませんが、続行するには **`接続`** 権限が必要です！");
      }
      if (!permissions.has("SPEAK")) {
          return msg.channel.send("申し訳ありませんが、続行するには **`発言`** 権限が必要です！");
      }
      if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
          const playlist = await youtube.getPlaylist(url);
          const videos = await playlist.getVideos();
          for (const video of Object.values(videos)) {
              const video2 = await youtube.getVideoByID(video.id);
              await handleVideo(video2, msg, voiceChannel, true);
          }
          return msg.channel.send(`🔊 再生リスト： **\`${playlist.title}\`** キューに追加されました！`);
      } else {
          try {
              var video = await youtube.getVideo(url);
          } catch (error) {
              try {
                  var videos = await youtube.searchVideos(searchString, 10);
                  var video = await youtube.getVideoByID(videos[0].id);
                  if (!video) return msg.channel.send("❌ 結果が見つかりません。");
              } catch (err) {
                  console.error(err);
                  return msg.channel.send("❌ 結果が見つかりません。");
              }
          }
          return handleVideo(video, msg, voiceChannel);
      }
  }
  if (command === "サーチ" || command === "search") {
      const voiceChannel = msg.member.voice.channel;
      if (!voiceChannel) return msg.channel.send("音楽モジュールを使用するには、音声チャンネルにいる必要があります！");
      const permissions = voiceChannel.permissionsFor(msg.client.user);
      if (!permissions.has("CONNECT")) {
          return msg.channel.send("申し訳ありませんが、続行するには **`接続`** 権限が必要です！");
      }
      if (!permissions.has("SPEAK")) {
          return msg.channel.send("申し訳ありませんが、続行するには **`発言`** 権限が必要です！");
      }
      if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
          const playlist = await youtube.getPlaylist(url);
          const videos = await playlist.getVideos();
          for (const video of Object.values(videos)) {
              const video2 = await youtube.getVideoByID(video.id);
              await handleVideo(video2, msg, voiceChannel, true);
          }
          return msg.channel.send(`🔊 再生リスト： **\`${playlist.title}\`** キューに追加されました！`);
      } else {
          try {
              var video = await youtube.getVideo(url);
          } catch (error) {
              try {
                  var videos = await youtube.searchVideos(searchString, 10);
                  let index = 0;
                  msg.channel.send(`
__**選曲**__
${videos.map(video2 => `**\`${++index}\`  |**  ${video2.title}`).join("\n")}
検索結果を選択するには、1〜10の数値を入力してください。
        `);
                  try {
                      var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                          max: 1,
                          time: 10000,
                          errors: ["time"]
                      });
                  } catch (err) {
                      console.error(err);
                      return msg.channel.send("入力されていないか、無効な値が入力されています。 ビデオの選択はキャンセルされます...");
                  }
                  const videoIndex = parseInt(response.first().content);
                  var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
              } catch (err) {
                  console.error(err);
                  return msg.channel.send("❌ 結果が見つかりません。");
              }
          }
          return handleVideo(video, msg, voiceChannel);
      }

  } else if (command === "助けて" || command === "help") {
    msg.channel.send(`${msg.author} ヘルプモジュールでメッセージを送信しました (DM)！`);
    msg.author.send(`**__これはすべてのコマンドのリストです。__**\n\n**__コマンド：__**\n\n${prefix}演奏する - ビデオまたはプレイリストを再生します。 (${prefix}play)\n${prefix}サーチ - ビデオまたはプレイリストを検索します。 (${prefix}search)\n${prefix}スキップ - 現在の動画をスキップします。 (${prefix}skip)\n${prefix}やめる - 現在のキューを停止します。 (${prefix}stop)\n${prefix}ボリューム - ボットのボリュームを管理します。 (${prefix}volume)\n${prefix}再生中 - 現在再生中の動画を表示します。 (${prefix}nowplaying)\n${prefix}キュー - 現在のビデオキューを表示します。 (${prefix}queue)\n${prefix}一時停止 - 現在再生中のビデオを一時停止します。 (${prefix}pause)\n${prefix}履歴書 - 現在一時停止中の動画を再開します。 (${prefix}resume)\n${prefix}ループ - 現在再生中のビデオをループします。 (${prefix}loop)\n\n**__エラーまたはヘルプが必要ですか？__**\n\nチェックアウト： https://github.com/notmaxi/japanese-music-bot`);

  } else if (command === "スキップ" || command === "skip") {
      if (!msg.member.voice.channel) return msg.channel.send("音楽モジュールを使用するには、音声チャンネルにいる必要があります！");
      if (!serverQueue) return msg.channel.send("私があなたのために **\`スキップ\`** ことができる演奏は何もありません。");
      serverQueue.connection.dispatcher.end("スキップ機能を利用しました！");
      return msg.channel.send("⏩ スキップ機能を利用しました！");

  } else if (command === "やめる" || command === "stop") {
      if (!msg.member.voice.channel) return msg.channel.send("音楽モジュールを使用するには、音声チャンネルにいる必要があります！");
      if (!serverQueue) return msg.channel.send("私があなたのために **\`やめる\`** ことができる演奏は何もありません。");
      serverQueue.songs = [];
      serverQueue.connection.dispatcher.end("ストップ機能を利用しました！");
      return msg.channel.send("📭 ストップ機能を利用しました！");

  } else if (command === "ボリューム" || command === "volume") {
      if (!msg.member.voice.channel) return msg.channel.send("音楽モジュールを使用するには、音声チャンネルにいる必要があります！");
      if (!serverQueue) return msg.channel.send("現在何も再生されていません。");
      if (!args[1]) return msg.channel.send(`現在のボリュームは次のとおりです： **\`${serverQueue.volume}%\`**`);
      if (isNaN(args[1]) || args[1] > 100) return msg.channel.send("ボリュームは**1**から**100**の間でなければなりません。");
      serverQueue.volume = args[1];
      serverQueue.connection.dispatcher.setVolume(args[1] / 100);
      return msg.channel.send(`音量は次のように設定されました： **\`${args[1]}%\`**`);

  } else if (command === "再生中" || command === "nowplaying") {
      if (!serverQueue) return msg.channel.send("現在何も再生されていません。");
      return msg.channel.send(`🎶 再生中： **\`${serverQueue.songs[0].title}\`**`);

  } else if (command === "キュー" || command === "queue") {
      if (!serverQueue) return msg.channel.send("現在何も再生されていません。");
      return msg.channel.send(`
__**Song Queue**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join("\n")}
**再生中： \`${serverQueue.songs[0].title}\`**
      `);

  } else if (command === "一時停止" || command === "pause") {
      if (serverQueue && serverQueue.playing) {
          serverQueue.playing = false;
          serverQueue.connection.dispatcher.pause();
          return msg.channel.send("⏸ 音楽が一時停止しました！");
      }
      return msg.channel.send("現在何も再生されていません。");

  } else if (command === "履歴書" | command === "resume") {
      if (serverQueue && !serverQueue.playing) {
          serverQueue.playing = true;
          serverQueue.connection.dispatcher.resume();
          return msg.channel.send("⏯️ 音楽が再開されました！");
      }
      return msg.channel.send("現在何も再生されていません。");
  } else if (command === "ループ" | command === "loop") {
      if (serverQueue) {
          serverQueue.loop = !serverQueue.loop;
          return msg.channel.send(`🔂 ループ ${serverQueue.loop === true ? "有効" : "無効"}！`);
      };
      return msg.channel.send("現在何も再生されていません。");
  }
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
  const serverQueue = queue.get(msg.guild.id);
  const song = {
      id: video.id,
      title: Util.escapeMarkdown(video.title),
      url: `https://www.youtube.com/watch?v=${video.id}`
  };
  if (!serverQueue) {
      const queueConstruct = {
          textChannel: msg.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: [],
          volume: 100,
          playing: true,
          loop: false
      };
      queue.set(msg.guild.id, queueConstruct);

      queueConstruct.songs.push(song);

      try {
          var connection = await voiceChannel.join();
          queueConstruct.connection = connection;
          play(msg.guild, queueConstruct.songs[0]);
      } catch (error) {
          console.error(`音声チャネルに参加できません： ${error}`);
          queue.delete(msg.guild.id);
          return msg.channel.send(`音声チャネルに参加できません： **\`${error}\`**`);
      }
  } else {
      serverQueue.songs.push(song);
      if (playlist) return;
      else return msg.channel.send(`🔊 **\`${song.title}\`** キューに追加されました！`);
  }
  return;
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
      serverQueue.voiceChannel.leave();
      return queue.delete(guild.id);
  }

  const dispatcher = serverQueue.connection.play(ytdl(song.url))
      .on("finish", () => {
          const shiffed = serverQueue.songs.shift();
          if (serverQueue.loop === true) {
              serverQueue.songs.push(shiffed);
          };
          play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
  dispatcher.setVolume(serverQueue.volume / 100);

  serverQueue.textChannel.send(`🎶 再生を開始しました： **\`${song.title}\`**`);
}

client.login(token);
