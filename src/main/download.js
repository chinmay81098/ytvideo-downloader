import { ipcMain } from "electron";
const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require("ffmpeg-static");
const path = require("path");
const exec = require("child_process").exec;
var vidList = [];
if (require("os").platform() === "win32") {
  const pathToDownloads = `${process.env.HOME}\\Downloads`;
  var pathToAll = `${pathToDownloads}\\YTvideo2\\`;
  var pathToMerged = `${pathToDownloads}\\YTvideoMerged2/`;
} else {
  const pathToDownloads = `${process.env.HOME}/Downloads`;
  var pathToAll = `${pathToDownloads}/YTvideo1/`;
  var pathToMerged = `${pathToDownloads}/YTvideoMerged1/`;
}

if (!fs.existsSync("intermediate")) {
  fs.mkdirSync("intermediate");
}

async function mergeVideos(inputVideos, pathToMerged, e) {
  var ffmpeger = "";
  ffmpeger = inputVideos
    .map(
      (video) =>
        `${ffmpeg} -y -i ${video} -c copy -bsf:v h264_mp4toannexb -f mpegts intermediate/${
          path.parse(video).name
        }.ts `
    )
    .join("&&");
  var concatenator = '"concat:';
  concatenator += inputVideos
    .map((video) => `intermediate/${path.parse(video).name}.ts`)
    .join("|");
  concatenator += '"';
  var outputName = inputVideos.map((video) => path.parse(video).name).join("+");
  var mergecmd = `${ffmpeg} -y -i ${concatenator} -c copy -bsf:a aac_adtstoasc ${pathToMerged}${outputName}.mp4`;
  exec(`${ffmpeger} && ${mergecmd}`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      e.sender.send("Error", "Error while merging");
      return;
    }
    e.sender.send("Merge-complete", "All videos merged successfuly");
  });
}

function downloadAll(e, pathToAll, urlList) {
  let videoId = [];
  var videoList = [];
  var videoTitle = [];
  var downloadComplete = 0;
  urlList.forEach((url) => {
    videoList[url] = ytdl(url);
    var videoPath = pathToAll + `${path.parse(url).name.split('=')[1]}.mp4`;
    vidList.push(videoPath);
    videoList[url].pipe(fs.createWriteStream(videoPath));
    videoList[url].on("progress", (chunkLength, downloaded, total) => {
      e.sender.send('downloading',[downloaded,total])
    });
    videoList[url].on("end", () => {
      downloadComplete++;
      if (downloadComplete == urlList.length) {
        e.sender.send(
          "download-complete",
          `Downloaded ${urlList.length} videos successfuly`
        );
      }
    });
  });
}

ipcMain.on("download-all", (e, urlList) => {
  if (!fs.existsSync(pathToAll)) {
    fs.mkdirSync(pathToAll);
  }
  downloadAll(e, pathToAll, urlList);
});

ipcMain.on("merge", (e, arg) => {
  if (!fs.existsSync(pathToMerged)) {
    fs.mkdirSync(pathToMerged);
  }
  mergeVideos(vidList, pathToMerged, e);
});

